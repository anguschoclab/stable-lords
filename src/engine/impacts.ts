import type { GameState, LedgerEntry, NewsletterItem, RivalStableData, RankingEntry, Season, WeatherType, BoutOffer, Promoter, Trainer, OwnerGrudge, Rivalry, CrowdMoodType, AnnualAward, SeasonalGrowth, TrainingAssignment, SimulationReport, GazetteStory, HallEntry, MatchRecord, RestState, ScoutReportData, InsightToken, TournamentEntry } from "@/types/state.types";
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

type ImpactHandler<K extends keyof StateImpact> = (state: GameState, value: Exclude<StateImpact[K], undefined>) => void;

const impactHandlers: { [K in keyof StateImpact]-?: ImpactHandler<K> } = {
  treasuryDelta: (state, value) => { state.treasury = (state.treasury ?? 0) + value; },
  fameDelta: (state, value) => {
    state.fame = (state.fame ?? 0) + value;
    if (state.player) state.player.fame = (state.player.fame ?? 0) + value;
  },
  popularityDelta: (state, value) => { state.popularity = (state.popularity ?? 0) + value; },
  rosterRemovals: (state, value) => {
    if (value.length === 0) return;
    state.roster = state.roster.filter(w => !value.includes(w.id));
  },
  rosterUpdates: (state, value) => {
    if (value.size === 0) return;
    state.roster = state.roster.map(w => {
      const update = value.get(w.id);
      return update ? { ...w, ...update } : w;
    });
  },
  rivalsUpdates: (state, value) => {
    if (value.size === 0) return;
    state.rivals = state.rivals.map(r => {
      const update = value.get(r.owner.id);
      return update ? { ...r, ...update } : r;
    });
  },
  newsletterItems: (state, value) => { state.newsletter = [...(state.newsletter || []), ...value]; },
  ledgerEntries: (state, value) => { state.ledger = [...(state.ledger ?? []), ...value]; },
  seasonalGrowth: (state, value) => { state.seasonalGrowth = [...(state.seasonalGrowth || []), ...value]; },
  week: (state, value) => { state.week = value; },
  season: (state, value) => { state.season = value; },
  weather: (state, value) => { state.weather = value; },
  realmRankings: (state, value) => { state.realmRankings = value; },
  arenaHistory: (state, value) => { state.arenaHistory = [...(state.arenaHistory || []), ...value]; },
  hallOfFame: (state, value) => { state.hallOfFame = [...(state.hallOfFame || []), ...value]; },
  matchHistory: (state, value) => { state.matchHistory = [...(state.matchHistory || []), ...value]; },
  moodHistory: (state, value) => { state.moodHistory = [...(state.moodHistory || []), ...value]; },
  retired: (state, value) => { state.retired = [...(state.retired || []), ...value]; },
  scoutReports: (state, value) => { state.scoutReports = [...(state.scoutReports || []), ...value]; },
  insightTokens: (state, value) => { state.insightTokens = [...(state.insightTokens || []), ...value]; },
  playerChallenges: (state, value) => { state.playerChallenges = [...(state.playerChallenges || []), ...value]; },
  playerAvoids: (state, value) => { state.playerAvoids = [...(state.playerAvoids || []), ...value]; },
  coachDismissed: (state, value) => { state.coachDismissed = [...(state.coachDismissed || []), ...value]; },
  restStates: (state, value) => { state.restStates = [...(state.restStates || []), ...value]; },
  crowdMood: (state, value) => { state.crowdMood = value; },
  unacknowledgedDeaths: (state, value) => { state.unacknowledgedDeaths = [...(state.unacknowledgedDeaths || []), ...value]; },
  awards: (state, value) => { state.awards = [...(state.awards || []), ...value]; },
  boutOffers: (state, value) => { state.boutOffers = value; },
  promoters: (state, value) => { state.promoters = value; },
  recruitPool: (state, value) => { state.recruitPool = value; },
  tournaments: (state, value) => { 
    if (!value || value.length === 0) return;
    const existing = state.tournaments || [];
    const updated = existing.map(t => {
      const replacement = value.find(v => v.id === t.id);
      return replacement ? replacement : t;
    });
    // Add any new tournaments that weren't in the existing array
    const newTournaments = value.filter(v => !existing.find(e => e.id === v.id));
    state.tournaments = [...updated, ...newTournaments];
  },
  isTournamentWeek: (state, value) => { state.isTournamentWeek = value; },
  activeTournamentId: (state, value) => { state.activeTournamentId = value; },
  day: (state, value) => { state.day = value; },
  graveyard: (state, value) => { state.graveyard = [...(state.graveyard || []), ...value]; },
  trainers: (state, value) => { state.trainers = value; },
  hiringPool: (state, value) => { state.hiringPool = value; },
  gazettes: (state, value) => { state.gazettes = value; },
  ownerGrudges: (state, value) => { state.ownerGrudges = value; },
  rivalries: (state, value) => { state.rivalries = value; },
  trainingAssignments: (state, value) => { state.trainingAssignments = value; },
  lastSimulationReport: (state, value) => { state.lastSimulationReport = value; },
  newPoolRecruits: (state, value) => { state.recruitPool = value; }
};

export function resolveImpacts(state: GameState, impacts: StateImpact[]): GameState {
  const newState = { ...state };
  for (const impact of impacts) {
    (Object.keys(impact) as Array<keyof StateImpact>).forEach(key => {
      const value = impact[key];
      if (value !== undefined) {
        const handler = impactHandlers[key] as ImpactHandler<typeof key>;
        if (handler) {
          handler(newState, value as any); // Cast only here because of the generic key loss in forEach
        }
      }
    });
  }
  return newState;
}

// Merge strategy configuration
type MergeStrategy = 'accumulate' | 'append' | 'mapMerge' | 'replace';

type MergeConfig = {
  [K in keyof StateImpact]: { strategy: MergeStrategy; defaultValue: StateImpact[K] };
};

const MERGE_CONFIG: MergeConfig = {
  treasuryDelta: { strategy: 'accumulate', defaultValue: 0 },
  fameDelta: { strategy: 'accumulate', defaultValue: 0 },
  popularityDelta: { strategy: 'accumulate', defaultValue: 0 },
  rosterUpdates: { strategy: 'mapMerge', defaultValue: new Map() },
  rivalsUpdates: { strategy: 'mapMerge', defaultValue: new Map() },
  newsletterItems: { strategy: 'append', defaultValue: [] },
  ledgerEntries: { strategy: 'append', defaultValue: [] },
  graveyard: { strategy: 'append', defaultValue: [] },
  arenaHistory: { strategy: 'append', defaultValue: [] },
  matchHistory: { strategy: 'append', defaultValue: [] },
  restStates: { strategy: 'append', defaultValue: [] },
  insightTokens: { strategy: 'append', defaultValue: [] },
  awards: { strategy: 'append', defaultValue: [] },
  retired: { strategy: 'append', defaultValue: [] },
  scoutReports: { strategy: 'append', defaultValue: [] },
  hallOfFame: { strategy: 'append', defaultValue: [] },
  moodHistory: { strategy: 'append', defaultValue: [] },
  playerChallenges: { strategy: 'append', defaultValue: [] },
  playerAvoids: { strategy: 'append', defaultValue: [] },
  coachDismissed: { strategy: 'append', defaultValue: [] },
  unacknowledgedDeaths: { strategy: 'append', defaultValue: [] },
  seasonalGrowth: { strategy: 'append', defaultValue: [] },
  rosterRemovals: { strategy: 'append', defaultValue: [] },
  tournaments: { strategy: 'replace', defaultValue: undefined },
  recruitPool: { strategy: 'replace', defaultValue: undefined },
  newPoolRecruits: { strategy: 'replace', defaultValue: undefined },
  realmRankings: { strategy: 'replace', defaultValue: undefined },
  boutOffers: { strategy: 'replace', defaultValue: undefined },
  promoters: { strategy: 'replace', defaultValue: undefined },
  trainers: { strategy: 'replace', defaultValue: undefined },
  hiringPool: { strategy: 'replace', defaultValue: undefined },
  gazettes: { strategy: 'replace', defaultValue: undefined },
  ownerGrudges: { strategy: 'replace', defaultValue: undefined },
  rivalries: { strategy: 'replace', defaultValue: undefined },
  trainingAssignments: { strategy: 'replace', defaultValue: undefined },
  lastSimulationReport: { strategy: 'replace', defaultValue: undefined },
  isTournamentWeek: { strategy: 'replace', defaultValue: undefined },
  activeTournamentId: { strategy: 'replace', defaultValue: undefined },
  day: { strategy: 'replace', defaultValue: undefined },
  week: { strategy: 'replace', defaultValue: undefined },
  season: { strategy: 'replace', defaultValue: undefined },
  weather: { strategy: 'replace', defaultValue: undefined },
  crowdMood: { strategy: 'replace', defaultValue: undefined },
};

export function mergeImpacts(impacts: StateImpact[]): StateImpact {
  const merged: StateImpact = {} as StateImpact;

  // Initialize merged with default values
  (Object.keys(MERGE_CONFIG) as Array<keyof StateImpact>).forEach(key => {
    const config = MERGE_CONFIG[key];
    if (Array.isArray(config.defaultValue)) {
      (merged as any)[key] = [...config.defaultValue];
    } else if (config.defaultValue instanceof Map) {
      (merged as any)[key] = new Map(config.defaultValue);
    } else {
      (merged as any)[key] = config.defaultValue;
    }
  });

  for (const imp of impacts) {
    (Object.keys(MERGE_CONFIG) as Array<keyof StateImpact>).forEach(key => {
      const config = MERGE_CONFIG[key];
      const value = imp[key];
      if (value === undefined || value === null) return;

      switch (config.strategy) {
        case 'accumulate':
          if (typeof value === 'number') {
            (merged as any)[key] = ((merged as any)[key] || 0) + value;
          }
          break;
        case 'append':
          if (Array.isArray(value)) {
            (merged as any)[key] = ((merged as any)[key] || []).concat(value);
          }
          break;
        case 'mapMerge':
          if (value instanceof Map) {
            const targetMap = (merged as any)[key] as Map<string, object>;
            value.forEach((val, mapKey) => {
              const existing = targetMap.get(mapKey as any) || {};
              targetMap.set(mapKey as any, { ...existing, ...val });
            });
          }
          break;
        case 'replace':
          (merged as any)[key] = value;
          break;
      }
    });
  }

  return merged;
}
