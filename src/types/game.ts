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

/** Weight class for armor encumbrance calculations (per Design Bible §Equipment) */
export type ArmorWeight = "None" | "Light" | "Medium" | "Heavy" | "Ultra-Heavy";

/** Maps armor weight classes to encumbrance penalty ranges */
export const ARMOR_WEIGHT_MAP: Record<ArmorWeight, { minWeight: number; maxWeight: number; speedPenalty: number }> = {
  "None":        { minWeight: 0, maxWeight: 0, speedPenalty: 0 },
  "Light":       { minWeight: 1, maxWeight: 2, speedPenalty: 1 },
  "Medium":      { minWeight: 3, maxWeight: 4, speedPenalty: 2 },
  "Heavy":       { minWeight: 5, maxWeight: 6, speedPenalty: 4 },
  "Ultra-Heavy": { minWeight: 7, maxWeight: 10, speedPenalty: 6 },
};

/** Equipment slot identifiers */
export type EquipmentSlot = "weapon" | "armor" | "shield" | "helm";

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

/**
 * Resolved encumbrance breakdown for a warrior's full loadout.
 * Used by the engine to apply speed/fatigue penalties.
 */
export interface ArmorEncumbrance {
  /** Total encumbrance points from all gear */
  totalWeight: number;
  /** Effective speed penalty applied to SP-based calculations */
  speedPenalty: number;
  /** Fatigue multiplier — heavier loadouts drain endurance faster */
  fatigueMult: number;
  /** Armor weight class for display/categorization */
  weightClass: ArmorWeight;
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
  offensiveTactic?: OffensiveTactic;
  defensiveTactic?: DefensiveTactic;
  target?: BodyTarget;
}

export interface FightPlan {
  style: FightingStyle;
  OE: number;      // Offensive Effort 1-10 (default / fallback)
  AL: number;      // Activity Level 1-10
  killDesire?: number; // Kill Desire 1-10
  target?: BodyTarget;
  protect?: BodyTarget;  // Prioritize defense of a body location
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

/** Injury severity tiers (per Design Bible §Injuries) */
export type InjurySeverity = "Minor" | "Moderate" | "Severe" | "Critical" | "Permanent";

/** Recovery time ranges by severity (in weeks) */
export const INJURY_SEVERITY_WEEKS: Record<InjurySeverity, { min: number; max: number }> = {
  Minor: { min: 1, max: 2 },
  Moderate: { min: 2, max: 4 },
  Severe: { min: 4, max: 8 },
  Critical: { min: 8, max: 16 },
  Permanent: { min: Infinity, max: Infinity },
};

/** Body locations that can sustain injuries */
export type InjuryLocation = "Head" | "Chest" | "Abdomen" | "Arms" | "Legs" | "General";

export interface InjuryData {
  id: string;
  name: string;
  description: string;
  severity: InjurySeverity;
  location?: InjuryLocation;
  weeksRemaining: number;
  penalties: Partial<Record<keyof Attributes | keyof BaseSkills, number>>;
  permanent?: boolean;
}

/**
 * Per-attribute potential ceiling. Each attribute has a hidden max
 * that limits training/XP growth. Generated at warrior creation.
 */
export type AttributePotential = Record<keyof Attributes, number>;

/** Hidden favorite preferences — discovered through gameplay */
export interface WarriorFavorites {
  /** Favorite weapon item ID — grants +1 ATT when used */
  weaponId: string;
  /** Favorite OE/AL rhythm — grants +1 INI when matched */
  rhythm: { oe: number; al: number };
  /** Discovery state */
  discovered: {
    weapon: boolean;
    rhythm: boolean;
    /** Number of hints shown (weapon) */
    weaponHints: number;
    /** Number of hints shown (rhythm) */
    rhythmHints: number;
  };
}

export interface Warrior {
  id: string;
  name: string;
  style: FightingStyle;
  attributes: Attributes;
  potential?: AttributePotential;
  baseSkills?: BaseSkills;
  derivedStats?: DerivedStats;
  fame: number;
  popularity: number;
  titles: string[];
  injuries: (string | InjuryData)[];
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
  xp?: number;
  potentialRevealed?: Partial<Record<keyof Attributes, boolean>>;
  deathWeek?: number;
  deathCause?: string;
  killedBy?: string;
  retiredWeek?: number;
  stableId?: string; // for AI rival warriors
  /** Hidden favorite weapon & rhythm — discovered through bouts */
  favorites?: WarriorFavorites;
}

// ─── Owner / Stable ─────────────────────────────────────────────────────────

export type OwnerPersonality = "Aggressive" | "Methodical" | "Showman" | "Pragmatic" | "Tactician";

/** How an owner adapts to the meta — affects recruitment and strategy drift */
export type MetaAdaptation = "MetaChaser" | "Traditionalist" | "Opportunist" | "Innovator";

export interface Owner {
  id: string;
  name: string;
  stableName: string;
  fame: number;
  renown: number;
  titles: number;
  personality?: OwnerPersonality;
  /** How this owner responds to meta shifts */
  metaAdaptation?: MetaAdaptation;
  /** Styles this owner personally favors regardless of meta */
  favoredStyles?: FightingStyle[];
}

// ─── Fight Results ──────────────────────────────────────────────────────────

export type FightOutcomeBy = "Kill" | "KO" | "Exhaustion" | "Stoppage" | "Draw" | null;

export interface MinuteEvent {
  minute: number;
  text: string;
  /** Phase/tactic metadata for UI indicators */
  phase?: "OPENING" | "MID" | "LATE";
  offTacticA?: string;
  defTacticA?: string;
  offTacticD?: string;
  defTacticD?: string;
  protectA?: string;
  protectD?: string;
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
  fameA?: number;
  fameD?: number;
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

/** Training assignment — which attribute a warrior is training this week */
export interface TrainingAssignment {
  warriorId: string;
  type: "attribute" | "recovery";
  attribute?: keyof Attributes; // required if type === "attribute"
}

/** Seasonal growth tracking — caps attribute gains per season */
export interface SeasonalGrowth {
  warriorId: string;
  season: Season;
  gains: Partial<Record<keyof Attributes, number>>;
}

/** A single ledger entry for the economy log */
export interface LedgerEntry {
  week: number;
  label: string;
  amount: number;
  category: "fight" | "training" | "recruit" | "trainer" | "upkeep" | "prize" | "other";
}

export interface RivalStableData {
  owner: Owner;
  roster: Warrior[];
  /** Stable identity metadata */
  motto?: string;
  origin?: string;
  philosophy?: string;
  tier?: "Minor" | "Established" | "Major" | "Legendary";
}

export interface ScoutReportData {
  id: string;
  warriorName: string;
  style: string;
  quality: "Basic" | "Detailed" | "Expert";
  week: number;
  attributeRanges: Record<string, [number, number]>;
  record: string;
  knownInjuries: string[];
  suspectedOE?: string;
  suspectedAL?: string;
  notes: string;
}

/** Mandatory rest after certain bout outcomes */
export interface RestState {
  warriorId: string;
  restUntilWeek: number;
}

/** Auto-detected cross-stable rivalry */
export interface Rivalry {
  stableIdA: string;
  stableIdB: string;
  intensity: number; // 1-5
  reason: string;
  startWeek: number;
}

/** Record of a past match pairing for repeat-avoidance */
export interface MatchRecord {
  week: number;
  playerWarriorId: string;
  opponentWarriorId: string;
  opponentStableId: string;
}

export const BASE_ROSTER_CAP = 10;

/** Owner-to-owner grudge (personality-driven rivalry) */
export interface OwnerGrudge {
  ownerIdA: string;
  ownerIdB: string;
  intensity: number;
  reason: string;
  startWeek: number;
  lastEscalation: number;
}

export interface GameState {
  meta: {
    gameName: string;
    version: string;
    createdAt: string;
  };
  ftueComplete: boolean;
  ftueStep?: number;
  coachDismissed: string[];
  player: Owner;
  fame: number;
  popularity: number;
  gold: number;
  ledger: LedgerEntry[];
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
  trainingAssignments: TrainingAssignment[];
  seasonalGrowth: SeasonalGrowth[];
  rivals: RivalStableData[];
  scoutReports: ScoutReportData[];
  restStates: RestState[];
  rivalries: Rivalry[];
  matchHistory: MatchRecord[];
  recruitPool: any[]; // PoolWarrior[] from recruitment engine
  rosterBonus: number; // extra roster slots from championships
  ownerGrudges: OwnerGrudge[]; // personality-driven owner rivalries
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
  dashboardLayout?: string[]; // ordered widget IDs
}
