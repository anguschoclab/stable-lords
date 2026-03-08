/**
 * Trainer types, constants, hiring pool generation, and retired-warrior conversion.
 */
import { FightingStyle, STYLE_DISPLAY_NAMES, type Warrior } from "@/types/game";

export type TrainerTier = "Novice" | "Seasoned" | "Master";
export type TrainerFocus = "Aggression" | "Defense" | "Endurance" | "Mind" | "Healing";

export const TRAINER_FOCUSES: TrainerFocus[] = ["Aggression", "Defense", "Endurance", "Mind", "Healing"];
export const TRAINER_MAX_PER_STABLE = 5;

export const FOCUS_DESCRIPTIONS: Record<TrainerFocus, string> = {
  Aggression: "Boosts ATT and OE effectiveness. Best for offensive warriors.",
  Defense: "Boosts PAR and DEF. Best for parry and defensive styles.",
  Endurance: "Improves stamina recovery and endurance capacity.",
  Mind: "Boosts INI and DEC. Improves decision-making and initiative.",
  Healing: "Accelerates injury recovery and reduces death risk from wounds.",
};

export const FOCUS_ICONS: Record<TrainerFocus, string> = {
  Aggression: "⚔️",
  Defense: "🛡️",
  Endurance: "💪",
  Mind: "🧠",
  Healing: "💊",
};

export const TIER_COST: Record<TrainerTier, number> = {
  Novice: 0,
  Seasoned: 0,
  Master: 0,
};

export const TIER_BONUS: Record<TrainerTier, number> = {
  Novice: 1,
  Seasoned: 2,
  Master: 3,
};

export interface Trainer {
  id: string;
  name: string;
  tier: TrainerTier;
  focus: TrainerFocus;
  fame: number;
  contractWeeksLeft: number; // 0 = expired
  retiredFromWarrior?: string; // warrior name if converted
  retiredFromStyle?: FightingStyle;
  styleBonusStyle?: FightingStyle; // bonus for warriors of this style
}

// ─── Name Generation ──────────────────────────────────────────────────────
const TRAINER_FIRST_NAMES = [
  "Aldric", "Brenna", "Caius", "Dara", "Eryx", "Fenna", "Galthor", "Hessa",
  "Ivor", "Jelena", "Korvin", "Lysa", "Maegor", "Nira", "Orvald", "Petra",
  "Quintus", "Rhea", "Soren", "Thessa", "Ulric", "Vala", "Wyrd", "Xara",
];

const TRAINER_TITLES: Record<TrainerFocus, string[]> = {
  Aggression: ["the Fierce", "Blade-Breaker", "the Relentless"],
  Defense: ["Shield-Born", "the Unyielding", "Iron Wall"],
  Endurance: ["the Tireless", "Long-Wind", "Stone-Heart"],
  Mind: ["the Cunning", "Keen-Eye", "the Strategist"],
  Healing: ["the Mender", "Bone-Setter", "Salve-Hand"],
};

function generateTrainerName(rng: () => number, focus: TrainerFocus): string {
  const first = TRAINER_FIRST_NAMES[Math.floor(rng() * TRAINER_FIRST_NAMES.length)];
  const titles = TRAINER_TITLES[focus];
  const title = titles[Math.floor(rng() * titles.length)];
  return `${first} ${title}`;
}

/** Generate a pool of available trainers to hire */
export function generateHiringPool(count: number, seed?: number): Trainer[] {
  let s = seed ?? Date.now();
  const rng = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };

  const pool: Trainer[] = [];
  for (let i = 0; i < count; i++) {
    const focus = TRAINER_FOCUSES[Math.floor(rng() * TRAINER_FOCUSES.length)];
    const tierRoll = rng();
    const tier: TrainerTier = tierRoll < 0.5 ? "Novice" : tierRoll < 0.85 ? "Seasoned" : "Master";
    pool.push({
      id: `trainer_${Date.now()}_${i}`,
      name: generateTrainerName(rng, focus),
      tier,
      focus,
      fame: tier === "Master" ? 5 : tier === "Seasoned" ? 3 : 1,
      contractWeeksLeft: 52, // 1 year
    });
  }
  return pool;
}

/** Convert a retired warrior into a trainer */
export function convertRetiredToTrainer(warrior: Warrior): Trainer {
  // Map style to best focus
  const styleFocusMap: Partial<Record<FightingStyle, TrainerFocus>> = {
    [FightingStyle.BashingAttack]: "Aggression",
    [FightingStyle.LungingAttack]: "Aggression",
    [FightingStyle.SlashingAttack]: "Aggression",
    [FightingStyle.StrikingAttack]: "Aggression",
    [FightingStyle.TotalParry]: "Defense",
    [FightingStyle.WallOfSteel]: "Defense",
    [FightingStyle.ParryStrike]: "Defense",
    [FightingStyle.ParryRiposte]: "Mind",
    [FightingStyle.ParryLunge]: "Mind",
    [FightingStyle.AimedBlow]: "Mind",
  };

  const focus = styleFocusMap[warrior.style] ?? "Endurance";
  const totalFights = warrior.career.wins + warrior.career.losses;
  const tier: TrainerTier =
    totalFights >= 15 || warrior.career.kills >= 3 ? "Master"
    : totalFights >= 7 ? "Seasoned"
    : "Novice";

  return {
    id: `trainer_ret_${warrior.id}`,
    name: `${warrior.name} (${STYLE_DISPLAY_NAMES[warrior.style]})`,
    tier,
    focus,
    fame: warrior.fame,
    contractWeeksLeft: 52,
    retiredFromWarrior: warrior.name,
    retiredFromStyle: warrior.style,
    styleBonusStyle: warrior.style,
  };
}

/** Get training bonus for a warrior from assigned trainers */
export function getTrainingBonus(
  trainers: Trainer[],
  warriorStyle: FightingStyle
): Record<TrainerFocus, number> {
  const bonus: Record<TrainerFocus, number> = {
    Aggression: 0, Defense: 0, Endurance: 0, Mind: 0, Healing: 0,
  };

  for (const t of trainers) {
    if (t.contractWeeksLeft <= 0) continue;
    let b = TIER_BONUS[t.tier];
    // Style affinity bonus
    if (t.styleBonusStyle === warriorStyle) b += 1;
    bonus[t.focus] += b;
  }

  return bonus;
}
