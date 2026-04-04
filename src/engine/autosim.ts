import { FightingStyle, type GameState, type Warrior } from "@/types/game";
import { advanceWeek } from "@/state/gameStore";
import { processWeekBouts } from "@/engine/boutProcessor";
import { computeMetaDrift } from "@/engine/metaDrift";
import { computeWarriorStats } from "@/engine/skillCalc";
import { FIGHT_PURSE, WIN_BONUS, WARRIOR_UPKEEP_BASE } from "@/data/economyConstants";
import { KILL_THRESHOLD_BASE } from "@/engine/combat/resolution";

export interface AutosimResult {
  finalState: GameState;
  weeksSimmed: number;
  stopReason: "max_weeks" | "death" | "injury" | "no_pairings";
}

export async function runAutosim(
  initialState: GameState,
  weeksToSim: number,
  onProgress?: (week: number) => void
): Promise<AutosimResult> {
  let state = initialState;
  let weeksSimmed = 0;

  for (let i = 0; i < weeksToSim; i++) {
    state = advanceWeek(state);
    weeksSimmed++;

    if (onProgress) {
        onProgress(weeksSimmed);
    }
  }

  return {
    finalState: state,
    weeksSimmed,
    stopReason: "max_weeks"
  };
}
