/**
 * Death Notifier — central fan-out for WARRIOR_DEATH events.
 *
 * The mortalityHandler writes canonical state (graveyard entry, newsletter
 * obituary, rival roster removal) as a pure StateImpact. Everything *else*
 * that should happen when a warrior dies — chronicle line, gazette hook,
 * hall-of-fame mint trigger, stable-morale ripples — subscribes here so
 * those side-effects can be composed independently.
 *
 * This module is intentionally UI/presentation-layer friendly: callers can
 * attach handlers once at boot and tear them down in tests via `clearDeathHandlers`.
 */
import { engineEventBus, type EngineEvent } from '@/engine/core/EventBus';
import { logger } from '@/utils/logger';

export interface DeathNotification {
  warriorId: string;
  name: string;
}

export type DeathHandler = (n: DeathNotification) => void;

const handlers: Set<DeathHandler> = new Set();
let busSubscription: (() => void) | null = null;

function ensureSubscribed(): void {
  if (busSubscription) return;
  busSubscription = engineEventBus.subscribe((event: EngineEvent) => {
    if (event.type !== 'WARRIOR_DEATH') return;
    const payload: DeathNotification = {
      warriorId: event.payload.warriorId,
      name: event.payload.name,
    };
    handlers.forEach((h) => {
      try {
        h(payload);
      } catch (err) {
        // Handlers are side-effect sinks (UI toasts, chronicle writers, etc.) —
        // a failing handler must not block the others from firing.
        logger.error('[deathNotifier] handler threw:', err);
      }
    });
  });
}

/** Attach a handler. Returns an unsubscribe function. */
export function onWarriorDeath(h: DeathHandler): () => void {
  ensureSubscribed();
  handlers.add(h);
  return () => handlers.delete(h);
}

/** Test utility — strips all handlers and detaches from the bus. */
export function clearDeathHandlers(): void {
  handlers.clear();
  if (busSubscription) {
    busSubscription();
    busSubscription = null;
  }
}
