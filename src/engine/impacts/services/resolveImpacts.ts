import type { GameState } from "@/types/state.types";
import type { StateImpact, ImpactHandler } from "../core/types";
import { impactHandlers } from "../core/handlers";

export function resolveImpacts(state: GameState, impacts: StateImpact[]): GameState {
  const newState = { ...state };
  for (const impact of impacts) {
    (Object.keys(impact) as Array<keyof StateImpact>).forEach(key => {
      const value = impact[key];
      if (value !== undefined) {
        const handler = impactHandlers[key] as ImpactHandler<typeof key>;
        if (handler) {
          handler(newState, value as any);
        }
      }
    });
  }
  return newState;
}
