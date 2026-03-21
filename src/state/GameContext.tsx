/**
 * React context for Stable Lords game state.
 * Now just re-exports from the zustand store for backward compatibility.
 */
import { useEffect } from "react";
import type { ReactNode } from "react";
import { useGameStore } from "./useGameStore";

export function GameProvider({ children }: { children: ReactNode }) {
  const initialize = useGameStore((s) => s.initialize);
  useEffect(() => {
    if (initialize) {
      initialize();
    }
  }, [initialize]);

  return <>{children}</>;
}

export const useGame = useGameStore;
