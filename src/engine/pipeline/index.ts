import { type GameState } from "@/types/game";

export type PipelineStep = (state: GameState) => GameState;

/**
 * A functional pipeline for state transformations.
 * Ensures strict execution order and immutability.
 */
export function pipe(initialState: GameState, ...steps: PipelineStep[]): GameState {
  return steps.reduce((state, step) => step(state), initialState);
}
