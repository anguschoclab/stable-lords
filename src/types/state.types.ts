import { 
  FightingStyle, 
  type Attributes, 
  type Season, 
  type CrowdMoodType, 
  type NewsletterItem,
  type TrainerTier,
  type TrainerFocus,
  type Trainer,
  type ScoutQuality,
  type WeatherType
} from "./shared.types";

import { type Warrior, type DeathEvent } from "./warrior.types";
import { type CrestData } from "./crest.types";

export type { 
  Warrior, 
  DeathEvent, 
  WeatherType,
  Season,
  CrowdMoodType,
  NewsletterItem,
  TrainerTier,
  TrainerFocus,
  Trainer,
  ScoutQuality,
  CrestData
};
import { type FightSummary, type FightOutcomeBy } from "./combat.types";
export type { FightSummary, FightOutcomeBy };
import type { PoolWarrior } from "@/engine/recruitment";
export type { PoolWarrior };

// ─── Ranking & Contracts ───────────────────────────────────────────────────

export interface RankingEntry {
  overallRank: number;
  classRank: number;
  compositeScore: number;
}

export type BoutOfferStatus = "Proposed" | "Signed" | "Rejected" | "Canceled" | "Expired";
export type BoutOfferResponse = "Pending" | "Accepted" | "Declined";

export interface BoutOffer {
  id: string;
  promoterId: string;
  warriorIds: string[];
  boutWeek: number;
  expirationWeek: number;
  purse: number;
  hype: number;
  status: BoutOfferStatus;
  responses: Record<string, BoutOfferResponse>;
}

export type PromoterPersonality = "Greedy" | "Honorable" | "Sadistic" | "Flashy" | "Corporate";

export interface Promoter {
  id: string;
  name: string;
  age: number;
  personality: PromoterPersonality;
  tier: "Local" | "Regional" | "National" | "Legendary";
  capacity: number; // Max bouts per week
  biases: FightingStyle[];
  history: {
    totalPursePaid: number;
    notableBouts: string[];
    mentorId?: string;
    legacyFame: number;
  };
}

// ─── Owner / Stable ─────────────────────────────────────────────────────────

export type OwnerPersonality = "Aggressive" | "Methodical" | "Showman" | "Pragmatic" | "Tactician";
export type MetaAdaptation = "MetaChaser" | "Traditionalist" | "Opportunist" | "Innovator";

export interface Owner {
  id: string;
  name: string;
  stableName: string;
  fame: number;
  renown: number;
  titles: number;
  personality?: OwnerPersonality;
  metaAdaptation?: MetaAdaptation;
  favoredStyles?: FightingStyle[];
  generation?: number; // 🛡️ Crest lineage depth (0 = original founder)
  crest?: CrestData; // 🛡️ Heraldic crest for the stable
}

// ─── Game State ─────────────────────────────────────────────────────────────

export interface TournamentBout {
  round: number;
  matchIndex: number;
  a: string; // snapshots name for display
  d: string; 
  warriorIdA: string;
  warriorIdD: string;
  stableIdA?: string;
  stableIdD?: string;
  stableA?: string;
  stableD?: string;
  winner?: "A" | "D" | null;
  by?: FightOutcomeBy;
  fightId?: string;
}

export interface TournamentEntry {
  id: string;
  season: Season;
  week: number;
  tierId: string; // 🌩️ Tier Identity (v1.0)
  name: string;
  bracket: TournamentBout[];
  participants: Warrior[]; // Persisted 64-man roster (including Freelancers)
  champion?: string;
  completed: boolean;
}

export interface TrainingAssignment {
  warriorId: string;
  type: "attribute" | "recovery";
  attribute?: keyof Attributes;
}

export interface SeasonalGrowth {
  warriorId: string;
  season: Season;
  gains: Partial<Record<keyof Attributes, number>>;
}

export interface LedgerEntry {
  id: string;
  week: number;
  label: string;
  amount: number;
  category: "fight" | "training" | "recruit" | "trainer" | "upkeep" | "prize" | "other";
}

export type AIIntent = "EXPANSION" | "CONSOLIDATION" | "VENDETTA" | "RECOVERY" | "SURVIVAL" | "WEALTH_ACCUMULATION" | "AGGRESSIVE_EXPANSION" | "ROSTER_DIVERSITY";

export interface AIStrategy {
  intent: AIIntent;
  targetStableId?: string;
  planWeeksRemaining: number;
}

// TrainerData was here, now using Trainer from shared.types

export interface AIEvent {
  id: string;
  week: number;
  type: "STRATEGY" | "FINANCE" | "ROSTER" | "STAFF";
  description: string;
  riskTier: "Low" | "Medium" | "High";
}

export interface AIAgentMemory {
  lastTreasury: number;
  burnRate: number;
  metaAwareness: Record<string, number>; 
  knownRivals: string[]; 
  currentIntent?: AIIntent;
}

export interface RivalStableData {
  id: string;
  owner: Owner;
  fame: number; // 🏗️ Prestige Persistence
  roster: Warrior[];
  trainers?: Trainer[];
  treasury: number;
  strategy?: AIStrategy;
  agentMemory?: AIAgentMemory;
  actionHistory?: AIEvent[];
  motto?: string;
  origin?: string;
  philosophy?: string;
  tier?: "Minor" | "Established" | "Major" | "Legendary";
  crest?: CrestData;
}

export interface ScoutReportData {
  id: string;
  warriorName: string;
  style: string;
  quality: ScoutQuality;
  week: number;
  attributeRanges: Record<string, string>;
  record: string;
  knownInjuries: string[];
  suspectedOE?: string;
  suspectedAL?: string;
  notes: string;
}

export interface RestState {
  warriorId: string;
  restUntilWeek: number;
}

export interface Rivalry {
  id: string;
  stableIdA: string;
  stableIdB: string;
  intensity: number;
  reason: string;
  startWeek: number;
}

export interface MatchRecord {
  week: number;
  playerWarriorId: string;
  opponentWarriorId: string;
  opponentStableId: string;
}

export interface OwnerGrudge {
  id: string;
  ownerIdA: string;
  ownerIdB: string;
  intensity: number;
  reason: string;
  startWeek: number;
  lastEscalation: number;
}

export interface GazetteStory {
  id: string;
  headline: string;
  body: string;
  mood: CrowdMoodType;
  tags: string[];
  week: number;
}

export type InsightTokenType = "Weapon" | "Rhythm" | "Style" | "Attribute" | "Tactic";

export interface InsightToken {
  id: string;
  type: InsightTokenType;
  warriorId: string;
  warriorName: string;
  detail: string;
  targetKey?: string;
  discoveredWeek: number;
}

export interface HallEntry {
  id: string;
  week: number;
  label: "Fight of the Week" | "Fight of the Tournament";
  fightId: string;
}

// ─── Simulation & Awards ────────────────────────────────────────────────────

export interface SimulationReport {
  id: string;
  week: number;
  treasuryChange: number;
  trainingGains: { warriorId: string; warriorName: string; attr: string; gain: number }[];
  agingEvents: string[];
  healthEvents: string[];
  bouts?: import("@/types/combat.types").FightSummary[];
}

export type AnnualAwardType = "WARRIOR_OF_YEAR" | "KILLER_OF_YEAR" | "STABLE_OF_YEAR" | "CLASS_MVP" | "TOURNAMENT_RANK";

export interface AnnualAward {
  year: number;
  type: AnnualAwardType;
  warriorId?: string;
  warriorName?: string;
  stableId?: string;
  stableName?: string;
  style?: FightingStyle;
  value: number; // e.g. 15 wins, 5 kills
  reason: string;
}

export interface GameState {
  meta: {
    gameName: string;
    version: string;
    createdAt: string;
  };
  pendingResolutionData?: {
    gazette: NewsletterItem[];
    injuries: string[];
    deaths: string[];
    bouts: import("@/engine/boutProcessor").BoutResult[];
    promotions: string[];
  };
  ftueComplete: boolean;
  ftueStep?: number;
  coachDismissed: string[];
  player: Owner;
  fame: number;
  popularity: number;
  treasury: number;
  ledger: LedgerEntry[];
  week: number;
  year: number; // 🌩️ Calendar Authority (v1.0)
  phase: "planning" | "resolution";
  season: Season;
  weather: WeatherType;
  roster: Warrior[];
  graveyard: Warrior[];
  retired: Warrior[];
  arenaHistory: FightSummary[];
  newsletter: NewsletterItem[];
  gazettes: GazetteStory[];
  hallOfFame: HallEntry[];
  crowdMood: CrowdMoodType;
  tournaments: TournamentEntry[];
  trainers: Trainer[];
  hiringPool: Trainer[];
  trainingAssignments: TrainingAssignment[];
  seasonalGrowth: SeasonalGrowth[];
  rivals: RivalStableData[];
  scoutReports: ScoutReportData[];
  restStates: RestState[];
  rivalries: Rivalry[];
  matchHistory: MatchRecord[];
  playerChallenges: string[];
  playerAvoids: string[];
  recruitPool: PoolWarrior[];
  rosterBonus: number;
  ownerGrudges: OwnerGrudge[];
  insightTokens: InsightToken[];
  moodHistory: { week: number; mood: CrowdMoodType }[];
  settings: {
    featureFlags: {
      tournaments: boolean;
      scouting: boolean;
    };
  };
  isFTUE: boolean;
  unacknowledgedDeaths: string[];
  // ─── Daily Progression ───
  day: number; // 0-7
  isTournamentWeek: boolean;
  activeTournamentId?: string;
  // ─── Promoter System ───
  promoters: Record<string, Promoter>;
  boutOffers: Record<string, BoutOffer>;
  realmRankings: Record<string, RankingEntry>;
  awards: AnnualAward[]; // 🏗️ Prestige Persistence
  lastSimulationReport?: SimulationReport;
  cachedMetaDrift?: import("@/engine/metaDrift").StyleMeta; // ⚡ Bolt: Cache meta drift weekly for AI components
  warriorMap?: Map<string, import("@/types/warrior.types").Warrior>; // ⚡ Bolt: Cache warrior map weekly for bout processing
}

export interface UIPrefs {
  autoTunePlan: boolean;
  dashboardLayout?: string[];
}
