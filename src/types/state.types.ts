import { 
  FightingStyle, 
  type Attributes, 
  type Season, 
  type CrowdMoodType, 
  type NewsletterItem,
  type TrainerTier,
  type TrainerFocus,
  type ScoutQuality,
  type WeatherType
} from "./shared.types";
import { type Warrior, type DeathEvent } from "./warrior.types";
export type { Warrior, DeathEvent, WeatherType };
import { type FightSummary, type FightOutcomeBy } from "./combat.types";
import type { PoolWarrior } from "@/engine/recruitment";
export type { PoolWarrior };

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
}

// ─── Game State ─────────────────────────────────────────────────────────────

export interface TournamentBout {
  round: number;
  matchIndex: number;
  a: string;
  d: string;
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
  name: string;
  bracket: TournamentBout[];
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
  week: number;
  label: string;
  amount: number;
  category: "fight" | "training" | "recruit" | "trainer" | "upkeep" | "prize" | "other";
}

export type AIIntent = "EXPANSION" | "CONSOLIDATION" | "VENDETTA" | "RECOVERY";

export interface AIStrategy {
  intent: AIIntent;
  targetStableId?: string;
  planWeeksRemaining: number;
}

export interface TrainerData {
  id: string;
  name: string;
  tier: TrainerTier;
  focus: TrainerFocus;
  fame: number;
  contractWeeksLeft: number;
  retiredFromWarrior?: string;
  retiredFromStyle?: string;
  styleBonusStyle?: string;
}

export interface AIEvent {
  week: number;
  type: "STRATEGY" | "FINANCE" | "ROSTER" | "STAFF";
  description: string;
  riskTier: "Low" | "Medium" | "High";
}

export interface AIAgentMemory {
  lastGold: number;
  burnRate: number;
  metaAwareness: Record<string, number>; // FightingStyle -> popularity/winrate
  knownRivals: string[]; // List of stable IDs they are tracking
}

export interface RivalStableData {
  owner: Owner;
  roster: Warrior[];
  trainers?: TrainerData[];
  gold: number;
  strategy?: AIStrategy;
  agentMemory?: AIAgentMemory;
  actionHistory?: AIEvent[];
  motto?: string;
  origin?: string;
  philosophy?: string;
  tier?: "Minor" | "Established" | "Major" | "Legendary";
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
  ownerIdA: string;
  ownerIdB: string;
  intensity: number;
  reason: string;
  startWeek: number;
  lastEscalation: number;
}

export interface GazetteStory {
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
  week: number;
  label: "Fight of the Week" | "Fight of the Tournament";
  fightId: string;
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
  gold: number;
  ledger: LedgerEntry[];
  week: number;
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
  trainers: TrainerData[];
  hiringPool: TrainerData[];
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
}

export interface UIPrefs {
  autoTunePlan: boolean;
  dashboardLayout?: string[];
}
