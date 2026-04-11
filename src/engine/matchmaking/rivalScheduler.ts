import type { GameState, RivalStableData } from "@/types/state.types";

// Import extracted modules
import { collectEligibleAIWarriors, type AIPoolWarrior } from "./aiPoolCollector";
import { reconcileBidsIntoPairings } from "./bidReconciler";
import { simulateAIBouts, type AIBoutResult } from "./aiBoutSimulator";

// Re-export types for backward compatibility
export type { AIPoolWarrior, AIBoutResult };

/**
 * pairAIWarriors: Facade that delegates to bid reconciler.
 * 1. Collect bids from all eligible agents.
 * 2. Reconcile bids into pairings.
 * 3. Skeptically verify acceptance.
 */
export function pairAIWarriors(pool: AIPoolWarrior[], rivals: RivalStableData[], state: GameState, seed?: number): { a: AIPoolWarrior; d: AIPoolWarrior }[] {
  const { boutPairs } = reconcileBidsIntoPairings(pool, rivals, state, seed);
  return boutPairs;
}

/**
 * runAIvsAIBouts: Main orchestrator for AI vs AI bouts.
 * Collects eligible warriors, reconciles bids, simulates bouts.
 */
export function runAIvsAIBouts(state: GameState, seed?: number): { results: AIBoutResult[]; updatedRivals: RivalStableData[]; gazetteItems: string[] } {
  const rivals = [...(state.rivals || [])];
  const pool = collectEligibleAIWarriors(state, rivals);
  const mainSeed = seed ?? (state.week * 9973 + 88);
  const { boutPairs, updatedRivals: rivalsAfterBids } = reconcileBidsIntoPairings(pool, rivals, state, mainSeed + 1);

  return simulateAIBouts(state, boutPairs, rivalsAfterBids, mainSeed + 2);
}
