import { type GameState } from "@/types/game";
import { partialRefreshPool } from "@/engine/recruitment";

export const applyRecruitPoolRefresh: (state: GameState) => GameState = (state) => {
  const usedNames = new Set<string>();
  for (const w of state.roster) usedNames.add(w.name);
  for (const w of state.graveyard) usedNames.add(w.name);
  for (const r of state.rivals || []) for (const w of r.roster) usedNames.add(w.name);
  
  return {
    ...state,
    recruitPool: partialRefreshPool(state.recruitPool || [], state.week, usedNames)
  };
};
