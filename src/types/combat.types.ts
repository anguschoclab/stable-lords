import { 
  FightingStyle, 
  type NewsletterItem, 
  type Gear, 
  type FightPlan, 
  type AttackTarget, 
  type ProtectTarget, 
  type OffensiveTactic, 
  type DefensiveTactic, 
  type PhaseStrategy,
  type DeathEvent
} from "./shared.types";
import type { BoutResult } from "@/engine/boutProcessor";

// ─── Equipment Constants ───────────────────────────────────────────────────

export type ArmorWeight = "None" | "Light" | "Medium" | "Heavy" | "Ultra-Heavy";

export const ARMOR_WEIGHT_MAP: Record<ArmorWeight, { minWeight: number; maxWeight: number; speedPenalty: number }> = {
  "None":        { minWeight: 0, maxWeight: 0, speedPenalty: 0 },
  "Light":       { minWeight: 1, maxWeight: 4, speedPenalty: 1 },
  "Medium":      { minWeight: 5, maxWeight: 8, speedPenalty: 2 },
  "Heavy":       { minWeight: 9, maxWeight: 12, speedPenalty: 4 },
  "Ultra-Heavy": { minWeight: 13, maxWeight: 20, speedPenalty: 6 },
};

export type EquipmentSlot = "weapon" | "armor" | "shield" | "helm";

export interface ArmorEncumbrance {
  totalWeight: number;
  speedPenalty: number;
  fatigueMult: number;
  weightClass: ArmorWeight;
}

// ─── Fight Results ──────────────────────────────────────────────────────────

export type DeathCauseBucket =
  | "FATAL_DAMAGE"
  | "EXECUTION"
  | "CRITICAL_CHAIN"
  | "FATIGUE_COLLAPSE"
  | "ARMOR_FAILURE"
  | "RIVALRY_FINISH";

export type FightOutcomeBy = "Kill" | "KO" | "Exhaustion" | "Stoppage" | "Draw" | null;

export type CombatEventType = 
  | "INITIATIVE"
  | "ATTACK"
  | "DEFENSE"
  | "HIT"
  | "CONTEST"
  | "ENDURANCE"
  | "FATIGUE"
  | "STATE_CHANGE"
  | "BOUT_END"
  | "PASSIVE"
  | "INSIGHT";

export interface CombatEvent {
  type: CombatEventType;
  actor: "A" | "D";
  target?: "A" | "D";
  value?: number;
  location?: string;
  result?: string | boolean;
  metadata?: Record<string, unknown>;
}

export interface MinuteEvent {
  minute: number;
  text: string;
  phase?: "OPENING" | "MID" | "LATE";
  offTacticA?: string;
  defTacticA?: string;
  offTacticD?: string;
  defTacticD?: string;
  protectA?: string;
  protectD?: string;
  events?: CombatEvent[];
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
    causeBucket?: DeathCauseBucket;
    fatalHitLocation?: string;
    fatalExchangeIndex?: number;
    tags?: string[];
  };
}

export interface FightSummary {
  id: string;
  week: number;
  phase?: "planning" | "resolution";
  pendingResolutionData?: {
    gazette: NewsletterItem[];
    injuries: string[];
    deaths: string[];
    bouts: BoutResult[];
    promotions: string[];
  };
  tournamentId?: string | null;
  title: string;
  a: string;
  d: string;
  stableA?: string;
  stableD?: string;
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
  isDeathEvent?: boolean;
  deathEventData?: DeathEvent;
  isRivalry?: boolean;
}

export { 
  FightingStyle, 
  type NewsletterItem, 
  type Gear, 
  type FightPlan, 
  type AttackTarget, 
  type ProtectTarget, 
  type OffensiveTactic, 
  type DefensiveTactic, 
  type PhaseStrategy,
  type DeathEvent
};
