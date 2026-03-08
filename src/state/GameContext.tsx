/**
 * React context for Stable Lords game state.
 */
import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { GameState, Warrior, FightSummary } from "@/types/game";
import {
  loadGameState,
  saveGameState,
  resetGameState,
  advanceWeek,
  appendFightToHistory,
  updateWarriorAfterFight,
} from "./gameStore";

interface GameContextValue {
  state: GameState;
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
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setStateRaw] = useState<GameState>(() => loadGameState());

  const setState = useCallback((next: GameState) => {
    setStateRaw(next);
    saveGameState(next);
  }, []);

  const doAdvanceWeek = useCallback(() => {
    setStateRaw((prev) => {
      const next = advanceWeek(prev);
      saveGameState(next);
      return next;
    });
  }, []);

  const doAppendFight = useCallback((summary: FightSummary) => {
    setStateRaw((prev) => {
      const next = appendFightToHistory(prev, summary);
      saveGameState(next);
      return next;
    });
  }, []);

  const doUpdateWarrior = useCallback(
    (warriorId: string, won: boolean, killed: boolean, fameDelta: number, popDelta: number) => {
      setStateRaw((prev) => {
        const next = updateWarriorAfterFight(prev, warriorId, won, killed, fameDelta, popDelta);
        saveGameState(next);
        return next;
      });
    },
    []
  );

  const doReset = useCallback(() => {
    const fresh = resetGameState();
    setStateRaw(fresh);
  }, []);

  return (
    <GameContext.Provider
      value={{ state, setState, doAdvanceWeek, doAppendFight, doUpdateWarrior, doReset }}
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
