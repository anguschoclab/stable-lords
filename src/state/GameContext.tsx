/**
 * React context for Stable Lords game state.
 * Now integrates with multi-slot save system.
 */
import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { GameState, Warrior, FightSummary } from "@/types/game";
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

interface GameContextValue {
  state: GameState;
  /** Whether we're on the title screen (no active game loaded) */
  atTitleScreen: boolean;
  /** ISO timestamp of last auto-save */
  lastSavedAt: string | null;
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
  /** Return to title screen without deleting data */
  returnToTitle: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

// Sentinel value — represents "no game loaded"
const TITLE_SENTINEL = "__TITLE__";

export function GameProvider({ children }: { children: ReactNode }) {
  // Run migration once
  useEffect(() => { migrateLegacySave(); }, []);

  const [activeSlotId, setActiveSlotId] = useState<string | null>(() => getActiveSlot());
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const [state, setStateRaw] = useState<GameState>(() => {
    const slotId = getActiveSlot();
    if (slotId) {
      const loaded = loadFromSlot(slotId);
      if (loaded) return loaded;
    }
    return createFreshState();
  });

  const atTitleScreen = !activeSlotId || !listSaveSlots().some((s) => s.slotId === activeSlotId);

  const markSaved = useCallback(() => setLastSavedAt(new Date().toISOString()), []);

  const setState = useCallback((next: GameState) => {
    setStateRaw(next);
    const slotId = getActiveSlot();
    if (slotId) {
      saveToSlot(slotId, next);
      setActiveSlotId(slotId);
      markSaved();
    }
  }, [markSaved]);

  const doAdvanceWeek = useCallback(() => {
    setStateRaw((prev) => {
      const next = advanceWeek(prev);
      const slotId = getActiveSlot();
      if (slotId) { saveToSlot(slotId, next); markSaved(); }
      return next;
    });
  }, [markSaved]);

  const doAppendFight = useCallback((summary: FightSummary) => {
    setStateRaw((prev) => {
      const next = appendFightToHistory(prev, summary);
      const slotId = getActiveSlot();
      if (slotId) saveToSlot(slotId, next);
      return next;
    });
  }, []);

  const doUpdateWarrior = useCallback(
    (warriorId: string, won: boolean, killed: boolean, fameDelta: number, popDelta: number) => {
      setStateRaw((prev) => {
        const next = updateWarriorAfterFight(prev, warriorId, won, killed, fameDelta, popDelta);
        const slotId = getActiveSlot();
        if (slotId) saveToSlot(slotId, next);
        return next;
      });
    },
    []
  );

  const doReset = useCallback(() => {
    // Return to title screen on reset
    localStorage.removeItem("stablelords.activeSlot");
    setActiveSlotId(null);
    setStateRaw(createFreshState());
  }, []);

  const returnToTitle = useCallback(() => {
    // Save current state first
    const slotId = getActiveSlot();
    if (slotId) {
      setStateRaw((prev) => {
        saveToSlot(slotId, prev);
        return prev;
      });
    }
    localStorage.removeItem("stablelords.activeSlot");
    setActiveSlotId(null);
    setStateRaw(createFreshState());
  }, []);

  return (
    <GameContext.Provider
      value={{ state, atTitleScreen, setState, doAdvanceWeek, doAppendFight, doUpdateWarrior, doReset, returnToTitle }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within <GameProvider>");
  return ctx;
}
