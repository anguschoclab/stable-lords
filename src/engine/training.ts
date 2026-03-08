/**
 * Training System — Enhanced per Training Mechanics Spec v1.0
 *
 * Features:
 * - Attribute training with trainer bonuses, WT bonus, age penalty
 * - Seasonal growth caps (3 per attribute per season)
 * - Training injury risk (3% base, minor only)
 * - Active Recovery mode (accelerated healing)
 * - SZ cannot be trained
 * - Diminishing returns from potential system
 */
import type { GameState, TrainingAssignment, SeasonalGrowth, Warrior, InjuryData } from "@/types/game";
import { ATTRIBUTE_KEYS, ATTRIBUTE_MAX, type Attributes } from "@/types/game";
import { computeWarriorStats } from "@/engine/skillCalc";
import { canGrow, diminishingReturnsFactor } from "@/engine/potential";
import type { TrainerFocus } from "@/engine/trainers";
import { TIER_BONUS } from "@/engine/trainers";

// ─── Constants ────────────────────────────────────────────────────────────

const TOTAL_CAP = 80;
const BASE_GAIN_CHANCE = 0.55;
const SEASONAL_CAP_PER_ATTR = 3;
const BASE_TRAINING_INJURY_CHANCE = 0.03;
const GAIN_CHANCE_MIN = 0.15;
const GAIN_CHANCE_MAX = 0.85;
const INJURY_CHANCE_MIN = 0.01;
const INJURY_CHANCE_MAX = 0.10;

// ─── Focus → Attribute mapping ────────────────────────────────────────────

const FOCUS_ATTR_MAP: Record<TrainerFocus, (keyof Attributes)[]> = {
  Aggression: ["ST", "SP"],
  Defense: ["CN", "WL"],
  Endurance: ["CN", "WL", "ST"],
  Mind: ["WT", "DF"],
  Healing: [],
};

// ─── Training Injuries ────────────────────────────────────────────────────

const TRAINING_INJURIES: { name: string; description: string; penalties: Record<string, number>; weeksRange: [number, number] }[] = [
  { name: "Pulled Muscle", description: "Overextended during drills.", penalties: { ST: -1 }, weeksRange: [1, 2] },
  { name: "Twisted Knee", description: "Bad footing on the training ground.", penalties: { SP: -1 }, weeksRange: [1, 2] },
  { name: "Sparring Cut", description: "A careless training partner.", penalties: { CN: -1 }, weeksRange: [1, 1] },
  { name: "Strained Back", description: "Lifted too heavy in the yard.", penalties: { ST: -1, CN: -1 }, weeksRange: [2, 3] },
  { name: "Practice Concussion", description: "Took a hard knock to the head.", penalties: { WT: -1 }, weeksRange: [2, 3] },
];

// ─── Trainer Bonus Calculation ────────────────────────────────────────────

function computeTrainerBonus(
  attribute: keyof Attributes,
  trainers: GameState["trainers"],
  warriorStyle: Warrior["style"]
): number {
  let bonus = 0;
  for (const t of trainers) {
    if (t.contractWeeksLeft <= 0) continue;
    const focus = t.focus as TrainerFocus;
    const relevantAttrs = FOCUS_ATTR_MAP[focus] ?? [];
    if (relevantAttrs.includes(attribute)) {
      bonus += TIER_BONUS[t.tier as keyof typeof TIER_BONUS] ?? 0;
    }
    // Style affinity bonus
    if (t.styleBonusStyle === warriorStyle) {
      bonus += 1;
    }
  }
  return bonus * 0.05; // each point = +5%
}

function getHealingTrainerBonus(trainers: GameState["trainers"]): number {
  let bonus = 0;
  for (const t of trainers) {
    if (t.contractWeeksLeft <= 0) continue;
    if (t.focus === "Healing") {
      bonus += TIER_BONUS[t.tier as keyof typeof TIER_BONUS] ?? 0;
    }
  }
  return bonus;
}

// ─── Seasonal Growth Tracking ─────────────────────────────────────────────

function getSeasonalGains(
  seasonalGrowth: SeasonalGrowth[],
  warriorId: string,
  season: string
): Partial<Record<keyof Attributes, number>> {
  const entry = seasonalGrowth.find(sg => sg.warriorId === warriorId && sg.season === season);
  return entry?.gains ?? {};
}

function updateSeasonalGains(
  seasonalGrowth: SeasonalGrowth[],
  warriorId: string,
  season: string,
  attr: keyof Attributes
): SeasonalGrowth[] {
  const existing = seasonalGrowth.find(sg => sg.warriorId === warriorId && sg.season === season);
  if (existing) {
    return seasonalGrowth.map(sg =>
      sg === existing
        ? { ...sg, gains: { ...sg.gains, [attr]: (sg.gains[attr] ?? 0) + 1 } }
        : sg
    );
  }
  return [...seasonalGrowth, { warriorId, season: season as any, gains: { [attr]: 1 } }];
}

// ─── Gain Chance Calculator (exported for UI preview) ─────────────────────

export function computeGainChance(
  warrior: Warrior,
  attribute: keyof Attributes,
  trainers: GameState["trainers"]
): number {
  const trainerBonus = computeTrainerBonus(attribute, trainers, warrior.style);
  const wtBonus = ((warrior.attributes.WT ?? 10) - 10) * 0.01;
  const agePenalty = (warrior.age ?? 18) > 25 ? ((warrior.age! - 25) * 0.02) : 0;
  const hasInjury = warrior.injuries.length > 0;
  const injuryPenalty = hasInjury ? 0.10 : 0;

  const potentialVal = warrior.potential?.[attribute];
  const drFactor = diminishingReturnsFactor(warrior.attributes[attribute], potentialVal);

  const raw = (BASE_GAIN_CHANCE + trainerBonus + wtBonus - agePenalty - injuryPenalty) * drFactor;
  return Math.max(GAIN_CHANCE_MIN, Math.min(GAIN_CHANCE_MAX, raw));
}

// ─── Main Processing ──────────────────────────────────────────────────────

interface TrainingResult {
  type: "gain" | "injury" | "recovery" | "blocked";
  warriorId: string;
  message: string;
}

/** Process all training assignments at week-end. Returns updated state with cleared assignments. */
export function processTraining(state: GameState): GameState {
  if (!state.trainingAssignments || state.trainingAssignments.length === 0) return state;

  const results: TrainingResult[] = [];
  let roster = [...state.roster];
  let seasonalGrowth = [...(state.seasonalGrowth ?? [])];
  const healingBonus = getHealingTrainerBonus(state.trainers ?? []);

  for (const assignment of state.trainingAssignments) {
    const wIdx = roster.findIndex(w => w.id === assignment.warriorId);
    if (wIdx === -1) continue;
    const warrior = roster[wIdx];

    // ── Recovery Mode ──
    if (assignment.type === "recovery") {
      const activeInjuries = warrior.injuries.filter(
        i => typeof i !== "string" && i.weeksRemaining > 0
      ) as InjuryData[];

      if (activeInjuries.length === 0) {
        results.push({ type: "recovery", warriorId: warrior.id, message: `${warrior.name} rested but has no injuries to heal.` });
        continue;
      }

      // Heal 1 + healingBonus weeks of recovery per actual week
      const healAmount = 1 + healingBonus;
      const updatedInjuries = warrior.injuries.map(i => {
        if (typeof i === "string") return i;
        return { ...i, weeksRemaining: Math.max(0, i.weeksRemaining - healAmount) };
      }).filter(i => typeof i === "string" || i.weeksRemaining > 0);

      roster = roster.map((w, i) => i === wIdx ? { ...w, injuries: updatedInjuries } : w);
      results.push({
        type: "recovery",
        warriorId: warrior.id,
        message: `${warrior.name} underwent active recovery (${healAmount} weeks of healing).`,
      });
      continue;
    }

    // ── Attribute Training ──
    const attr = assignment.attribute;
    if (!attr) continue;

    // SZ cannot be trained
    if (attr === "SZ") {
      results.push({ type: "blocked", warriorId: warrior.id, message: `${warrior.name} cannot train Size — it is fixed at creation.` });
      continue;
    }

    const currentVal = warrior.attributes[attr];
    const potentialVal = warrior.potential?.[attr];
    const total = ATTRIBUTE_KEYS.reduce((sum, k) => sum + warrior.attributes[k], 0);

    // Hard caps
    if (currentVal >= ATTRIBUTE_MAX || total >= TOTAL_CAP) continue;
    if (!canGrow(currentVal, potentialVal)) continue;

    // Seasonal growth cap
    const seasonGains = getSeasonalGains(seasonalGrowth, warrior.id, state.season);
    if ((seasonGains[attr] ?? 0) >= SEASONAL_CAP_PER_ATTR) {
      results.push({
        type: "blocked",
        warriorId: warrior.id,
        message: `${warrior.name} has reached the seasonal cap for ${attr} (${SEASONAL_CAP_PER_ATTR} gains this season).`,
      });
      continue;
    }

    // Compute gain chance with all modifiers
    const gainChance = computeGainChance(warrior, attr, state.trainers ?? []);

    // Roll for gain
    if (Math.random() < gainChance) {
      const newAttrs = { ...warrior.attributes, [attr]: currentVal + 1 };
      const { baseSkills, derivedStats } = computeWarriorStats(newAttrs, warrior.style);
      roster = roster.map((w, i) =>
        i === wIdx ? { ...w, attributes: newAttrs, baseSkills, derivedStats } : w
      );
      seasonalGrowth = updateSeasonalGains(seasonalGrowth, warrior.id, state.season, attr);

      const nearCeiling = potentialVal !== undefined && (currentVal + 1) >= potentialVal;
      const ceilingNote = nearCeiling ? " (reached potential ceiling)" : "";
      results.push({
        type: "gain",
        warriorId: warrior.id,
        message: `${warrior.name} improved ${attr} to ${currentVal + 1} through training.${ceilingNote}`,
      });
    }

    // ── Training Injury Roll ──
    const age = warrior.age ?? 18;
    const agePenalty = age > 30 ? (age - 30) * 0.005 : 0;
    const healReduce = healingBonus * 0.01;
    const injuryChance = Math.max(INJURY_CHANCE_MIN, Math.min(INJURY_CHANCE_MAX,
      BASE_TRAINING_INJURY_CHANCE + agePenalty - healReduce
    ));

    if (Math.random() < injuryChance) {
      const template = TRAINING_INJURIES[Math.floor(Math.random() * TRAINING_INJURIES.length)];
      const [minW, maxW] = template.weeksRange;
      const weeks = minW + Math.floor(Math.random() * (maxW - minW + 1));
      const injury: InjuryData = {
        id: `tinj_${Date.now()}_${Math.floor(Math.random() * 1e5)}`,
        name: template.name,
        description: template.description,
        severity: "Minor",
        weeksRemaining: Math.max(1, weeks - healingBonus),
        penalties: template.penalties,
      };

      roster = roster.map((w, i) =>
        i === wIdx ? { ...w, injuries: [...w.injuries, injury] } : w
      );
      results.push({
        type: "injury",
        warriorId: warrior.id,
        message: `${warrior.name} suffered a ${template.name} during training! (${injury.weeksRemaining} week recovery)`,
      });
    }
  }

  // Build newsletter
  const newsItems = results.filter(r => r.type !== "blocked").map(r => r.message);
  const newsletter = newsItems.length > 0
    ? [...state.newsletter, { week: state.week, title: "Training Report", items: newsItems }]
    : state.newsletter;

  return {
    ...state,
    roster,
    newsletter,
    seasonalGrowth,
    trainingAssignments: [],
  };
}
