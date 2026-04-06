import { create } from "zustand";
import * as Comlink from "comlink";
import { immer } from "zustand/middleware/immer";
import { subscribeWithSelector } from "zustand/middleware";
import type { GameState, FightSummary, Warrior } from "@/types/game";
import { type BoutResult } from "@/engine/boutProcessor";
import {
  createFreshState,
  advanceWeek as _advanceWeek,
  appendFightToHistory,
  updateWarriorAfterFight,
  initializeStable,
  draftInitialRoster,
  updateWarriorEquipment,
} from "./gameStore";
import { consumeInsightToken } from "./mutations/tokenMutations";
import { engineProxy } from "@/engine/workerProxy";
import { hashStr } from "@/utils/idUtils";
import { SeededRNG } from "@/utils/random";
import { persistenceManager } from "./persistenceManager";
import { opfsArchive } from "@/engine/storage/opfsArchive";

// ─── Slices ────────────────────────────────────────────────────────────────
import { createEconomySlice, EconomySlice } from "./slices/economySlice";
import { createRosterSlice, RosterSlice } from "./slices/rosterSlice";
import { createWorldSlice, WorldSlice } from "./slices/worldSlice";

export interface GameStoreState {
  state: GameState;
  atTitleScreen: boolean;
  lastSavedAt: string | null;
  activeSlotId: string | null;
  isSimulating: boolean;
  isInitialized: boolean;
}

export interface GameStoreActions {
  setState: (next: GameState | ((prev: GameState) => GameState)) => void;
  setSimulating: (simulating: boolean) => void;
  doAdvanceWeek: (processedState?: GameState, results?: BoutResult[], deaths?: string[], injuries?: string[]) => Promise<void>;
  doAdvanceDay: (processedState?: GameState, results?: BoutResult[], deaths?: string[], injuries?: string[]) => Promise<void>;
  doAppendFight: (summary: FightSummary) => void;
  doUpdateWarrior: (
    warriorId: string,
    won: boolean,
    killed: boolean,
    fameDelta: number,
    popDelta: number
  ) => void;
  doReset: () => void;
  returnToTitle: () => void;
  initialize: () => void;
  loadGame: (slotId: string, gameState: GameState) => void;
  doInitializeStable: (name: string, stableName: string) => void;
  doDraftInitialRoster: (warriors: Warrior[]) => void;
  doUpdateEquipment: (warriorId: string, equipment: { weapon: string; armor: string; shield: string; helm: string }) => void;
  doConsumeInsightToken: (tokenId: string, warriorId: string) => void;
}

export type GameStore = GameStoreState & GameStoreActions & EconomySlice & RosterSlice & WorldSlice;

export const useGameStore = create<GameStore>()(
  subscribeWithSelector(
    immer((set, get, ...args) => ({
      // ─── Sub-Slices ───
      ...createEconomySlice(set, get, ...args),
      ...createRosterSlice(set, get, ...args),
      ...createWorldSlice(set, get, ...args),

      // ─── Core State ───
      state: createFreshState(),
      activeSlotId: null,
      atTitleScreen: true,
      lastSavedAt: null,
      isSimulating: false,
      isInitialized: false,

      initialize: () => {
        // v4.1: Legacy migrations terminated. Pure OPFS load.
        // In a real app we'd list files in OPFS here if we wanted to auto-load last.
        set((draft) => {
          draft.isInitialized = true;
        });
      },

      loadGame: (slotId: string, state: GameState) => {
        set((draft) => {
          draft.state = state;
          draft.activeSlotId = slotId;
          draft.atTitleScreen = false;
          draft.lastSavedAt = new Date().toISOString();
          
          // Sync slice properties for components using legacy selectors
          // (Note: In a pure slice architecture, we'd avoid this duplication, 
          // but for v4.1 transition we keep 'state' as the source for sub-systems)
          draft.treasury = state.treasury;
          draft.roster = state.roster;
          draft.week = state.week;
        });
        persistenceManager.saveNow(slotId, state);
      },

      setSimulating: (simulating: boolean) => {
        set((draft) => {
          draft.isSimulating = simulating;
        });
      },

      setState: (next: GameState | ((prev: GameState) => GameState)) => {
        const { state, activeSlotId } = get();
        const nextState = typeof next === "function" ? next(state) : next;
        
        set((draft) => {
          draft.state = nextState;
          draft.lastSavedAt = new Date().toISOString();
          // Sync slice state
          draft.treasury = nextState.treasury;
          draft.roster = nextState.roster;
          draft.week = nextState.week;
        });
        
        if (activeSlotId) {
          persistenceManager.scheduleSave(activeSlotId, nextState);
        }
      },

      doAdvanceWeek: async (processedState?: GameState, results?: BoutResult[], deaths?: string[], injuries?: string[]) => {
        const { state, activeSlotId } = get();
        let next = processedState || state;
        const currentWeek = next.week;

        set((draft) => { draft.isSimulating = true; });

        try {
          if (next.isTournamentWeek) {
            for (let i = next.day; i < 7; i++) {
              next = await engineProxy.advanceDay(next);
            }
          } else {
            next = await engineProxy.advanceWeek(next);
          }
          
          next.phase = "resolution";
          next.pendingResolutionData = {
            bouts: results || [],
            deaths: deaths || [],
            injuries: injuries || [],
            promotions: [],
            gazette: next.newsletter.filter(n => n.week === currentWeek),
          };

          set((draft) => {
            draft.state = next;
            draft.isSimulating = false;
            draft.lastSavedAt = new Date().toISOString();
            draft.treasury = next.treasury;
            draft.roster = next.roster;
            draft.week = next.week;
          });
          
          if (activeSlotId) {
            persistenceManager.scheduleSave(activeSlotId, next);
          }
        } catch (err) {
          console.error("Worker advancement failed:", err);
          set((draft) => { draft.isSimulating = false; });
        }
      },

      doAdvanceDay: async (processedState?: GameState, results?: BoutResult[], deaths?: string[], injuries?: string[]) => {
        const { state, activeSlotId } = get();
        const baseState = processedState || state;
        const currentWeek = baseState.week;
        
        set((draft) => { draft.isSimulating = true; });

        try {
          const next = await engineProxy.advanceDay(baseState);
          
          next.phase = "resolution";
          next.pendingResolutionData = {
            bouts: results || [],
            deaths: deaths || [],
            injuries: injuries || [],
            promotions: [],
            gazette: next.newsletter.filter(n => n.week === currentWeek),
          };

          set((draft) => {
            draft.state = next;
            draft.isSimulating = false;
            draft.lastSavedAt = new Date().toISOString();
            draft.treasury = next.treasury;
            draft.roster = next.roster;
            draft.week = next.week;
          });
          
          if (activeSlotId) {
            persistenceManager.scheduleSave(activeSlotId, next);
          }
        } catch (err) {
          console.error("Worker advancement failed:", err);
          set((draft) => { draft.isSimulating = false; });
        }
      },

      doAppendFight: (summary: FightSummary) => {
        set((draft) => {
          const next = appendFightToHistory(draft.state, summary);
          draft.state = next;
          draft.lastSavedAt = new Date().toISOString();
          if (draft.activeSlotId) persistenceManager.scheduleSave(draft.activeSlotId, next);
        });
      },

      doUpdateWarrior: (warriorId: string, won: boolean, killed: boolean, fameDelta: number, popDelta: number) => {
        set((draft) => {
          const next = updateWarriorAfterFight(draft.state, warriorId, won, killed, fameDelta, popDelta);
          draft.state = next;
          draft.lastSavedAt = new Date().toISOString();
          if (draft.activeSlotId) persistenceManager.scheduleSave(draft.activeSlotId, next);
        });
      },

      doReset: () => {
        localStorage.removeItem("stablelords.activeSlot");
        set((draft) => {
          draft.activeSlotId = null;
          draft.state = createFreshState();
          draft.atTitleScreen = true;
          // Reset slices
          draft.treasury = draft.state.treasury;
          draft.roster = draft.state.roster;
        });
      },

      returnToTitle: () => {
        const { activeSlotId, state } = get();
        if (activeSlotId) {
          persistenceManager.saveNow(activeSlotId, state);
        }
        localStorage.removeItem("stablelords.activeSlot");
        set((draft) => {
          draft.activeSlotId = null;
          draft.state = createFreshState();
          draft.atTitleScreen = true;
        });
      },

      doInitializeStable: (name: string, stableName: string) => {
        set((draft) => {
          const next = initializeStable(draft.state, name, stableName);
          draft.state = next;
          if (draft.activeSlotId) persistenceManager.scheduleSave(draft.activeSlotId, next);
        });
      },

      doDraftInitialRoster: (warriors: Warrior[]) => {
        set((draft) => {
          const next = draftInitialRoster(draft.state, warriors);
          draft.state = next;
          draft.roster = next.roster;
          if (draft.activeSlotId) persistenceManager.scheduleSave(draft.activeSlotId, next);
        });
      },

      doUpdateEquipment: (warriorId: string, equipment: { weapon: string; armor: string; shield: string; helm: string }) => {
        set((draft) => {
          const next = updateWarriorEquipment(draft.state, warriorId, equipment);
          draft.state = next;
          draft.roster = next.roster;
          if (draft.activeSlotId) persistenceManager.scheduleSave(draft.activeSlotId, next);
        });
      },

      doConsumeInsightToken: async (tokenId: string, warriorId: string) => {
        const { state, activeSlotId } = get();
        const seedValue = state.week * 7 + hashStr(warriorId || tokenId);
        const rng = new SeededRNG(seedValue);
        const next = await engineProxy.assignToken(state, tokenId, warriorId, Comlink.proxy(() => rng.next()));
        
        set((draft) => {
          draft.state = next;
          draft.lastSavedAt = new Date().toISOString();
          if (draft.activeSlotId) persistenceManager.scheduleSave(draft.activeSlotId, next);
        });
      },
    }))
  )
);

/** --- Fine-Grained Selectors (v4.1: Source from Slice or State depending on maturity) --- */
export const useGameState = () => useGameStore(s => s.state);
export const usePlayer = () => useGameStore(s => s.state.player);
export const useRoster = () => useGameStore(s => s.roster); // Sourced from slice
export const useRivals = () => useGameStore(s => s.rivals); // Sourced from slice
export const useTreasury = () => useGameStore(s => s.treasury); // Sourced from slice
export const useWeek = () => useGameStore(s => s.week); // Sourced from slice
export const useSeason = () => useGameStore(s => s.season);
export const useDay = () => useGameStore(s => s.day);
export const useFTUE = () => useGameStore(s => s.state.ftueComplete);
export const useIsSimulating = () => useGameStore(s => s.isSimulating);

export const useGame = useGameStore;
