import { type GameState } from "@/types/game";
import { processTraining } from "@/engine/training";

export const applyTraining: (state: GameState) => GameState = (state) => {
  return processTraining(state);
};
