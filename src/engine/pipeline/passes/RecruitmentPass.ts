import type { GameState } from "@/types/state.types";
import type { IRNGService } from "@/engine/core/rng/IRNGService";
import { SeededRNGService } from "@/engine/core/rng/SeededRNGService";
import { StateImpact } from "@/engine/impacts";
import { partialRefreshPool } from "@/engine/recruitment";

/**
 * Stable Lords — Recruitment Pipeline Pass
 * Handles the weekly refresh of the recruitment pool.
 */
export const PASS_METADATA = {
  name: "RecruitmentPass",
  dependencies: ["WorldPass"]
};

export function runRecruitmentPass(state: GameState, rootRng?: IRNGService): StateImpact {
  const rng = rootRng || new SeededRNGService(state.week * 701 + 13);
  
  // 1. Refresh recruitment pool
  const usedNames = new Set<string>(state.roster.map(w => w.name));
  const recruitPool = partialRefreshPool(state.recruitPool || [], state.week, usedNames, rng);

  return { recruitPool };
}
