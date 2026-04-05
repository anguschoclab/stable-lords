import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { GameState, FightSummary, Warrior } from "@/types/game";
import { type BoutResult } from "@/engine/boutProcessor";
import {
  createFreshState,
  advanceWeek,
  appendFightToHistory,
  updateWarriorAfterFight,
  initializeStable,
  draftInitialRoster,
  updateWarriorEquipment,
} from "./gameStore";
import { consumeInsightToken } from "./mutations/tokenMutations";
import { InsightTokenService } from "@/engine/tokens/insightTokenService";
import { advanceDay } from "@/engine/dayPipeline";
import {
  migrateLegacySave,
  getActiveSlot,
  loadFromSlot,
  saveToSlot,
  listSaveSlots,
} from "./saveSlots";
import { hashStr } from "@/utils/idUtils";

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
  doAdvanceWeek: (processedState?: GameState, results?: BoutResult[], deaths?: string[], injuries?: string[]) => void;
  doAdvanceDay: (processedState?: GameState, results?: BoutResult[], deaths?: string[], injuries?: string[]) => void;
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
        saveToSlot(slotId, state);
      });
    },

    setSimulating: (simulating: boolean) => {
      set((draft) => {
        draft.isSimulating = simulating;
      });
    },

    setState: (next: GameState | ((prev: GameState) => GameState)) => {
      set((draft) => {
        const nextState = typeof next === "function" ? next(draft.state) : next;
        draft.state = nextState;
        draft.lastSavedAt = new Date().toISOString();
        
        if (draft.activeSlotId) {
          saveToSlot(draft.activeSlotId, nextState);
        }
      });
    },

    doAdvanceWeek: (processedState?: GameState, results?: BoutResult[], deaths?: string[], injuries?: string[]) => {
      set((draft) => {
        let next = processedState || draft.state;
        const currentWeek = next.week;

        if (next.isTournamentWeek) {
          for (let i = next.day; i < 7; i++) {
            next = advanceDay(next);
          }
        } else {
          next = advanceWeek(next);
        }
        
        // Populate resolution data for the summary view
        next.phase = "resolution";
        next.pendingResolutionData = {
          bouts: results || [],
          deaths: deaths || [],
          injuries: injuries || [],
          promotions: [],
          gazette: next.newsletter.filter(n => n.week === currentWeek),
        };

        draft.state = next;
        if (draft.activeSlotId) {
          saveToSlot(draft.activeSlotId, next);
          draft.lastSavedAt = new Date().toISOString();
        }
      });
    },

    doAdvanceDay: (processedState?: GameState, results?: BoutResult[], deaths?: string[], injuries?: string[]) => {
      set((draft) => {
        const baseState = processedState || draft.state;
        const currentWeek = baseState.week;
        
        const next = advanceDay(baseState);
        
        // Populate resolution data for the summary view
        next.phase = "resolution";
        next.pendingResolutionData = {
          bouts: results || [],
          deaths: deaths || [],
          injuries: injuries || [],
          promotions: [],
          gazette: next.newsletter.filter(n => n.week === currentWeek),
        };

        draft.state = next;
        if (draft.activeSlotId) {
          saveToSlot(draft.activeSlotId, next);
          draft.lastSavedAt = new Date().toISOString();
        }
      });
    },

    doAppendFight: (summary: FightSummary) => {
      set((draft) => {
        const next = appendFightToHistory(draft.state, summary);
        draft.state = next;
        if (draft.activeSlotId) {
          saveToSlot(draft.activeSlotId, next);
          draft.lastSavedAt = new Date().toISOString();
        }
      });
    },

    doUpdateWarrior: (warriorId: string, won: boolean, killed: boolean, fameDelta: number, popDelta: number) => {
      set((draft) => {
        const next = updateWarriorAfterFight(draft.state, warriorId, won, killed, fameDelta, popDelta);
        draft.state = next;
        if (draft.activeSlotId) {
          saveToSlot(draft.activeSlotId, next);
          draft.lastSavedAt = new Date().toISOString();
        }
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
        saveToSlot(activeSlotId, state);
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
        if (draft.activeSlotId) saveToSlot(draft.activeSlotId, next);
      });
    },

    doDraftInitialRoster: (warriors: Warrior[]) => {
      set((draft) => {
        const next = draftInitialRoster(draft.state, warriors);
        draft.state = next;
        if (draft.activeSlotId) saveToSlot(draft.activeSlotId, next);
      });
    },

    doUpdateEquipment: (warriorId: string, equipment: { weapon: string; armor: string; shield: string; helm: string }) => {
      set((draft) => {
        const next = updateWarriorEquipment(draft.state, warriorId, equipment);
        draft.state = next;
        if (draft.activeSlotId) saveToSlot(draft.activeSlotId, next);
      });
    },

    doConsumeInsightToken: (tokenId: string, warriorId: string) => {
      set((draft) => {
        // Determinism: Seed RNG with week + warriorId for reproducible results
        let seedValue = draft.state.week * 7 + hashStr(warriorId || tokenId);
        const rng = () => {
          const x = Math.sin(seedValue++) * 10000;
          return x - Math.floor(x);
        };
        
        const next = InsightTokenService.assignToken(draft.state, tokenId, warriorId, rng);
        draft.state = next;
        if (draft.activeSlotId) {
          saveToSlot(draft.activeSlotId, next);
          draft.lastSavedAt = new Date().toISOString();
        }
      });
    },
  }))
);

export const useGame = useGameStore;
