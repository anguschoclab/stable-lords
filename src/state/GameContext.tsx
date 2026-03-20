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
  doClearResolution: () => void;
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
  const initialize = useGameStore((state) => state.initialize);
  useEffect(() => {
    if (initialize) {
      initialize();
    }
  }, [initialize]);

  const setState = useCallback((next: GameState) => {
    setStateRaw(next);
    const slotId = getActiveSlot();
    if (slotId) {
      saveToSlot(slotId, next);
      setActiveSlotId(slotId);
      markSaved();
    }
  }, [markSaved]);

  const doClearResolution = useCallback(() => {
    setState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        phase: "planning",
        pendingResolutionData: undefined,
      };
    });
  }, []);

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
      if (slotId) { saveToSlot(slotId, next); markSaved(); }
      return next;
    });
  }, [markSaved]);

  const doUpdateWarrior = useCallback(
    (warriorId: string, won: boolean, killed: boolean, fameDelta: number, popDelta: number) => {
      setStateRaw((prev) => {
        const next = updateWarriorAfterFight(prev, warriorId, won, killed, fameDelta, popDelta);
        const slotId = getActiveSlot();
        if (slotId) { saveToSlot(slotId, next); markSaved(); }
        return next;
      });
    },
    [markSaved]
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
      value={{ state, atTitleScreen, lastSavedAt, setState, doAdvanceWeek, doAppendFight, doUpdateWarrior, doReset, returnToTitle }}
    >
      {children}
    </GameContext.Provider>
  );
}

export { useGame };
