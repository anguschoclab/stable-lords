import { create } from "zustand";
import * as Comlink from "comlink";
import { immer } from "zustand/middleware/immer";
import { subscribeWithSelector } from "zustand/middleware";
import type { FightSummary } from "@/types/combat.types";
import type { GameState, Warrior } from "@/types/state.types";
import { type BoutResult } from "@/engine/boutProcessor";
import { createFreshState } from "@/engine/factories";
import { engineProxy } from "@/engine/workerProxy";
import { hashStr } from "@/utils/idUtils";
import { SeededRNG } from "@/utils/random";
import { opfsArchive } from "@/engine/storage/opfsArchive";

// ─── Slices ────────────────────────────────────────────────────────────────
import { createEconomySlice, EconomySlice } from "./slices/economySlice";
import { createRosterSlice, RosterSlice } from "./slices/rosterSlice";
import { createWorldSlice, WorldSlice } from "./slices/worldSlice";
import { createTournamentSlice, TournamentSlice } from "./slices/tournamentSlice";

export interface GameStoreState {
  atTitleScreen: boolean;
  lastSavedAt: string | null;
  activeSlotId: string | null;
  isSimulating: boolean;
  isInitialized: boolean;
}

export interface GameStoreActions {
  setSimulating: (simulating: boolean) => void;
  doAdvanceWeek: (processedState?: GameState, results?: BoutResult[], deaths?: string[], injuries?: string[]) => Promise<void>;
  doAdvanceDay: (processedState?: GameState, results?: BoutResult[], deaths?: string[], injuries?: string[]) => Promise<void>;
  initialize: () => void;
  loadGame: (slotId: string, gameState: GameState) => void;
  doReset: () => void;
  returnToTitle: () => void;
  saveCurrentState: () => Promise<void>;
  setState: (fn: (state: any) => void) => void;
}

export type GameStore = GameStoreState & GameStoreActions & EconomySlice & RosterSlice & WorldSlice & TournamentSlice;

/**
 * Reconstructs a full GameState from the modular slices for engine consumption.
 */
function reconstructGameState(store: GameStore): GameState {
  const fresh = createFreshState("reconstruct-default");
  return {
    ...fresh,
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
  };
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
          draft.promoters = state.promoters;
          draft.boutOffers = state.boutOffers;
          draft.rivals = state.rivals;
          draft.gazettes = state.gazettes;
          draft.scoutReports = state.scoutReports || [];
          draft.unacknowledgedDeaths = state.unacknowledgedDeaths;
          draft.rosterBonus = state.rosterBonus;
          draft.tournaments = state.tournaments;
          draft.isTournamentWeek = state.isTournamentWeek;
          draft.activeTournamentId = state.activeTournamentId;
          draft.year = state.year || 1;
          
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

      doAdvanceWeek: async (processedState?: GameState, results?: BoutResult[], deaths?: string[], injuries?: string[]) => {
        const store = get();
        const state = processedState || reconstructGameState(store);
        const currentWeek = state.week;

        set((draft) => { draft.isSimulating = true; });

        try {
          let next: GameState;
          if (state.isTournamentWeek) {
            next = state;
            for (let i = state.day; i < 7; i++) {
              next = await engineProxy.advanceDay(next);
            }
          } else {
            next = await engineProxy.advanceWeek(state);
          }
          
          next.phase = "resolution";
          next.pendingResolutionData = {
            bouts: results || [],
            deaths: deaths || [],
            injuries: injuries || [],
            promotions: [],
            gazette: next.newsletter.filter(n => n.week === currentWeek),
          };

          store.loadGame(store.activeSlotId || "autosave", next);
          set((draft) => { draft.isSimulating = false; });
        } catch (err) {
          console.error("Worker advancement failed:", err);
          set((draft) => { draft.isSimulating = false; });
        }
      },

      doAdvanceDay: async (processedState?: GameState, results?: BoutResult[], deaths?: string[], injuries?: string[]) => {
        const store = get();
        const state = processedState || reconstructGameState(store);
        const currentWeek = state.week;
        
        set((draft) => { draft.isSimulating = true; });

        try {
          const next = await engineProxy.advanceDay(state);
          
          next.phase = "resolution";
          next.pendingResolutionData = {
            bouts: results || [],
            deaths: deaths || [],
            injuries: injuries || [],
            promotions: [],
            gazette: next.newsletter.filter(n => n.week === currentWeek),
          };

          store.loadGame(store.activeSlotId || "autosave", next);
          set((draft) => { draft.isSimulating = false; });
        } catch (err) {
          console.error("Worker advancement failed:", err);
          set((draft) => { draft.isSimulating = false; });
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
        const fresh = createFreshState("alpha-prime-10");
        get().loadGame("autosave", fresh);
        set({ atTitleScreen: true });
      },

      returnToTitle: () => {
        get().saveCurrentState();
        set((draft) => {
          draft.atTitleScreen = true;
          draft.activeSlotId = null;
        });
      },

      setState: (fn: (state: any) => void) => {
        set(fn);
      },
    }))
  )
);

/** --- Fine-Grained Selectors (v4.1: Source from Slice only) --- */
export const usePlayer = () => useGameStore(s => s.player);
export const useRoster = () => useGameStore(s => s.roster);
export const useRivals = () => useGameStore(s => s.rivals);
export const useTreasury = () => useGameStore(s => s.treasury);
export const useWeek = () => useGameStore(s => s.week);
export const useIsSimulating = () => useGameStore(s => s.isSimulating);
export const useGame = useGameStore;
