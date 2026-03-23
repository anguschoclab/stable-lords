import { type GameState } from "@/types/game";
import { processEconomy } from "@/engine/economy";

export const applyEconomy: (state: GameState) => GameState = (state) => {
  return processEconomy(state);
};
