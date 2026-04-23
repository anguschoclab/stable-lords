import type { GameState, RivalStableData, SeasonalGrowth } from '@/types/state.types';
import type { Attributes, Season } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import { checkBudget } from './budgetWorker';
import { computeWarriorStats } from '../../skillCalc';
import { logAgentAction } from '../agentCore';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { generateRecommendations } from '@/engine/equipmentOptimizer';
import { validateLoadout, checkWeaponRequirements } from '@/data/equipment';
import {
  processAttributeTraining,
  processRecovery,
  processSkillDrillTraining,
  rollForTrainingInjury,
  SKILL_DRILL_CAP,
  TOTAL_CAP,
} from '@/engine/training/trainingGains';
import { getHealingTrainerBonus } from '@/engine/training/coachLogic';
import {
  ATTRIBUTE_KEYS,
  ATTRIBUTE_MAX,
  FightingStyle,
  type BaseSkills,
} from '@/types/shared.types';
import { getFeatureFlags } from '@/engine/featureFlags';

/**
 * RosterWorker: Handles training and equipment.
 * Implements "Risk-Tiered Execution" for gear.
 */
export function processRoster(
  rival: RivalStableData,
  currentWeek: number,
  season?: Season,
  seed?: number,
  rng?: IRNGService
): RivalStableData {
  const rngService = rng || new SeededRNGService(seed ?? currentWeek * 7919 + 101);
  let updatedRival = { ...rival };
  let seasonalGrowth: SeasonalGrowth[] = updatedRival.seasonalGrowth ?? [];
  const activeRoster = updatedRival.roster.filter((w) => w.status === 'Active');
  const intent = updatedRival.strategy?.intent ?? 'CONSOLIDATION';

  // 0. Recovery — tick injuries for all active wounded warriors, applying any
  // healing trainer bonus exactly as the player path does in training.ts.
  const healingBonus = getHealingTrainerBonus(updatedRival.trainers ?? []);
  for (const wounded of activeRoster.filter((w) => (w.injuries ?? []).length > 0)) {
    const { updatedInjuries } = processRecovery(wounded, healingBonus);
    updatedRival.roster = updatedRival.roster.map((w) =>
      w.id === wounded.id ? { ...w, injuries: updatedInjuries } : w
    );
  }

  // 1. Training (Low Risk)
  // ⚡ TSA: Prioritize Champion or high-fame units for training.
  // Injured warriors are excluded — they are already in the recovery path above
  // and training them would stack the injury penalty from trainingGains.ts.
  const trainingLimit = updatedRival.treasury > 500 ? 3 : 1;
  const trainees = updatedRival.roster
    .filter((w) => w.status === 'Active' && (w.injuries ?? []).length === 0)
    .sort((a, b) => (a.fame || 0) - (b.fame || 0))
    .slice(0, trainingLimit);

  for (const trainee of trainees) {
    const trainingCost = 35;
    const budgetReport = checkBudget(updatedRival, trainingCost, 'ROSTER');

    if (budgetReport.isAffordable) {
      updatedRival.treasury -= trainingCost;
      // With the `skillDrilling` feature flag on, roughly 1-in-4 AI training
      // weeks spend on skill drilling instead of attribute training — same
      // option surface the player has in the TrainingAssignment UI. Below the
      // cap a drill is comparatively cheap and the attribute pipeline handles
      // the rest of the time.
      const doDrill = getFeatureFlags().skillDrilling && rngService.next() < 0.25;
      if (doDrill) {
        updatedRival.roster = updatedRival.roster.map((w) =>
          w.id === trainee.id ? performAISkillDrill(trainee, updatedRival, rngService) : w
        );
      } else {
        const { warrior, seasonalGrowth: nextGrowth } = performAITraining(
          trainee,
          updatedRival,
          season,
          seasonalGrowth,
          rngService,
          healingBonus
        );
        seasonalGrowth = nextGrowth;
        updatedRival.roster = updatedRival.roster.map((w) => (w.id === warrior.id ? warrior : w));
      }
    }
  }
  updatedRival.seasonalGrowth = seasonalGrowth;

  // 2. Equipment (High Risk)
  if (intent === 'EXPANSION' || (intent === 'VENDETTA' && updatedRival.treasury > 1000)) {
    const gearCost = 150;
    const budgetReport = checkBudget(updatedRival, gearCost, 'ROSTER');

    if (budgetReport.isAffordable && activeRoster.length > 0) {
      // ⚡ TSA: Role-Based Gearing (Prioritize Champion or the 'Muddy' Basher for rain insurance)
      const gearCandidate =
        activeRoster.find((w) => w.champion) ||
        activeRoster.find((w) => w.style === 'BASHING ATTACK') ||
        rngService.pick(activeRoster);

      if (gearCandidate) {
        updatedRival.treasury -= gearCost;
        updatedRival.roster = updatedRival.roster.map((w) =>
          w.id === gearCandidate.id ? applyGearUpgrade(w, rngService) : w
        );
        updatedRival = logAgentAction(
          updatedRival,
          'ROSTER',
          `Invested 150g in gear for ${gearCandidate.name}.`,
          budgetReport.riskTier,
          currentWeek
        );
      }
    }
  }

  return updatedRival;
}

/**
 * Apply an equipment upgrade — validated through the same loadout + weapon-
 * requirement gates the player hits via `StableEquipment.tsx`. Walks the
 * optimizer recommendations in synergy order, skipping any that fail
 * `validateLoadout` (catches two-handed + shield) or `checkWeaponRequirements`
 * (ST/SZ/WT/DF gates). If every recommendation fails, the warrior is returned
 * untouched — no attribute nudge, no invalid gear applied.
 *
 * Historical note: the previous implementation didn't write `warrior.equipment`
 * at all — it just incremented attributes based on the top recommendation's
 * weight profile. That made the function a misnamed attribute nudger *and*
 * skipped every validation gate. We now do the job on the tin and honor the
 * shared validator.
 */
function applyGearUpgrade(w: Warrior, _rng: IRNGService): Warrior {
  const recommendations = generateRecommendations(w.style, w.attributes.SZ);
  const attrs = {
    ST: w.attributes.ST,
    SZ: w.attributes.SZ,
    WT: w.attributes.WT,
    DF: w.attributes.DF,
  };

  for (const rec of recommendations) {
    const loadoutIssues = validateLoadout(rec.loadout);
    if (loadoutIssues.length > 0) continue;
    const wepReq = checkWeaponRequirements(rec.loadout.weapon, attrs);
    if (!wepReq.met) continue;
    // Validated loadout wins — apply to the warrior.
    return { ...w, equipment: { ...rec.loadout } };
  }
  return w;
}

/**
 * AI training runs at ~80% player effectiveness per the Training Mechanics spec.
 * The 80% lever is a **pre-gate** on whether the week attempts training at all;
 * once we decide to attempt, the full shared pipeline runs so potential caps,
 * `TOTAL_CAP`, `SEASONAL_CAP_PER_ATTR`, diminishing returns, trainer bonuses,
 * and injury rolls all fire exactly the same way they do for the player.
 *
 * Net gain rate = 0.8 × `computeGainChance(...)` (modulo pipeline gates),
 * which matches the spec's multiplicative-effectiveness intent.
 */
const AI_TRAINING_EFFECTIVENESS = 0.8;

/** SeasonalGrowth is shared across a stable's roster, so we thread it through the loop. */
function performAITraining(
  w: Warrior,
  stable: RivalStableData,
  season: Season | undefined,
  seasonalGrowth: SeasonalGrowth[],
  rng: IRNGService,
  healingBonus: number = 0
): { warrior: Warrior; seasonalGrowth: SeasonalGrowth[] } {
  // 80% pre-gate — preserves the spec's AI-at-80%-effectiveness lever while
  // still routing through the full pipeline on the weeks it attempts.
  if (rng.next() >= AI_TRAINING_EFFECTIVENESS) return { warrior: w, seasonalGrowth };

  // Total-attribute hard cap check — cheaper to short-circuit here than to
  // recompute inside `processAttributeTraining` for every attribute.
  const total = ATTRIBUTE_KEYS.reduce((sum, k) => sum + w.attributes[k], 0);
  if (total >= TOTAL_CAP) return { warrior: w, seasonalGrowth };

  // Focus selection — preserve the seasonal-priority heuristic the AI already
  // used (Spring→CN, Summer→ST), falling back to the lowest trainable stat.
  const trainableKeys = ATTRIBUTE_KEYS.filter((k) => k !== 'SZ') as (keyof Attributes)[];
  let chosen: keyof Attributes | undefined;
  if (season === 'Spring') chosen = 'CN';
  else if (season === 'Summer') chosen = 'ST';
  if (!chosen || w.attributes[chosen] >= ATTRIBUTE_MAX) {
    chosen = trainableKeys.reduce(
      (min, k) => (w.attributes[k] < w.attributes[min] ? k : min),
      trainableKeys[0]!
    );
  }
  if (!chosen) return { warrior: w, seasonalGrowth };

  // Adapter: `processAttributeTraining` expects a GameState for `season` and
  // `trainers`. Rivals don't have a full GameState, so we feed a minimal shape
  // with just the fields the pipeline reads.
  const stateAdapter = {
    season: season ?? 'Spring',
    trainers: stable.trainers ?? [],
  } as unknown as GameState;

  const attemptResult = processAttributeTraining(w, chosen, stateAdapter, seasonalGrowth, rng);
  let warrior = attemptResult.updatedWarrior ?? w;
  const nextSeasonalGrowth = attemptResult.updatedSeasonalGrowth ?? seasonalGrowth;

  // Training injury roll — same chance formula the player hits, now using the
  // rival's actual healing trainer bonus instead of a hardcoded 0.
  const injuryRoll = rollForTrainingInjury(warrior, healingBonus, rng);
  if (injuryRoll.injury) {
    warrior = { ...warrior, injuries: [...(warrior.injuries ?? []), injuryRoll.injury] };
  }

  // Recompute derived stats if the underlying attributes changed via the
  // pipeline (processAttributeTraining already does this, but injuries could
  // also modify attributes in a future pass — safe to re-derive defensively).
  if (warrior !== w) {
    const { baseSkills, derivedStats } = computeWarriorStats(warrior.attributes, warrior.style);
    warrior = { ...warrior, baseSkills, derivedStats };
  }

  return { warrior, seasonalGrowth: nextSeasonalGrowth };
}

/**
 * Style → primary drilled skill. Mirrors the player's implicit affinity when
 * they pick a drill focus in the Training UI — a BashingAttack fighter drills
 * ATT, a TotalParry fighter drills PAR, etc. Kept as a small lookup rather
 * than style-passive-derived so future style rebalances don't silently
 * reroute AI drill priorities.
 */
const STYLE_PRIMARY_DRILL: Record<FightingStyle, keyof BaseSkills> = {
  [FightingStyle.AimedBlow]: 'DEC',
  [FightingStyle.BashingAttack]: 'ATT',
  [FightingStyle.LungingAttack]: 'ATT',
  [FightingStyle.ParryLunge]: 'PAR',
  [FightingStyle.ParryRiposte]: 'RIP',
  [FightingStyle.ParryStrike]: 'PAR',
  [FightingStyle.SlashingAttack]: 'ATT',
  [FightingStyle.StrikingAttack]: 'ATT',
  [FightingStyle.TotalParry]: 'PAR',
  [FightingStyle.WallOfSteel]: 'DEF',
};

const DRILLABLE_SKILLS: (keyof BaseSkills)[] = ['ATT', 'PAR', 'DEF', 'INI', 'RIP', 'DEC'];

/**
 * Skill drilling for AI warriors — routes through the shared
 * `processSkillDrillTraining` pipeline so cap (`SKILL_DRILL_CAP=3`),
 * chance formula, and trainer-focus bonus are all evaluated identically
 * to the player path.
 *
 * Focus policy: prefer the style's primary skill if still below the drill
 * cap; otherwise pick the lowest-drilled skill overall so a capped warrior
 * still benefits from the week's training slot rather than no-op-ing.
 */
function performAISkillDrill(w: Warrior, stable: RivalStableData, rng: IRNGService): Warrior {
  const primary = STYLE_PRIMARY_DRILL[w.style as FightingStyle];
  const drills = w.skillDrills ?? {};
  let skill: keyof BaseSkills | undefined;
  if (primary && (drills[primary] ?? 0) < SKILL_DRILL_CAP) {
    skill = primary;
  } else {
    // Fall back to the least-drilled still-below-cap skill; ties broken by
    // declaration order in DRILLABLE_SKILLS.
    let bestCount = SKILL_DRILL_CAP;
    for (const s of DRILLABLE_SKILLS) {
      const c = drills[s] ?? 0;
      if (c < bestCount) {
        bestCount = c;
        skill = s;
      }
    }
  }
  if (!skill) return w; // All skills at cap — nothing to drill.

  const stateAdapter = { trainers: stable.trainers ?? [] } as unknown as GameState;
  const { updatedWarrior } = processSkillDrillTraining(w, skill, stateAdapter, rng);
  return updatedWarrior ?? w;
}
