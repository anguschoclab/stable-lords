import { GameState } from "@/types/game";
import type { StateImpact } from "../index";
import { impactHandlers } from "../core/impactHandlers";

export function resolveImpacts(state: GameState, impacts: StateImpact[]): GameState {
  const newState = { ...state };
  for (const impact of impacts) {
    for (const key of Object.keys(impact) as Array<keyof StateImpact>) {
      if (impact[key] !== undefined && impactHandlers[key]) impactHandlers[key](newState, impact[key]);
    }
  }
  return newState;
}
