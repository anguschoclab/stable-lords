// ─── Branded IDs ───────────────────────────────────────────────────────────
/** Branded ID pattern to prevent mixing different ID types at compile time. */
export type Brand<T, TBrand extends string> = T & { readonly __brand: TBrand };

export type WarriorId = Brand<string, 'WarriorId'>;
export type StableId = Brand<string, 'StableId'>;
export type PromoterId = Brand<string, 'PromoterId'>;
export type TrainerId = Brand<string, 'TrainerId'>;
export type FightId = Brand<string, 'FightId'>;
export type TournamentId = Brand<string, 'TournamentId'>;
export type BoutOfferId = Brand<string, 'BoutOfferId'>;
export type InjuryId = Brand<string, 'InjuryId'>;
export type LedgerEntryId = Brand<string, 'LedgerEntryId'>;
export type ScoutReportId = Brand<string, 'ScoutReportId'>;
export type NewsId = Brand<string, 'NewsId'>;
export type GrudgeId = Brand<string, 'GrudgeId'>;
export type RivalryId = Brand<string, 'RivalryId'>;
export type InsightId = Brand<string, 'InsightId'>;
export type HallEntryId = Brand<string, 'HallEntryId'>;
export type SimulationReportId = Brand<string, 'SimulationReportId'>;

// ─── Fighting Styles ────────────────────────────────────────────────────────

export enum FightingStyle {
  AimedBlow = 'AIMED BLOW',
  BashingAttack = 'BASHING ATTACK',
  LungingAttack = 'LUNGING ATTACK',
  ParryLunge = 'PARRY-LUNGE',
  ParryRiposte = 'PARRY-RIPOSTE',
  ParryStrike = 'PARRY-STRIKE',
  SlashingAttack = 'SLASHING ATTACK',
  StrikingAttack = 'STRIKING ATTACK',
  TotalParry = 'TOTAL PARRY',
  WallOfSteel = 'WALL OF STEEL',
}

export const STYLE_DISPLAY_NAMES: Record<FightingStyle, string> = {
  [FightingStyle.AimedBlow]: 'Aimed-Blow',
  [FightingStyle.BashingAttack]: 'Basher',
  [FightingStyle.LungingAttack]: 'Lunger',
  [FightingStyle.ParryLunge]: 'Parry-Lunger',
  [FightingStyle.ParryRiposte]: 'Parry-Riposte',
  [FightingStyle.ParryStrike]: 'Parry-Striker',
  [FightingStyle.SlashingAttack]: 'Slasher',
  [FightingStyle.StrikingAttack]: 'Striker',
  [FightingStyle.TotalParry]: 'Total-Parry',
  [FightingStyle.WallOfSteel]: 'Wall of Steel',
};

export const STYLE_ABBREV: Record<FightingStyle, string> = {
  [FightingStyle.AimedBlow]: 'AB',
  [FightingStyle.BashingAttack]: 'BA',
  [FightingStyle.LungingAttack]: 'LU',
  [FightingStyle.ParryLunge]: 'PL',
  [FightingStyle.ParryRiposte]: 'PR',
  [FightingStyle.ParryStrike]: 'PS',
  [FightingStyle.SlashingAttack]: 'SL',
  [FightingStyle.StrikingAttack]: 'ST',
  [FightingStyle.TotalParry]: 'TP',
  [FightingStyle.WallOfSteel]: 'WS',
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

export const ATTRIBUTE_KEYS: (keyof Attributes)[] = ['ST', 'CN', 'SZ', 'WT', 'WL', 'SP', 'DF'];

export const ATTRIBUTE_LABELS: Record<keyof Attributes, string> = {
  ST: 'Strength',
  CN: 'Constitution',
  SZ: 'Size',
  WT: 'Wit',
  WL: 'Will',
  SP: 'Speed',
  DF: 'Deftness',
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

export type Season = 'Spring' | 'Summer' | 'Fall' | 'Winter';
export type CrowdMoodType = 'Calm' | 'Bloodthirsty' | 'Theatrical' | 'Solemn' | 'Festive';

export interface NewsletterItem {
  id: string; // Could be branded but loosely used in many places for now
  week: number;
  title: string;
  items: string[];
  category?: 'event' | 'news' | 'newsletter';
}

// ─── Equipment ──────────────────────────────────────────────────────────────

export type ShieldSize = 'None' | 'Small' | 'Medium' | 'Large';

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

export type AttackTarget =
  | 'Head'
  | 'Chest'
  | 'Abdomen'
  | 'Right Arm'
  | 'Left Arm'
  | 'Right Leg'
  | 'Left Leg'
  | 'Any';
export type ProtectTarget = 'Head' | 'Body' | 'Arms' | 'Legs' | 'Any';
export type OffensiveTactic = 'Lunge' | 'Slash' | 'Bash' | 'Decisiveness' | 'none';
export type DefensiveTactic = 'Dodge' | 'Parry' | 'Riposte' | 'Responsiveness' | 'none';

export interface PhaseStrategy {
  OE: number;
  AL: number;
  killDesire: number;
  offensiveTactic?: OffensiveTactic;
  defensiveTactic?: DefensiveTactic;
  target?: AttackTarget;
  aggressionBias?: number; // 0-10
}

export interface DesperatePlan {
  OE: number;
  AL: number;
  killDesire?: number;
  offensiveTactic?: OffensiveTactic;
  defensiveTactic?: DefensiveTactic;
  target?: AttackTarget;
  protect?: ProtectTarget;
}

export interface FightPlan {
  style: FightingStyle;
  OE: number;
  AL: number;
  killDesire?: number;
  aggressionBias?: number;
  openingMove?: 'Safe' | 'Aggressive' | 'Measured';
  fallbackCondition?: 'FLEE' | 'TURTLE' | 'BERZERK' | 'None';
  target?: AttackTarget;
  protect?: ProtectTarget;
  offensiveTactic?: OffensiveTactic;
  defensiveTactic?: DefensiveTactic;
  gear?: Gear;
  /** Overrides ALL strategy when fighter is desperate (HP < 30% OR endurance < 20%). Canonical "Desperate" slot. */
  desperatePlan?: DesperatePlan;
  phases?: {
    opening?: PhaseStrategy;
    mid?: PhaseStrategy;
    late?: PhaseStrategy;
  };
  /** Conditional overrides evaluated mid-fight based on fight state. First match wins. */
  conditions?: PlanCondition[];
  /** 0-10 tendency to feint; only triggers when WT ≥ 15 and OE ≥ 4 */
  feintTendency?: number;
  /** Preferred range — influences Approach roll motivation bonus (+2 when contesting toward this range) */
  rangePreference?: DistanceRange;
  /** Stable owner's personality — drives in-bout adaptation conditions (see ownerAI.ts). Undefined for player-authored plans. */
  ownerPersonality?: 'Aggressive' | 'Methodical' | 'Showman' | 'Pragmatic' | 'Tactician';
}

// ─── Conditional Fight Plans ─────────────────────────────────────────────────

export type ConditionTriggerType =
  | 'HP_BELOW'
  | 'HP_ABOVE'
  | 'MOMENTUM_LEAD'
  | 'MOMENTUM_DEFICIT'
  | 'PHASE_IS'
  | 'ENDURANCE_BELOW';

export interface PlanCondition {
  trigger: { type: ConditionTriggerType; value: number | string };
  override: Partial<
    Pick<FightPlan, 'OE' | 'AL' | 'killDesire' | 'offensiveTactic' | 'defensiveTactic'>
  >;
  label?: string;
}

export type PsychState =
  | 'Neutral'
  | 'InTheZone'
  | 'Rattled'
  | 'Desperate'
  | 'Cruising'
  | 'FatiguePanic';

// ─── Spatial / Distance System ─────────────────────────────────────────────

export type DistanceRange = 'Grapple' | 'Tight' | 'Striking' | 'Extended';
export type ArenaZone = 'Center' | 'Edge' | 'Corner' | 'Obstacle';
export type CommitLevel = 'Cautious' | 'Standard' | 'Full';
export type ArenaTag = 'outdoor' | 'indoor' | 'elevated' | 'water' | 'cramped' | 'open' | 'premium';

export interface SurfaceMod {
  initiativeMod: number; // flat bonus/penalty to INI rolls each exchange
  enduranceMult: number; // multiplier on endurance costs (1.0 = baseline)
  riposteMod: number; // flat bonus/penalty to riposte checks
}

export interface ArenaWeatherMod {
  weatherType: WeatherType;
  zoneDef?: Partial<Record<ArenaZone, number>>;
  surfaceMod?: Partial<SurfaceMod>;
}

export interface ArenaConfig {
  id: string;
  name: string;
  tags: ArenaTag[];
  tier: 1 | 2 | 3; // 1=common, 2=prestigious, 3=special event
  description: string;
  /** DEF penalty per zone (negative = penalty). E.g. Edge: -2, Corner: -4 */
  zoneDef: Partial<Record<ArenaZone, number>>;
  surfaceMod: SurfaceMod;
  weatherMods?: ArenaWeatherMod[];
  startingZone?: ArenaZone; // default "Center"
}

// ─── Trainer Types ────────────────────────────────────────────────────────

export type TrainerTier = 'Novice' | 'Seasoned' | 'Master';
export type TrainerFocus = 'Aggression' | 'Defense' | 'Endurance' | 'Mind' | 'Healing';

export type TrainerSpecialty =
  | 'KillerInstinct' // Aggression: kill-window bonus when enemy HP < 40%
  | 'IronConditioning' // Endurance: stamina drain −10% in LATE phase
  | 'CounterFighter' // Defense: riposte damage +15% after successful parry
  | 'Footwork' // Defense: initiative +3 in MID/LATE phase
  | 'IronGuard' // Defense: damage taken −10% while endurance > 60%
  | 'Finisher' // Aggression: ATT +10% when momentum >= 2
  | 'RopeADope'; // Endurance: fatigue penalty reduced 30%

// ─── Scouting Types ───────────────────────────────────────────────────────

export type ScoutQuality = 'Basic' | 'Detailed' | 'Expert';

// ─── Weather Types ────────────────────────────────────────────────────────

export type WeatherType =
  | 'Clear'
  | 'Rainy'
  | 'Sweltering'
  | 'Breezy'
  | 'Overcast'
  | 'Blazing Sun'
  | 'Gale'
  | 'Blood Moon'
  | 'Eclipse'
  | 'Sandstorm'
  | 'Blizzard'
  | 'Dense Fog'
  | 'Thunderstorm'
  | 'Ashfall'
  | 'Acid Rain'
  | 'Mana Surge';

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
  specialty?: TrainerSpecialty;
}
