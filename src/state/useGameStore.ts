import { create } from 'zustand';
import { shallow } from 'zustand/shallow';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import type { GameState } from '@/types/state.types';
import { type BoutResult } from '@/engine/boutProcessor';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { engineProxy } from '@/engine/workerProxy';
import { opfsArchive } from '@/engine/storage/opfsArchive';

// Helper to strip non-serializable fields before worker transfer
function stripNonSerializable<T extends { warriorMap?: unknown; cachedMetaDrift?: unknown }>(
  state: T
): Omit<T, 'warriorMap' | 'cachedMetaDrift'> {
  const { warriorMap, cachedMetaDrift, ...rest } = state;
  return rest;
}

// ─── Slices ────────────────────────────────────────────────────────────────
import { createEconomySlice, EconomySlice } from './slices/economySlice';
import { createRosterSlice, RosterSlice } from './slices/rosterSlice';
import { createWorldSlice, WorldSlice } from './slices/worldSlice';
import { createTournamentSlice, TournamentSlice } from './slices/tournamentSlice';

export interface GameStoreState {
  atTitleScreen: boolean;
  lastSavedAt: string | null;
  activeSlotId: string | null;
  isSimulating: boolean;
  isInitialized: boolean;
  eventLogOpen: boolean;
}

export interface GameStoreActions {
  setSimulating: (simulating: boolean) => void;
  toggleEventLog: () => void;
  doAdvanceWeek: (
    processedState?: GameState,
    results?: BoutResult[],
    deaths?: string[],
    injuries?: string[]
  ) => Promise<void>;
  doAdvanceDay: (
    processedState?: GameState,
    results?: BoutResult[],
    deaths?: string[],
    injuries?: string[]
  ) => Promise<void>;
  initialize: () => void;
  loadGame: (slotId: string, gameState: GameState) => void;
  doReset: () => void;
  returnToTitle: () => void;
  saveCurrentState: () => Promise<void>;
  setState: (fn: (state: GameStore) => void) => void;
}

export type GameStore = GameStoreState &
  GameStoreActions &
  EconomySlice &
  RosterSlice &
  WorldSlice &
  TournamentSlice;

let lastResult: GameState | null = null;

// Type for the extracted values from GameStore that we compare for change detection
// Note: This only includes properties that are directly extracted from store slices
type GameStateValues = {
  treasury: number;
  ledger: GameState['ledger'];
  roster: GameState['roster'];
  graveyard: GameState['graveyard'];
  retired: GameState['retired'];
  recruitPool: GameState['recruitPool'];
  insightTokens: GameState['insightTokens'];
  arenaHistory: GameState['arenaHistory'];
  player: GameState['player'];
  week: number;
  day: number;
  season: GameState['season'];
  weather: GameState['weather'];
  promoters: GameState['promoters'];
  boutOffers: GameState['boutOffers'];
  rivals: GameState['rivals'];
  gazettes: GameState['gazettes'];
  scoutReports: GameState['scoutReports'];
  unacknowledgedDeaths: GameState['unacknowledgedDeaths'];
  rosterBonus: number;
  tournaments: GameState['tournaments'];
  isTournamentWeek: boolean;
  activeTournamentId: GameState['activeTournamentId'];
  year: number;
  popularity: number;
  fame: number;
  realmRankings: GameState['realmRankings'];
  awards: GameState['awards'];
  trainers: GameState['trainers'];
  hiringPool: GameState['hiringPool'];
  trainingAssignments: GameState['trainingAssignments'];
  seasonalGrowth: GameState['seasonalGrowth'];
  restStates: GameState['restStates'];
  crowdMood: GameState['crowdMood'];
  moodHistory: GameState['moodHistory'];
  newsletter: GameState['newsletter'];
  hallOfFame: GameState['hallOfFame'];
  settings: GameState['settings'];
  isFTUE: boolean;
  ftueStep: GameState['ftueStep'];
  ftueComplete: boolean;
  coachDismissed: GameState['coachDismissed'];
  rivalries: GameState['rivalries'];
  matchHistory: GameState['matchHistory'];
  ownerGrudges: GameState['ownerGrudges'];
  phase: GameState['phase'];
  playerChallenges: GameState['playerChallenges'];
  playerAvoids: GameState['playerAvoids'];
};
let lastStoreValues: GameStateValues | null = null;

export function reconstructGameState(store: GameStore): GameState {
  const currentValues = {
    treasury: store.treasury,
    ledger: store.ledger,
    roster: store.roster,
    graveyard: store.graveyard,
    retired: store.retired,
    recruitPool: store.recruitPool,
    insightTokens: store.insightTokens,
    arenaHistory: store.arenaHistory,
    player: store.player,
    week: store.week,
    day: store.day,
    season: store.season,
    weather: store.weather,
    promoters: store.promoters,
    boutOffers: store.boutOffers,
    rivals: store.rivals,
    gazettes: store.gazettes,
    scoutReports: store.scoutReports,
    unacknowledgedDeaths: store.unacknowledgedDeaths,
    rosterBonus: store.rosterBonus,
    tournaments: store.tournaments,
    isTournamentWeek: store.isTournamentWeek,
    activeTournamentId: store.activeTournamentId,
    year: store.year,
    popularity: store.popularity,
    fame: store.fame,
    realmRankings: store.realmRankings,
    awards: store.awards,
    trainers: store.trainers,
    hiringPool: store.hiringPool,
    trainingAssignments: store.trainingAssignments,
    seasonalGrowth: store.seasonalGrowth,
    restStates: store.restStates,
    crowdMood: store.crowdMood,
    moodHistory: store.moodHistory,
    newsletter: store.newsletter,
    hallOfFame: store.hallOfFame,
    settings: store.settings,
    isFTUE: store.isFTUE,
    ftueStep: store.ftueStep,
    ftueComplete: store.ftueComplete,
    coachDismissed: store.coachDismissed,
    rivalries: store.rivalries,
    matchHistory: store.matchHistory,
    ownerGrudges: store.ownerGrudges,
    phase: store.phase,
    playerChallenges: store.playerChallenges,
    playerAvoids: store.playerAvoids,
  };

  if (lastResult && lastStoreValues) {
    let changed = false;
    const keys = Object.keys(currentValues) as Array<keyof GameStateValues>;
    for (const key of keys) {
      if (currentValues[key] !== lastStoreValues[key]) {
        changed = true;
        break;
      }
    }
    if (!changed) return lastResult;
  }

  const result: GameState = {
    meta: {
      gameName: 'Stable Lords',
      version: '2.1.0-hardened',
      createdAt: store.lastSavedAt || new Date().toISOString(),
    },
    ...currentValues,
    coachDismissed: store.coachDismissed || [],
    rivalries: store.rivalries || [],
    matchHistory: store.matchHistory || [],
    ownerGrudges: store.ownerGrudges || [],
    phase: store.phase || 'planning',
    playerChallenges: store.playerChallenges || [],
    playerAvoids: store.playerAvoids || [],
  };

  lastResult = result;
  lastStoreValues = currentValues;
  return result;
}

export const useGameStore = create<GameStore>()(
  subscribeWithSelector(
    immer((set, get, ...args) => ({
      // ─── Sub-Slices ───
      ...createEconomySlice(set, get, ...args),
      ...createRosterSlice(set, get, ...args),
      ...createWorldSlice(set, get, ...args),
      ...createTournamentSlice(set, get, ...args),

      // ─── Core State ───
      activeSlotId: null,
      atTitleScreen: true,
      lastSavedAt: null,
      isSimulating: false,
      isInitialized: false,
      eventLogOpen: false,

      toggleEventLog: () => {
        set((draft) => {
          draft.eventLogOpen = !draft.eventLogOpen;
        });
      },

      initialize: () => {
        set((draft) => {
          draft.isInitialized = true;
        });
      },

      loadGame: (slotId: string, state: GameState) => {
        set((draft) => {
          draft.treasury = state.treasury;
          draft.ledger = state.ledger;
          draft.roster = state.roster;
          draft.graveyard = state.graveyard;
          draft.retired = state.retired;
          draft.recruitPool = state.recruitPool;
          draft.insightTokens = state.insightTokens;
          draft.arenaHistory = state.arenaHistory;
          draft.player = state.player;
          draft.week = state.week;
          draft.day = state.day;
          draft.season = state.season;
          draft.weather = state.weather;
          draft.promoters = state.promoters || {};
          draft.boutOffers = state.boutOffers || {};
          draft.rivals = state.rivals;
          draft.gazettes = state.gazettes;
          draft.scoutReports = state.scoutReports || [];
          draft.unacknowledgedDeaths = state.unacknowledgedDeaths || [];
          draft.rosterBonus = state.rosterBonus || 0;
          draft.tournaments = state.tournaments || [];
          draft.isTournamentWeek = state.isTournamentWeek || false;
          draft.activeTournamentId = state.activeTournamentId;
          draft.year = state.year || 1;

          draft.popularity = state.popularity || 0;
          draft.fame = state.fame || 0;
          draft.realmRankings = state.realmRankings || {};
          draft.awards = state.awards || [];
          draft.trainers = state.trainers || [];
          draft.hiringPool = state.hiringPool || [];
          draft.trainingAssignments = state.trainingAssignments || [];
          draft.seasonalGrowth = state.seasonalGrowth || [];
          draft.restStates = state.restStates || [];
          draft.crowdMood = state.crowdMood || 'Neutral';
          draft.moodHistory = state.moodHistory || [];
          draft.newsletter = state.newsletter || [];
          draft.hallOfFame = state.hallOfFame || [];
          draft.settings = state.settings || {
            featureFlags: { tournaments: true, scouting: true },
          };
          draft.isFTUE = state.isFTUE || false;
          draft.ftueStep = state.ftueStep || 0;
          draft.ftueComplete = state.ftueComplete || false;
          draft.coachDismissed = state.coachDismissed || [];
          draft.rivalries = state.rivalries || [];
          draft.matchHistory = state.matchHistory || [];
          draft.ownerGrudges = state.ownerGrudges || [];
          draft.phase = state.phase || 'planning';
          draft.pendingResolutionData = state.pendingResolutionData;
          draft.playerChallenges = state.playerChallenges || [];
          draft.playerAvoids = state.playerAvoids || [];

          draft.activeSlotId = slotId;
          draft.atTitleScreen = false;
          draft.lastSavedAt = new Date().toISOString();
        });
        opfsArchive.archiveHotState(slotId, state);
      },

      setSimulating: (simulating: boolean) => {
        set((draft) => {
          draft.isSimulating = simulating;
        });
      },

      doAdvanceWeek: async (
        processedState?: GameState,
        results?: BoutResult[],
        deaths?: string[],
        injuries?: string[]
      ) => {
        const store = get();
        const raw = processedState || reconstructGameState(store);
        // In DEV mode (main thread), deep-clone to unfreeze immer's frozen objects
        // In PROD (worker), structured clone handles this automatically
        const state = import.meta.env.DEV ? JSON.parse(JSON.stringify(raw)) : raw;
        // Strip non-serializable fields before structured-clone transfer to worker
        const cleanState = stripNonSerializable(state) as GameState;
        const currentWeek = cleanState.week;

        set((draft) => {
          draft.isSimulating = true;
        });

        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Worker timeout after 15s')), 15000)
        );

        try {
          let next: GameState;
          if (cleanState.isTournamentWeek) {
            next = cleanState;
            for (let i = cleanState.day; i < 7; i++) {
              next = await Promise.race([engineProxy.advanceDay(next), timeout]);
            }
          } else {
            next = await Promise.race([engineProxy.advanceWeek(cleanState), timeout]);
          }

          next.phase = 'resolution';
          const resolutionPayload = {
            bouts: results || [],
            deaths: deaths || [],
            injuries: injuries || [],
            promotions: [],
            gazette: next.newsletter.filter((n) => n.week === currentWeek),
          };
          next.pendingResolutionData = resolutionPayload;
          if (next.arenaHistory?.length > 0) {
            const idx = next.arenaHistory.length - 1;
            const lastEntry = next.arenaHistory[idx]!;
            next.arenaHistory[idx] = { ...lastEntry, pendingResolutionData: resolutionPayload };
          }

          store.loadGame(store.activeSlotId || 'autosave', next);
          set((draft) => {
            draft.isSimulating = false;
          });
        } catch (err) {
          console.error('Worker advancement failed:', err);
          set((draft) => {
            draft.isSimulating = false;
          });
        }
      },

      doAdvanceDay: async (
        processedState?: GameState,
        results?: BoutResult[],
        deaths?: string[],
        injuries?: string[]
      ) => {
        const store = get();
        const raw = processedState || reconstructGameState(store);
        const state = import.meta.env.DEV ? JSON.parse(JSON.stringify(raw)) : raw;
        const cleanState = stripNonSerializable(state) as GameState;
        const currentWeek = cleanState.week;

        set((draft) => {
          draft.isSimulating = true;
        });

        try {
          const next = await engineProxy.advanceDay(cleanState);

          next.phase = 'resolution';
          const resolutionPayload = {
            bouts: results || [],
            deaths: deaths || [],
            injuries: injuries || [],
            promotions: [],
            gazette: next.newsletter.filter((n) => n.week === currentWeek),
          };
          next.pendingResolutionData = resolutionPayload;
          if (next.arenaHistory?.length > 0) {
            const idx = next.arenaHistory.length - 1;
            const lastEntry = next.arenaHistory[idx]!;
            next.arenaHistory[idx] = { ...lastEntry, pendingResolutionData: resolutionPayload };
          }

          store.loadGame(store.activeSlotId || 'autosave', next);
          set((draft) => {
            draft.isSimulating = false;
          });
        } catch (err) {
          console.error('Worker advancement failed:', err);
          set((draft) => {
            draft.isSimulating = false;
          });
        }
      },

      saveCurrentState: async () => {
        const { activeSlotId } = get();
        if (activeSlotId) {
          const state = reconstructGameState(get());
          await opfsArchive.archiveHotState(activeSlotId, state);
          set({ lastSavedAt: new Date().toISOString() });
        }
      },

      doReset: () => {
        // Deterministic reset: If no seed provided, use a stable one for 1.0 stability
        const fresh = createFreshState('alpha-prime-10');
        get().loadGame('autosave', fresh);
        set({ atTitleScreen: true });
      },

      returnToTitle: () => {
        get().saveCurrentState();
        set((draft) => {
          draft.atTitleScreen = true;
          draft.activeSlotId = null;
        });
      },

      setState: (fn: (state: GameStore) => void) => {
        set(fn);
      },
    }))
  )
);

/** --- Fine-Grained Selectors (v4.1: Source from Slice only) --- */
export const useWorldState = () => useGameStore(reconstructGameState, shallow);
export const usePlayer = () => useGameStore((s) => s.player);
export const useRoster = () => useGameStore((s) => s.roster);
export const useRivals = () => useGameStore((s) => s.rivals);
export const useTreasury = () => useGameStore((s) => s.treasury);
export const useWeek = () => useGameStore((s) => s.week);
export const useIsSimulating = () => useGameStore((s) => s.isSimulating);
export const useGame = useGameStore;
