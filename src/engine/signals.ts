/**
 * Lightweight event bus for UI signals (toasts, fame bumps, etc.)
 */

export type DMEvent =
  | {
      type: "fight:result";
      payload: {
        winnerSide: "A" | "D" | null;
        by: "Kill" | "KO" | "Exhaustion" | "Stoppage" | "Draw" | null;
        minutes: number;
        tags?: string[];
        fameDeltaA?: number;
        fameDeltaD?: number;
        popDeltaA?: number;
        popDeltaD?: number;
      };
    }
  | { type: "ui:toast"; payload: { title: string; description?: string } };

type Listener = (e: DMEvent) => void;

const listeners = new Set<Listener>();

export function onSignal(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function sendSignal(e: DMEvent): void {
  for (const fn of listeners) fn(e);
}
