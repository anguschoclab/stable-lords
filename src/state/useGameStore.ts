import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { GameState, FightSummary } from "@/types/game";
import {
  createFreshState,
  advanceWeek,
  appendFightToHistory,
  updateWarriorAfterFight,
} from "./gameStore";
import {
  migrateLegacySave,
  getActiveSlot,
  loadFromSlot,
  saveToSlot,
  listSaveSlots,
} from "./saveSlots";

export interface GameStoreState {
  state: GameState;
  atTitleScreen: boolean;
  lastSavedAt: string | null;
  activeSlotId: string | null;
}

export interface GameStoreActions {
  setState: (next: GameState) => void;
  doAdvanceWeek: () => void;
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
}

const getInitialData = () => {
  const slotId = getActiveSlot();
  if (slotId) {
    const loaded = loadFromSlot(slotId);
    if (loaded) return { state: loaded, activeSlotId: slotId };
  }
  return { state: createFreshState(), activeSlotId: null };
};

const initialData = getInitialData();

export const useGameStore = create<GameStoreState & GameStoreActions>()(
  immer((set, get) => ({
    state: initialData.state,
    activeSlotId: initialData.activeSlotId,
    atTitleScreen: !initialData.activeSlotId || !listSaveSlots().some((s) => s.slotId === initialData.activeSlotId),
    lastSavedAt: null,

    initialize: () => {
      migrateLegacySave();
      const slotId = getActiveSlot();
      if (slotId) {
        const loaded = loadFromSlot(slotId);
        if (loaded) {
          set((draft) => {
            draft.state = loaded;
            draft.activeSlotId = slotId;
            draft.atTitleScreen = !listSaveSlots().some((s) => s.slotId === slotId);
          });
        }
      }
    },

    loadGame: (slotId: string, state: GameState) => {
      saveToSlot(slotId, state);
      set((draft) => {
        draft.state = state;
        draft.activeSlotId = slotId;
        draft.atTitleScreen = false;
        draft.lastSavedAt = new Date().toISOString();
      });
    },

    setState: (next: GameState) => {
      const { activeSlotId } = get();
      if (activeSlotId) {
        saveToSlot(activeSlotId, next);
      }
      set((draft) => {
        draft.state = next;
        draft.lastSavedAt = new Date().toISOString();
      });
    },

    doAdvanceWeek: () => {
      set((draft) => {
        const next = advanceWeek(draft.state);
        draft.state = next;
        const { activeSlotId } = draft;
        if (activeSlotId) {
          saveToSlot(activeSlotId, next);
          draft.lastSavedAt = new Date().toISOString();
        }
      });
    },

    doAppendFight: (summary: FightSummary) => {
      set((draft) => {
        const next = appendFightToHistory(draft.state, summary);
        draft.state = next;
        const { activeSlotId } = draft;
        if (activeSlotId) {
          saveToSlot(activeSlotId, next);
          draft.lastSavedAt = new Date().toISOString();
        }
      });
    },

    doUpdateWarrior: (warriorId: string, won: boolean, killed: boolean, fameDelta: number, popDelta: number) => {
      set((draft) => {
        const next = updateWarriorAfterFight(draft.state, warriorId, won, killed, fameDelta, popDelta);
        draft.state = next;
        const { activeSlotId } = draft;
        if (activeSlotId) {
          saveToSlot(activeSlotId, next);
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
  }))
);

export const useGame = useGameStore;
