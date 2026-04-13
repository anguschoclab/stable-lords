import type { GameState, LedgerEntry, NewsletterItem, RivalStableData, RankingEntry, Season, WeatherType, BoutOffer, Promoter, Trainer, OwnerGrudge, Rivalry, CrowdMoodType, AnnualAward, SeasonalGrowth, TrainingAssignment, SimulationReport, GazetteStory, HallEntry, MatchRecord, RestState, ScoutReportData, InsightToken, TournamentEntry } from "@/types/state.types";
import type { Warrior } from "@/types/warrior.types";
import type { FightSummary } from "@/types/combat.types";
import type { PoolWarrior } from "@/engine/recruitment";

export interface StateImpact { 
  treasuryDelta?: number; 
  fameDelta?: number; 
  rosterUpdates?: Map<string, Partial<Warrior>>; 
  rivalsUpdates?: Map<string, Partial<RivalStableData>>; 
  newsletterItems?: NewsletterItem[]; 
  ledgerEntries?: LedgerEntry[]; 
  seasonalGrowth?: SeasonalGrowth[]; 
  newPoolRecruits?: PoolWarrior[]; 
  recruitPool?: PoolWarrior[];
  tournaments?: TournamentEntry[];
  isTournamentWeek?: boolean;
  activeTournamentId?: string;
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
    for (const key of Object.keys(impact) as Array<keyof StateImpact>) {
      const value = impact[key];
      if (value !== undefined) {
        const handler = impactHandlers[key] as ImpactHandler<typeof key>;
        if (handler) {
          handler(newState, value as never); // Typesafe by construction, but TypeScript loses the generic linkage when iterating Object.keys
        }
      }
    }
  }
  return newState;
}

export function mergeImpacts(impacts: StateImpact[]): StateImpact {
  const merged: StateImpact = { treasuryDelta: 0, fameDelta: 0, rosterUpdates: new Map(), newsletterItems: [], ledgerEntries: [], boutOffers: {} };
  for (const imp of impacts) {
    if (imp.treasuryDelta) merged.treasuryDelta! += imp.treasuryDelta;
    if (imp.fameDelta) merged.fameDelta! += imp.fameDelta;
    if (imp.rosterUpdates) {
      imp.rosterUpdates.forEach((val, key) => { const existing = merged.rosterUpdates!.get(key) || {}; merged.rosterUpdates!.set(key, { ...existing, ...val }); });
    }
    if (imp.newsletterItems) merged.newsletterItems!.push(...imp.newsletterItems);
    if (imp.ledgerEntries) merged.ledgerEntries!.push(...imp.ledgerEntries);
    if (imp.tournaments) merged.tournaments = imp.tournaments;
    if (imp.awards) merged.awards = imp.awards;
  }
  return merged;
}
