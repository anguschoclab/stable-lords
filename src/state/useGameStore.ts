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
import {
  migrateLegacySave,
  getActiveSlot,
  loadFromSlot,
  saveToSlot,
  listSaveSlots,
} from "./saveSlots";
import { hashStr } from "@/utils/idUtils";
import { SeededRNG } from "@/utils/random";
import { persistenceManager } from "./persistenceManager";

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

const initialData = { state: createFreshState(), activeSlotId: null as string | null };

export const useGameStore = create<GameStoreState & GameStoreActions>()(
  subscribeWithSelector(
    immer((set, get) => ({
      state: initialData.state,
      activeSlotId: initialData.activeSlotId,
      atTitleScreen: true,
      lastSavedAt: null,
      isSimulating: false,
      isInitialized: false,

      initialize: () => {
        migrateLegacySave();
        const slotId = getActiveSlot();
        if (slotId) {
          loadFromSlot(slotId).then((loaded) => {
            set((draft) => {
              if (loaded) {
                draft.state = loaded;
                draft.activeSlotId = slotId;
                draft.atTitleScreen = !listSaveSlots().some((s) => s.slotId === slotId);
              }
              draft.isInitialized = true;
            });
          });
        } else {
          set((draft) => {
            draft.isInitialized = true;
          });
        }
      },

      loadGame: (slotId: string, state: GameState) => {
        set((draft) => {
          draft.state = state;
          draft.activeSlotId = slotId;
          draft.atTitleScreen = false;
          draft.lastSavedAt = new Date().toISOString();
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
          if (draft.activeSlotId) persistenceManager.scheduleSave(draft.activeSlotId, next);
        });
      },

      doUpdateEquipment: (warriorId: string, equipment: { weapon: string; armor: string; shield: string; helm: string }) => {
        set((draft) => {
          const next = updateWarriorEquipment(draft.state, warriorId, equipment);
          draft.state = next;
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

/** --- Fine-Grained Selectors --- */
export const useGameState = () => useGameStore(s => s.state);
export const usePlayer = () => useGameStore(s => s.state.player);
export const useRoster = () => useGameStore(s => s.state.roster);
export const useRivals = () => useGameStore(s => s.state.rivals);
export const useGold = () => useGameStore(s => s.state.gold);
export const useWeek = () => useGameStore(s => s.state.week);
export const useSeason = () => useGameStore(s => s.state.season);
export const useDay = () => useGameStore(s => s.state.day);
export const useFTUE = () => useGameStore(s => s.state.ftueComplete);
export const useIsSimulating = () => useGameStore(s => s.isSimulating);

export const useGame = useGameStore;
