/**
 * A lightweight Event Bus to decouple the engine from reporting and narrative side-effects.
 */

import type { GameState } from '@/types/state.types';
import type { FightSummary } from '@/types/combat.types';

export type EngineEvent =
  | { type: 'WEEK_ADVANCED'; payload: { week: number; state: GameState } }
  | { type: 'BOUT_COMPLETED'; payload: { summary: FightSummary; transcript?: string[] } }
  | { type: 'WARRIOR_DEATH'; payload: { warriorId: string; name: string } }
  | { type: 'WARRIOR_TRAINED'; payload: { warriorId: string; message: string; isGain: boolean } }
  | { type: 'RIVALRY_ESCALATED'; payload: { stableA: string; stableB: string; reason: string } }
  | { type: 'SEASON_CHANGED'; payload: { prevSeason: string; newSeason: string; year: number } };

type Handler = (event: EngineEvent) => void;

class EventBus {
  private handlers: Set<Handler> = new Set();

  /**
   * Subscribe to engine events.
   * @param handler - Function to execute on event emit
   * @returns Unsubscribe function
   */
  subscribe(handler: Handler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  /**
   * Emit an event to all subscribers.
   */
  emit(event: EngineEvent): void {
    this.handlers.forEach((handler) => handler(event));
  }

  /**
   * Clear all subscribers (useful for tests or hot-reloading).
   */
  clear(): void {
    this.handlers.clear();
  }
}

export const engineEventBus = new EventBus();
