import type {
  GameState,
  LedgerEntry,
  NewsletterItem,
  RivalStableData,
  RankingEntry,
  Season,
  WeatherType,
  BoutOffer,
  Promoter,
  Trainer,
  OwnerGrudge,
  Rivalry,
  CrowdMoodType,
  AnnualAward,
  SeasonalGrowth,
  TrainingAssignment,
  SimulationReport,
  GazetteStory,
  HallEntry,
  MatchRecord,
  RestState,
  ScoutReportData,
  InsightToken,
  TournamentEntry
} from "@/types/state.types";
import type { Warrior } from "@/types/warrior.types";
import type { FightSummary } from "@/types/combat.types";
import type { PoolWarrior } from "@/engine/recruitment";
import type { WarriorId, StableId, TournamentId } from "@/types/shared.types";

export interface StateImpact {
  treasuryDelta?: number;
  fameDelta?: number;
  popularityDelta?: number;
  rosterUpdates?: Map<WarriorId, Partial<Warrior>>;
  rosterRemovals?: WarriorId[];
  rivalsUpdates?: Map<StableId, Partial<RivalStableData>>;
  newsletterItems?: NewsletterItem[];
  ledgerEntries?: LedgerEntry[];
  seasonalGrowth?: SeasonalGrowth[];
  newPoolRecruits?: PoolWarrior[];
  recruitPool?: PoolWarrior[];
  tournaments?: TournamentEntry[];
  isTournamentWeek?: boolean;
  activeTournamentId?: TournamentId;
  day?: number;
  graveyard?: Warrior[];
  week?: number;
  season?: Season;
  weather?: WeatherType;
  realmRankings?: Record<string, RankingEntry>;
  boutOffers?: Record<string, BoutOffer>;
  promoters?: Record<string, Promoter>;
  trainers?: Trainer[];
  hiringPool?: Trainer[];
  gazettes?: GazetteStory[];
  ownerGrudges?: OwnerGrudge[];
  rivalries?: Rivalry[];
  trainingAssignments?: TrainingAssignment[];
  lastSimulationReport?: SimulationReport;
  arenaHistory?: FightSummary[];
  hallOfFame?: HallEntry[];
  matchHistory?: MatchRecord[];
  moodHistory?: { week: number; mood: CrowdMoodType }[];
  retired?: Warrior[];
  scoutReports?: ScoutReportData[];
  insightTokens?: InsightToken[];
  playerChallenges?: string[];
  playerAvoids?: string[];
  coachDismissed?: string[];
  restStates?: RestState[];
  unacknowledgedDeaths?: string[];
  crowdMood?: CrowdMoodType;
  awards?: AnnualAward[];
}

export type MergeStrategy = 'accumulate' | 'append' | 'mapMerge' | 'replace';

export type MergeConfig = {
  [K in keyof StateImpact]: { strategy: MergeStrategy; defaultValue: StateImpact[K] };
};

export type ImpactHandler<K extends keyof StateImpact> = (state: GameState, value: Exclude<StateImpact[K], undefined>) => void;
