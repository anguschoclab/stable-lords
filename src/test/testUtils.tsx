import React from "react";
import { render } from "@testing-library/react";

// Provide a default mock for localStorage BEFORE importing game store
const localStorageMock = (function() {
  let store: Record<string, string> = {};
  return {
    getItem: function(key: string) { return store[key] || null; },
    setItem: function(key: string, value: string) { store[key] = value.toString(); },
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    removeItem: function(key: string) { delete store[key]; },
    clear: function() { store = {}; }
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });

// Now import the state modules
import { useGameStore } from "@/state/useGameStore";
import { createFreshState } from "@/engine/factories";
import { TooltipProvider } from "@/components/ui/tooltip";

// A helper to inject a mock state into the Zustand store before rendering
export function renderWithGameState(ui: React.ReactElement, partialState: Partial<ReturnType<typeof createFreshState>> = {}) {
  // Get a clean base state
  const baseState = createFreshState("test-seed");

  // Merge the partial overrides
  const mockState = {
    ...baseState,
    ...partialState,
  };

  // Set the state in the store directly (Zustand is now a flat modular store)
  useGameStore.setState({ 
    ...mockState, 
    atTitleScreen: false,
    isInitialized: true 
  } as any);

  return render(
    <TooltipProvider>
      {ui}
    </TooltipProvider>
  );
}
