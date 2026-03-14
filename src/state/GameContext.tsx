// Legacy file, bridging to Zustand to minimize required changes across the app
import React, { useEffect, type ReactNode } from "react";
import { useGameStore, useGame } from "./useGameStore";

export function GameProvider({ children }: { children: ReactNode }) {
  const initialize = useGameStore((state) => state.initialize);
  useEffect(() => {
    initialize();
  }, [initialize]);

  return <>{children}</>;
}

export { useGame };
