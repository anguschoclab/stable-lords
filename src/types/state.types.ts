import {
  type WeatherType,
  type WarriorId,
  type StableId,
  type PromoterId,
  type TournamentId,
  type BoutOfferId,
  type LedgerEntryId,
  type ScoutReportId,
  type NewsId,
  type GrudgeId,
  type RivalryId,
  type InsightId,
  type HallEntryId,
  type SimulationReportId,
  type Season,
  type CrowdMoodType,
  type NewsletterItem,
  type TrainerTier,
  type TrainerFocus,
  type Trainer,
  type ScoutQuality,
  type FightingStyle,
  type FightId,
  type Attributes,
  type BaseSkills,
} from './shared.types';

import { type Warrior, type DeathEvent } from './warrior.types';
import { type CrestData } from './crest.types';

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
  CrestData,
};
import { type FightSummary, type FightOutcomeBy } from './combat.types';
export type { FightSummary, FightOutcomeBy };
import type { PoolWarrior } from '@/engine/recruitment';
export type { PoolWarrior };

// ─── Ranking & Contracts ───────────────────────────────────────────────────

export interface RankingEntry {
  overallRank: number;
  classRank: number;
  compositeScore: number;
}

export type BoutOfferStatus = 'Proposed' | 'Signed' | 'Rejected' | 'Canceled' | 'Expired';
export type BoutOfferResponse = 'Pending' | 'Accepted' | 'Declined';

export interface BoutOffer {
  id: BoutOfferId;
  promoterId: PromoterId;
  warriorIds: WarriorId[];
  boutWeek: number;
  expirationWeek: number;
  purse: number;
  hype: number;
  status: BoutOfferStatus;
  responses: Record<WarriorId, BoutOfferResponse>;
  proposerStableId?: StableId;
  conditions?: string[];
  createdAt?: string;
}

export type PromoterPersonality = 'Greedy' | 'Honorable' | 'Sadistic' | 'Flashy' | 'Corporate';

export interface Promoter {
  id: PromoterId;
  name: string;
  age: number;
  personality: PromoterPersonality;
  tier: 'Local' | 'Regional' | 'National' | 'Legendary';
  capacity: number; // Max bouts per week
  biases: FightingStyle[];
  history: {
    totalPursePaid: number;
    notableBouts: FightId[];
    mentorId?: PromoterId;
    legacyFame: number;
  };
}

// ─── Owner / Stable ─────────────────────────────────────────────────────────

export type OwnerPersonality = 'Aggressive' | 'Methodical' | 'Showman' | 'Pragmatic' | 'Tactician';
export type MetaAdaptation = 'MetaChaser' | 'Traditionalist' | 'Opportunist' | 'Innovator';

export interface Owner {
  id: StableId;
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
  backstoryId?: import('@/data/backstories').BackstoryId;
  foundedByWarriorId?: WarriorId; // Lineage breadcrumb for legacy founders
  age?: number; // 🎂 1.0 Hardening: Owner age for retirement
  ageRetired?: number; // Week the previous owner retired
}

// ─── Game State ─────────────────────────────────────────────────────────────

export interface TournamentBout {
  round: number;
  matchIndex: number;
  a: string; // snapshots name for display
  d: string;
  warriorIdA: WarriorId;
  warriorIdD: WarriorId;
  stableIdA?: StableId;
  stableIdD?: StableId;
  stableA?: string;
  stableD?: string;
  winner?: 'A' | 'D' | null;
  by?: FightOutcomeBy;
  fightId?: FightId;
}

export interface TournamentEntry {
  id: TournamentId;
  season: Season;
  week: number;
  tierId: string; // 🌩️ Tier Identity (v1.0)
  name: string;
  bracket: TournamentBout[];
  participants: Warrior[];
  champion?: WarriorId;
  completed: boolean;
}

export interface TrainingAssignment {
  warriorId: WarriorId;
  type: 'attribute' | 'recovery' | 'skillDrill';
  attribute?: keyof Attributes;
  /** For skillDrill assignments — which combat skill to drill (ATT/PAR/DEF/INI/RIP/DEC). */
  skill?: keyof BaseSkills;
}

export interface SeasonalGrowth {
  warriorId: WarriorId;
  season: Season;
  gains: Partial<Record<keyof Attributes, number>>;
}

export interface LedgerEntry {
  id: LedgerEntryId;
  week: number;
  label: string;
  amount: number;
  category: 'fight' | 'training' | 'recruit' | 'trainer' | 'upkeep' | 'prize' | 'other';
}

export type AIIntent =
  | 'EXPANSION'
  | 'CONSOLIDATION'
  | 'VENDETTA'
  | 'RECOVERY'
  | 'SURVIVAL'
  | 'WEALTH_ACCUMULATION'
  | 'AGGRESSIVE_EXPANSION'
  | 'ROSTER_DIVERSITY';

export interface AIStrategy {
  intent: AIIntent;
  targetStableId?: StableId;
  planWeeksRemaining: number;
}

// TrainerData was here, now using Trainer from shared.types

export interface AIEvent {
  id: string; // Events are often transient or don't need branding if not referenced
  week: number;
  type: 'STRATEGY' | 'FINANCE' | 'ROSTER' | 'STAFF';
  description: string;
  riskTier: 'Low' | 'Medium' | 'High';
}

export interface AIAgentMemory {
  lastTreasury: number;
  burnRate: number;
  metaAwareness: Record<string, number>;
  knownRivals: StableId[];
  currentIntent?: AIIntent;
  seasonRecord?: {
    wins: number;
    losses: number;
    kills: number;
    rosterSizeAtSeasonStart: number;
  };
}

export interface RivalStableData {
  id: StableId;
  owner: Owner;
  fame: number;
  roster: Warrior[];
  trainers?: Trainer[];
  treasury: number;
  strategy?: AIStrategy;
  agentMemory?: AIAgentMemory;
  actionHistory?: AIEvent[];
  motto?: string;
  origin?: string;
  philosophy?: string;
  tier?: 'Minor' | 'Established' | 'Major' | 'Legendary';
  crest?: CrestData;
  seasonalGrowth?: SeasonalGrowth[];
}

export interface ScoutReportData {
  id: ScoutReportId;
  warriorName: string;
  style: string;
  quality: ScoutQuality;
  week: number;
  attributeRanges: Partial<Record<keyof Attributes, string>>;
  record: string;
  knownInjuries: string[];
  suspectedOE?: string;
  suspectedAL?: string;
  notes: string;
}

export interface RestState {
  warriorId: WarriorId;
  restUntilWeek: number;
}

export interface Rivalry {
  id: RivalryId;
  stableIdA: StableId;
  stableIdB: StableId;
  intensity: number;
  reason: string;
  startWeek: number;
}

export interface MatchRecord {
  week: number;
  playerWarriorId: WarriorId;
  opponentWarriorId: WarriorId;
  opponentStableId: StableId;
}

export interface OwnerGrudge {
  id: GrudgeId;
  ownerIdA: StableId;
  ownerIdB: StableId;
  intensity: number;
  reason: string;
  startWeek: number;
  lastEscalation: number;
}

export interface GazetteStory {
  id: NewsId;
  headline: string;
  body: string;
  mood: CrowdMoodType;
  tags: string[];
  week: number;
}

export type InsightTokenType = 'Weapon' | 'Rhythm' | 'Style' | 'Attribute' | 'Tactic';

export interface InsightToken {
  id: InsightId;
  type: InsightTokenType;
  warriorId: WarriorId;
  warriorName: string;
  detail: string;
  targetKey?: string;
  discoveredWeek: number;
}

export interface HallEntry {
  id: HallEntryId;
  week: number;
  label: 'Fight of the Week' | 'Fight of the Tournament';
  fightId: FightId;
}

// ─── Simulation & Awards ────────────────────────────────────────────────────

export interface SimulationReport {
  id: SimulationReportId;
  week: number;
  treasuryChange: number;
  trainingGains: {
    warriorId: WarriorId;
    warriorName: string;
    attr: keyof Attributes;
    gain: number;
  }[];
  agingEvents: string[];
  healthEvents: string[];
  bouts?: import('@/types/combat.types').FightSummary[];
}

export type AnnualAwardType =
  | 'WARRIOR_OF_YEAR'
  | 'KILLER_OF_YEAR'
  | 'STABLE_OF_YEAR'
  | 'CLASS_MVP'
  | 'TOURNAMENT_RANK';

export interface AnnualAward {
  year: number;
  type: AnnualAwardType;
  warriorId?: WarriorId;
  warriorName?: string;
  stableId?: StableId;
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
    bouts: import('@/engine/boutProcessor').BoutResult[];
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
  phase: 'planning' | 'resolution';
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
  isFTUE: boolean;
  unacknowledgedDeaths: string[];
  // ─── Daily Progression ───
  day: number; // 0-7
  isTournamentWeek: boolean;
  activeTournamentId?: TournamentId;
  // ─── Promoter System ───
  promoters: Record<PromoterId, Promoter>;
  boutOffers: Record<BoutOfferId, BoutOffer>;
  realmRankings: Record<WarriorId, RankingEntry>;
  awards: AnnualAward[];
  lastSimulationReport?: SimulationReport;
  cachedMetaDrift?: import('@/engine/metaDrift').StyleMeta;
  warriorMap?: Map<WarriorId, import('@/types/warrior.types').Warrior>;
}

export interface UIPrefs {
  autoTunePlan: boolean;
  dashboardLayout?: string[];
}
