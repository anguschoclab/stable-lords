import { type GameState } from "@/types/game";
import { processAging } from "@/engine/aging";

export const applyAging: (state: GameState) => GameState = (state) => {
  return processAging(state);
};
