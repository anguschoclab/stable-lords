import { type GameState } from "@/types/game";
import { migrateGameState, sanitizeReviver } from "./migrations";
import { createFreshState } from "@/engine/factories";

/**
 * Stable Lords — Persistence Layer
 * Manages saving, loading, and resetting the game state.
 */

const SAVE_KEY = "stablelords.save.v2";

export function loadGameState(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw, sanitizeReviver);
      if (parsed && parsed.meta) {
        return migrateGameState(parsed);
      }
    }
  } catch {
    // Corrupt save, fallback to fresh
  }
  const fresh = createFreshState();
  saveGameState(fresh);
  return fresh;
}

export function saveGameState(state: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable
  }
}

export function resetGameState(): GameState {
  localStorage.removeItem(SAVE_KEY);
  const fresh = createFreshState();
  saveGameState(fresh);
  return fresh;
}
