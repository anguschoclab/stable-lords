import {
  type GameState,
  type TrainingAssignment
} from "@/types/state.types";
import { type Warrior, type InjuryData } from "@/types/warrior.types";
import {
  type Attributes,
  type BaseSkills,
  ATTRIBUTE_KEYS,
  ATTRIBUTE_MAX
} from "@/types/shared.types";
import { type SeasonalGrowth } from "@/types/state.types";
import { canGrow, diminishingReturnsFactor } from "@/engine/potential";
import { computeWarriorStats } from "@/engine/skillCalc";
import type { IRNGService } from "@/engine/core/rng/IRNGService";
import { generateId } from "@/utils/idUtils";
import { computeTrainerBonus } from "./coachLogic";
import { getSeasonalGains, updateSeasonalGains } from "./facilityUpkeep";

export const TOTAL_CAP = 80;
export const BASE_GAIN_CHANCE = 0.55;
export const SEASONAL_CAP_PER_ATTR = 3;
export const BASE_TRAINING_INJURY_CHANCE = 0.03;
export const GAIN_CHANCE_MIN = 0.15;
export const GAIN_CHANCE_MAX = 0.85;
export const INJURY_CHANCE_MIN = 0.01;
export const INJURY_CHANCE_MAX = 0.10;

// ─── Skill Drilling ────────────────────────────────────────────────────────
// Drilling a combat skill (ATT/PAR/DEF/INI/RIP/DEC) grants a flat bonus on top
// of the attribute-derived baseSkills. Per-skill cap keeps drilling a supplement,
// not a replacement for attribute training.
export const SKILL_DRILL_CAP = 3;
export const SKILL_DRILL_BASE_CHANCE = 0.40;
export const SKILL_DRILL_GAIN_MIN = 0.15;
export const SKILL_DRILL_GAIN_MAX = 0.70;

export const SKILL_TRAINER_FOCUS: Record<keyof BaseSkills, import("@/types/shared.types").TrainerFocus> = {
  ATT: "Aggression",
  PAR: "Defense",
  DEF: "Defense",
  INI: "Mind",
  RIP: "Aggression",
  DEC: "Mind",
};

export const TRAINING_INJURIES = [
  { name: "Pulled Muscle", description: "Overextended during drills.", penalties: { ST: -1 }, weeksRange: [1, 2] },
  { name: "Twisted Knee", description: "Bad footing on the training ground.", penalties: { SP: -1 }, weeksRange: [1, 2] },
  { name: "Sparring Cut", description: "A careless training partner.", penalties: { CN: -1 }, weeksRange: [1, 1] },
  { name: "Strained Back", description: "Lifted too heavy in the yard.", penalties: { ST: -1, CN: -1 }, weeksRange: [2, 3] },
  { name: "Practice Concussion", description: "Took a hard knock to the head.", penalties: { WT: -1 }, weeksRange: [2, 3] },
];

export interface TrainingResult {
  type: "gain" | "injury" | "recovery" | "blocked";
  warriorId: string;
  message: string;
  attr?: keyof Attributes;
  gain?: number;
}

/**
 * Gain Chance Calculator (exported for UI preview)
 */
export function computeGainChance(
  warrior: Warrior,
  attribute: keyof Attributes,
  trainers: GameState["trainers"]
): number {
  const trainerBonus = computeTrainerBonus(attribute, trainers, warrior.style);
  const wtBonus = ((warrior.attributes.WT ?? 10) - 10) * 0.01;
  const agePenalty = (warrior.age ?? 18) > 25 ? (((warrior.age ?? 18) - 25) * 0.02) : 0;
  const hasInjury = warrior.injuries.length > 0;
  const injuryPenalty = hasInjury ? 0.10 : 0;

  const potentialVal = warrior.potential?.[attribute];
  const drFactor = diminishingReturnsFactor(warrior.attributes[attribute], potentialVal);

  const raw = (BASE_GAIN_CHANCE + trainerBonus + wtBonus - agePenalty - injuryPenalty) * drFactor;
  return Math.max(GAIN_CHANCE_MIN, Math.min(GAIN_CHANCE_MAX, raw));
}

export function processAttributeTraining(
  warrior: Warrior,
  attr: keyof Attributes,
  state: GameState,
  seasonalGrowth: SeasonalGrowth[],
  rng: IRNGService
): { updatedWarrior: Warrior | null, updatedSeasonalGrowth: SeasonalGrowth[] | null, result: TrainingResult, hardCapped?: boolean } {
  // SZ cannot be trained
  if (attr === "SZ") {
    return { updatedWarrior: null, updatedSeasonalGrowth: null, result: { type: "blocked", warriorId: warrior.id, message: `${warrior.name} cannot train Size — it is fixed at creation.` } };
  }

  const currentVal = warrior.attributes[attr];
  const potentialVal = warrior.potential?.[attr];
  const total = ATTRIBUTE_KEYS.reduce((sum, k) => sum + warrior.attributes[k], 0);

  // Hard caps
  if (currentVal >= ATTRIBUTE_MAX || total >= TOTAL_CAP) return { updatedWarrior: null, updatedSeasonalGrowth: null, result: { type: "blocked", warriorId: warrior.id, message: "" }, hardCapped: true };
  if (!canGrow(currentVal, potentialVal)) return { updatedWarrior: null, updatedSeasonalGrowth: null, result: { type: "blocked", warriorId: warrior.id, message: "" }, hardCapped: true };

  // Seasonal growth cap
  const seasonGains = getSeasonalGains(seasonalGrowth, warrior.id, state.season);
  if ((seasonGains[attr] ?? 0) >= SEASONAL_CAP_PER_ATTR) {
    return {
      updatedWarrior: null,
      updatedSeasonalGrowth: null,
      result: {
        type: "blocked",
        warriorId: warrior.id,
        message: `${warrior.name} has reached the seasonal cap for ${attr} (${SEASONAL_CAP_PER_ATTR} gains this season).`,
      }
    };
  }

  // Compute gain chance with all modifiers
  const gainChance = computeGainChance(warrior, attr, state.trainers ?? []);

  // Roll for gain
  if (rng.next() < gainChance) {
    const newAttrs = { ...warrior.attributes, [attr]: currentVal + 1 };
    const { baseSkills, derivedStats } = computeWarriorStats(newAttrs, warrior.style);

    const newRevealed = { ...(warrior.potentialRevealed || {}) };
    let newlyRevealed = false;

    const nearCeiling = potentialVal !== undefined && (currentVal + 1) >= potentialVal;
    if (nearCeiling && !newRevealed[attr]) {
      newRevealed[attr] = true;
      newlyRevealed = true;
    }

    const ceilingNote = nearCeiling ? " (reached potential ceiling)" : "";

    const updatedWarrior = { ...warrior, attributes: newAttrs, baseSkills, derivedStats, potentialRevealed: newRevealed };
    const updatedSeasonalGrowth = updateSeasonalGains(seasonalGrowth, warrior.id, state.season, attr);

    return {
      updatedWarrior,
      updatedSeasonalGrowth,
      result: {
        type: "gain",
        warriorId: warrior.id,
        attr,
        gain: 1,
        message: `${warrior.name} improved ${attr} to ${currentVal + 1} through training.${ceilingNote}${newlyRevealed ? ` Their true potential in ${attr} is now fully revealed!` : ""}`,
      }
    };
  } else {
    // Failed to gain, but might still reveal potential from hard work!
    const isRevealed = warrior.potentialRevealed?.[attr];
    if (!isRevealed && rng.next() < 0.20) {
      const newRevealed = { ...(warrior.potentialRevealed || {}), [attr]: true };
      return {
        updatedWarrior: { ...warrior, potentialRevealed: newRevealed },
        updatedSeasonalGrowth: null,
        result: {
          type: "gain",
          warriorId: warrior.id,
          message: `${warrior.name} didn't improve their ${attr} this week, but their true potential in it was revealed from their efforts!`,
        }
      };
    }
  }

  return { updatedWarrior: null, updatedSeasonalGrowth: null, result: { type: "blocked", warriorId: warrior.id, message: "" } };
}

export function computeSkillDrillChance(
  warrior: Warrior,
  skill: keyof BaseSkills,
  trainers: GameState["trainers"]
): number {
  const focus = SKILL_TRAINER_FOCUS[skill];
  // Lean on trainer focus/affinity: a matching-focus trainer gives a modest boost.
  let trainerBonus = 0;
  for (const t of trainers) {
    if (t.contractWeeksLeft <= 0) continue;
    if (t.focus === focus) {
      // TIER_BONUS lives in engine/trainers; fall back to 1 if unavailable to keep this module self-contained.
      trainerBonus += 1;
    }
    if (t.styleBonusStyle === warrior.style) trainerBonus += 0.5;
  }
  const wtBonus = ((warrior.attributes.WT ?? 10) - 10) * 0.01;
  const agePenalty = (warrior.age ?? 18) > 28 ? (((warrior.age ?? 18) - 28) * 0.02) : 0;
  const current = warrior.skillDrills?.[skill] ?? 0;
  // Diminishing returns: each point already drilled halves the marginal gain chance.
  const dr = Math.pow(0.6, current);
  const raw = (SKILL_DRILL_BASE_CHANCE + trainerBonus * 0.04 + wtBonus - agePenalty) * dr;
  return Math.max(SKILL_DRILL_GAIN_MIN, Math.min(SKILL_DRILL_GAIN_MAX, raw));
}

export function processSkillDrillTraining(
  warrior: Warrior,
  skill: keyof BaseSkills,
  state: GameState,
  rng: IRNGService
): { updatedWarrior: Warrior | null; result: TrainingResult; hardCapped?: boolean } {
  const current = warrior.skillDrills?.[skill] ?? 0;
  if (current >= SKILL_DRILL_CAP) {
    return {
      updatedWarrior: null,
      result: {
        type: "blocked",
        warriorId: warrior.id,
        message: `${warrior.name} has already mastered ${skill} drilling (cap ${SKILL_DRILL_CAP}).`,
      },
      hardCapped: true,
    };
  }

  const chance = computeSkillDrillChance(warrior, skill, state.trainers ?? []);
  if (rng.next() < chance) {
    const drills = { ...(warrior.skillDrills ?? {}), [skill]: current + 1 };
    return {
      updatedWarrior: { ...warrior, skillDrills: drills },
      result: {
        type: "gain",
        warriorId: warrior.id,
        message: `${warrior.name} sharpened their ${skill} through focused drilling (+1, now +${current + 1}).`,
      },
    };
  }
  return {
    updatedWarrior: null,
    result: {
      type: "blocked",
      warriorId: warrior.id,
      message: `${warrior.name} drilled ${skill} but made no measurable progress this week.`,
    },
  };
}

export function rollForTrainingInjury(warrior: Warrior, healingBonus: number, rng: IRNGService): { injury: InjuryData | null, result: TrainingResult | null } {
  const age = warrior.age ?? 18;
  const agePenalty = age > 30 ? (age - 30) * 0.005 : 0;
  const healReduce = healingBonus * 0.01;
  const injuryChance = Math.max(INJURY_CHANCE_MIN, Math.min(INJURY_CHANCE_MAX,
    BASE_TRAINING_INJURY_CHANCE + agePenalty - healReduce
  ));

  if (rng.next() < injuryChance) {
    const template = rng.pick(TRAINING_INJURIES);
    const [minW, maxW] = template.weeksRange;
    const weeks = rng.roll(minW || 1, ((maxW ?? minW) || 1) + 1);
    const injury: InjuryData = {
      id: generateId(),
      name: template.name,
      description: template.description,
      severity: "Minor",
      weeksRemaining: Math.max(1, weeks - healingBonus),
      penalties: template.penalties,
    };

    return {
      injury,
      result: {
        type: "injury",
        warriorId: warrior.id,
        message: `${warrior.name} suffered a ${template.name} during training! (${injury.weeksRemaining} week recovery)`,
      }
    };
  }

  return { injury: null, result: null };
}

export function processRecovery(warrior: Warrior, healingBonus: number): { updatedInjuries: InjuryData[], message: string } {
  const activeInjuries = (warrior.injuries || []).filter(
    (i): i is InjuryData => typeof i !== "string" && i.weeksRemaining > 0
  );

  if (activeInjuries.length === 0) {
    return { updatedInjuries: warrior.injuries as InjuryData[], message: `${warrior.name} rested but has no injuries to heal.` };
  }

  // Heal 1 + healingBonus weeks of recovery per actual week
  const healAmount = 1 + healingBonus;
  const updatedInjuries = warrior.injuries.map(i => {
    if (typeof i === "string") return i;
    return { ...i, weeksRemaining: Math.max(0, i.weeksRemaining - healAmount) };
  }).filter((i): i is InjuryData => {
    if (typeof i === "string") return false; // Clean up legacy string injuries if any
    return i.weeksRemaining > 0;
  });

  return {
    updatedInjuries,
    message: `${warrior.name} underwent active recovery (${healAmount} weeks of healing).`,
  };
}
