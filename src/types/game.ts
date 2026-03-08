/**
 * Stable Lords — Core Game Types
 * Ported from Duel repo + design bible specs
 */

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

export type BodyTarget = "Head" | "Chest" | "Abdomen" | "Arms" | "Legs" | "Any";
export type OffensiveTactic = "Lunge" | "Slash" | "Bash" | "Decisiveness" | "none";
export type DefensiveTactic = "Dodge" | "Parry" | "Riposte" | "Responsiveness" | "none";

/** Per-phase OE/AL/KD overrides for Opening, Mid, and Late bout phases */
export interface PhaseStrategy {
  OE: number;
  AL: number;
  killDesire: number;
}

export interface FightPlan {
  style: FightingStyle;
  OE: number;      // Offensive Effort 1-10 (default / fallback)
  AL: number;      // Activity Level 1-10
  killDesire?: number; // Kill Desire 1-10
  target?: BodyTarget;
  offensiveTactic?: OffensiveTactic;
  defensiveTactic?: DefensiveTactic;
  gear?: Gear;
  /** Phase-based overrides. If set, these override the base OE/AL/KD for each phase. */
  phases?: {
    opening?: PhaseStrategy;
    mid?: PhaseStrategy;
    late?: PhaseStrategy;
  };
}

// ─── Warrior ────────────────────────────────────────────────────────────────

export interface CareerRecord {
  wins: number;
  losses: number;
  kills: number;
}

export type WarriorStatus = "Active" | "Dead" | "Retired";

export interface Warrior {
  id: string;
  name: string;
  style: FightingStyle;
  attributes: Attributes;
  baseSkills?: BaseSkills;
  derivedStats?: DerivedStats;
  fame: number;
  popularity: number;
  titles: string[];
  injuries: string[];
  flair: string[];
  career: CareerRecord;
  champion: boolean;
  plan?: FightPlan;
  gear?: Gear;
  equipment?: {
    weapon: string;
    armor: string;
    shield: string;
    helm: string;
  };
  status: WarriorStatus;
  age?: number;
  deathWeek?: number;
  deathCause?: string;
  killedBy?: string;
  retiredWeek?: number;
}

// ─── Owner / Stable ─────────────────────────────────────────────────────────

export type OwnerPersonality = "Aggressive" | "Methodical" | "Showman" | "Pragmatic" | "Tactician";

export interface Owner {
  id: string;
  name: string;
  stableName: string;
  fame: number;
  renown: number;
  titles: number;
  personality?: OwnerPersonality;
}

// ─── Fight Results ──────────────────────────────────────────────────────────

export type FightOutcomeBy = "Kill" | "KO" | "Exhaustion" | "Stoppage" | "Draw" | null;

export interface MinuteEvent {
  minute: number;
  text: string;
}

export interface FightOutcome {
  winner: "A" | "D" | null;
  by: FightOutcomeBy;
  minutes: number;
  log: MinuteEvent[];
  post?: {
    xpA: number;
    xpD: number;
    hitsA?: number;
    hitsD?: number;
    gotKillA?: boolean;
    gotKillD?: boolean;
    tags?: string[];
  };
}

export interface FightSummary {
  id: string;
  week: number;
  tournamentId?: string | null;
  title: string;
  a: string;
  d: string;
  winner: "A" | "D" | null;
  by: FightOutcomeBy;
  styleA: string;
  styleD: string;
  flashyTags?: string[];
  fameDeltaA?: number;
  fameDeltaD?: number;
  popularityDeltaA?: number;
  popularityDeltaD?: number;
  transcript?: string[];
  createdAt: string;
}

export interface HallEntry {
  week: number;
  label: "Fight of the Week" | "Fight of the Tournament";
  fightId: string;
}

// ─── Newsletter ─────────────────────────────────────────────────────────────

export interface NewsletterItem {
  week: number;
  title: string;
  items: string[];
}

// ─── Game State ─────────────────────────────────────────────────────────────

export type Season = "Spring" | "Summer" | "Fall" | "Winter";
export type CrowdMoodType = "Calm" | "Bloodthirsty" | "Theatrical" | "Solemn" | "Festive";

export interface TournamentEntry {
  id: string;
  season: Season;
  week: number;
  name: string;
  bracket: TournamentBout[];
  champion?: string;
  completed: boolean;
}

export interface TournamentBout {
  round: number;
  matchIndex: number;
  a: string; // warrior name
  d: string;
  winner?: "A" | "D" | null;
  by?: FightOutcomeBy;
  fightId?: string;
}

export interface GameState {
  meta: {
    gameName: string;
    version: string;
    createdAt: string;
  };
  player: Owner;
  fame: number;
  popularity: number;
  week: number;
  season: Season;
  roster: Warrior[];
  graveyard: Warrior[];
  retired: Warrior[];
  arenaHistory: FightSummary[];
  newsletter: NewsletterItem[];
  hallOfFame: HallEntry[];
  crowdMood: CrowdMoodType;
  tournaments: TournamentEntry[];
  trainers: TrainerData[];
  hiringPool: TrainerData[];
  settings: {
    featureFlags: {
      tournaments: boolean;
      scouting: boolean;
    };
  };
}

/** Trainer as stored in game state (mirrors modules/trainers Trainer shape) */
export interface TrainerData {
  id: string;
  name: string;
  tier: string;
  focus: string;
  fame: number;
  contractWeeksLeft: number;
  retiredFromWarrior?: string;
  retiredFromStyle?: string;
  styleBonusStyle?: string;
}

// ─── UI Preferences ─────────────────────────────────────────────────────────

export interface UIPrefs {
  autoTunePlan: boolean;
}
