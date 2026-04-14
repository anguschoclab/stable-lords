import { 
  FightingStyle, 
  STYLE_DISPLAY_NAMES, 
  STYLE_ABBREV, 
  type Attributes, 
  ATTRIBUTE_KEYS, 
  ATTRIBUTE_LABELS, 
  ATTRIBUTE_MIN, 
  ATTRIBUTE_MAX, 
  ATTRIBUTE_TOTAL, 
  type BaseSkills, 
  type DerivedStats,
  type Gear, 
  type FightPlan,
  type DeathEvent
} from "./shared.types";
import type { AnnualAward } from "./state.types";

// ─── UI Prop Types ──────────────────────────────────────────────────────────

export interface TagBadgeProps {
  tag: string;
  type: "flair" | "title" | "injury";
  className?: string;
}

export interface StatBadgeProps {
  styleName: FightingStyle;
  career?: CareerRecord;
  variant?: "outline" | "default" | "secondary" | "destructive";
  showFullName?: boolean;
  className?: string;
}

export interface WarriorNameTagProps {
  id?: string;
  name: string;
  isChampion?: boolean;
  injuryCount?: number;
  useCrown?: boolean;
  isDead?: boolean;
}

// ─── Warrior ────────────────────────────────────────────────────────────────

export interface CareerRecord {
  wins: number;
  losses: number;
  kills: number;
  fame?: number; // 📸 Snapshot fame at year start
  medals?: {
    gold: number;
    silver: number;
    bronze: number;
  };
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
export type InjuryLocation = "Head" | "Chest" | "Abdomen" | "Right Arm" | "Left Arm" | "Right Leg" | "Left Leg" | "General";

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

export type AttributePotential = Record<keyof Attributes, number>;

export interface WarriorFavorites {
  weaponId: string;
  rhythm: { oe: number; al: number };
  discovered: {
    weapon: boolean;
    rhythm: boolean;
    weaponHints: number;
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
  injuries: InjuryData[];
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
  fatigue?: number;
  seasonPoints?: number;
  xp?: number;
  potentialRevealed?: Partial<Record<keyof Attributes, boolean>>;
  deathWeek?: number;
  deathCause?: string;
  deathEvent?: DeathEvent;
  killedBy?: string;
  retiredWeek?: number;
  stableId?: string;
  favorites?: WarriorFavorites;
  isDead?: boolean;
  dateOfDeath?: string;
  causeOfDeath?: string;
  yearlySnapshots?: Record<number, CareerRecord>; // 📸 Snapshot at Year Start
  awards?: import("./state.types").AnnualAward[];
}

// Re-exports for convenience
export { 
  FightingStyle, 
  STYLE_DISPLAY_NAMES, 
  STYLE_ABBREV, 
  type Attributes, 
  ATTRIBUTE_KEYS, 
  ATTRIBUTE_LABELS, 
  ATTRIBUTE_MIN, 
  ATTRIBUTE_MAX, 
  ATTRIBUTE_TOTAL, 
  type BaseSkills, 
  type DerivedStats,
  type Gear,
  type FightPlan,
  type DeathEvent
};
