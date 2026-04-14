// ─── Fighting Styles ────────────────────────────────────────────────────────

export enum FightingStyle {
  AimedBlow = "AIMED BLOW",
  BashingAttack = "BASHING ATTACK",
  LungingAttack = "LUNGING ATTACK",
  ParryLunge = "PARRY-LUNGE",
  ParryRiposte = "PARRY-RIPOSTE",
  ParryStrike = "PARRY-STRIKE",
  SlashingAttack = "SLASHING ATTACK",
  StrikingAttack = "STRIKING ATTACK",
  TotalParry = "TOTAL PARRY",
  WallOfSteel = "WALL OF STEEL",
}

export const STYLE_DISPLAY_NAMES: Record<FightingStyle, string> = {
  [FightingStyle.AimedBlow]: "Aimed-Blow",
  [FightingStyle.BashingAttack]: "Basher",
  [FightingStyle.LungingAttack]: "Lunger",
  [FightingStyle.ParryLunge]: "Parry-Lunger",
  [FightingStyle.ParryRiposte]: "Parry-Riposte",
  [FightingStyle.ParryStrike]: "Parry-Striker",
  [FightingStyle.SlashingAttack]: "Slasher",
  [FightingStyle.StrikingAttack]: "Striker",
  [FightingStyle.TotalParry]: "Total-Parry",
  [FightingStyle.WallOfSteel]: "Wall of Steel",
};

export const STYLE_ABBREV: Record<FightingStyle, string> = {
  [FightingStyle.AimedBlow]: "AB",
  [FightingStyle.BashingAttack]: "BA",
  [FightingStyle.LungingAttack]: "LU",
  [FightingStyle.ParryLunge]: "PL",
  [FightingStyle.ParryRiposte]: "PR",
  [FightingStyle.ParryStrike]: "PS",
  [FightingStyle.SlashingAttack]: "SL",
  [FightingStyle.StrikingAttack]: "ST",
  [FightingStyle.TotalParry]: "TP",
  [FightingStyle.WallOfSteel]: "WS",
};

// ─── Attributes ─────────────────────────────────────────────────────────────

export interface Attributes {
  ST: number; // Strength (3-25)
  CN: number; // Constitution (3-25)
  SZ: number; // Size (3-25)
  WT: number; // Wit (3-25)
  WL: number; // Will (3-25)
  SP: number; // Speed (3-25)
  DF: number; // Deftness (3-25)
}

export const ATTRIBUTE_KEYS: (keyof Attributes)[] = ["ST", "CN", "SZ", "WT", "WL", "SP", "DF"];

export const ATTRIBUTE_LABELS: Record<keyof Attributes, string> = {
  ST: "Strength",
  CN: "Constitution",
  SZ: "Size",
  WT: "Wit",
  WL: "Will",
  SP: "Speed",
  DF: "Deftness",
};

export const ATTRIBUTE_MIN = 3;
export const ATTRIBUTE_MAX = 25;
export const ATTRIBUTE_TOTAL = 70;

// ─── Base Skills ────────────────────────────────────────────────────────────

export interface BaseSkills {
  ATT: number; // Attack
  PAR: number; // Parry
  DEF: number; // Defense
  INI: number; // Initiative
  RIP: number; // Riposte
  DEC: number; // Decisiveness
}

// ─── Derived Stats ──────────────────────────────────────────────────────────

export interface DerivedStats {
  hp: number;
  endurance: number;
  damage: number;
  encumbrance: number;
}

// ─── Global Enums/Constants ─────────────────────────────────────────────────

export type Season = "Spring" | "Summer" | "Fall" | "Winter";
export type CrowdMoodType = "Calm" | "Bloodthirsty" | "Theatrical" | "Solemn" | "Festive";

export interface NewsletterItem {
  id: string;
  week: number;
  title: string;
  items: string[];
}

// ─── Equipment ──────────────────────────────────────────────────────────────

export type ShieldSize = "None" | "Small" | "Medium" | "Large";

export interface Weapon {
  name: string;
  twoHanded?: boolean;
}

export interface Gear {
  weapon: Weapon;
  shield: ShieldSize;
  armor: string;
  helm: string;
}

// ─── Fight Plan ─────────────────────────────────────────────────────────────

export type AttackTarget = "Head" | "Chest" | "Abdomen" | "Right Arm" | "Left Arm" | "Right Leg" | "Left Leg" | "Any";
export type ProtectTarget = "Head" | "Body" | "Arms" | "Legs" | "Any";
export type OffensiveTactic = "Lunge" | "Slash" | "Bash" | "Decisiveness" | "none";
export type DefensiveTactic = "Dodge" | "Parry" | "Riposte" | "Responsiveness" | "none";

export interface PhaseStrategy {
  OE: number;
  AL: number;
  killDesire: number;
  offensiveTactic?: OffensiveTactic;
  defensiveTactic?: DefensiveTactic;
  target?: AttackTarget;
  aggressionBias?: number; // 0-10
}

export interface FightPlan {
  style: FightingStyle;
  OE: number;
  AL: number;
  killDesire?: number;
  aggressionBias?: number;
  openingMove?: "Safe" | "Aggressive" | "Measured";
  fallbackCondition?: "FLEE" | "TURTLE" | "BERZERK" | "None";
  target?: AttackTarget;
  protect?: ProtectTarget;
  offensiveTactic?: OffensiveTactic;
  defensiveTactic?: DefensiveTactic;
  gear?: Gear;
  phases?: {
    opening?: PhaseStrategy;
    mid?: PhaseStrategy;
    late?: PhaseStrategy;
  };
}

// ─── Trainer Types ────────────────────────────────────────────────────────

export type TrainerTier = "Novice" | "Seasoned" | "Master";
export type TrainerFocus = "Aggression" | "Defense" | "Endurance" | "Mind" | "Healing";

// ─── Scouting Types ───────────────────────────────────────────────────────

export type ScoutQuality = "Basic" | "Detailed" | "Expert";

// ─── Weather Types ────────────────────────────────────────────────────────

export type WeatherType = "Clear" | "Rainy" | "Scalding" | "Drafty" | "Overcast" | "Blazing Sun" | "Gale" | "Blood Moon" | "Eclipse";

export interface DeathEvent {
  boutId: string;
  killerId: string;
  deathSummary: string;
  memorialTags: string[];
}

// ─── Trainer Interface ───────────────────────────────────────────────────────

export interface Trainer {
  id: string;
  name: string;
  tier: TrainerTier;
  focus: TrainerFocus;
  fame: number;
  age: number;
  contractWeeksLeft: number; // 0 = expired
  retiredFromWarrior?: string; // warrior name if converted
  retiredFromStyle?: FightingStyle;
  styleBonusStyle?: FightingStyle; // bonus for warriors of this style
  legacyWins?: number;
  legacyKills?: number;
}
