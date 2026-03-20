import React from "react";
import { render } from "@testing-library/react";

// Provide a default mock for localStorage BEFORE importing game store
const localStorageMock = (function() {
  let store: Record<string, string> = {};
  return {
    getItem: function(key: string) { return store[key] || null; },
    setItem: function(key: string, value: string) { store[key] = value.toString(); },
    removeItem: function(key: string) { delete store[key]; },
    clear: function() { store = {}; }
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });

// Now import the state modules
import { GameProvider } from "@/state/GameContext";
import { useGameStore } from "@/state/useGameStore";
import { createFreshState } from "@/state/gameStore";
import { TooltipProvider } from "@/components/ui/tooltip";

// A helper to inject a mock state into the Zustand store before rendering
export function renderWithGameState(ui: React.ReactElement, partialState: Partial<ReturnType<typeof createFreshState>> = {}) {
  // Get a clean base state
  const baseState = createFreshState();

  // Merge the partial overrides
  const mockState = {
    ...baseState,
    ...partialState,
  };

  // Set the state in the store directly
  useGameStore.setState({ state: mockState, atTitleScreen: false });

  return render(
    <TooltipProvider>
      {ui}
    </TooltipProvider>
  );
}
