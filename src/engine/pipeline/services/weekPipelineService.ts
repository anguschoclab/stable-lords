import type { GameState } from "@/types/state.types";
import type { Warrior } from "@/types/warrior.types";
import { archiveWeekLogs } from "../adapters/opfsArchiver";
import { computeMetaDrift } from "@/engine/metaDrift";
import { SeededRNGService } from "@/engine/core/rng/SeededRNGService";
import { resolveImpacts, StateImpact } from "@/engine/impacts";

// 🌩️ Modular Pipeline Passes
import { runBoutSimulationPass } from "../passes/BoutSimulationPass";
import { runWarriorPass } from "../passes/WarriorPass";
import { runEconomyPass } from "../passes/EconomyPass";
import { runEquipmentPass } from "../passes/EquipmentPass";
import { runWorldPass } from "../passes/WorldPass";
import { runRecruitmentPass } from "../passes/RecruitmentPass";
import { runSystemPass } from "../passes/SystemPass";
import { runRankingsPass } from "../passes/RankingsPass";
import { runPromoterPass } from "../passes/PromoterPass";
import { runPromoterLifecyclePass } from "../passes/PromoterLifecyclePass";
import { runTrainerPass } from "../passes/TrainerPass";
import { runRivalStrategyPass } from "../passes/RivalStrategyPass";
import { runEventPass } from "../passes/EventPass";
import { runNarrativePass } from "../passes/NarrativePass";

/**
 * Stable Lords — Consolidated Weekly Pipeline (1.0 Hardened)
 * Orchestrates the simulation tick using a high-performance batched architecture.
 */
export function advanceWeek(state: GameState): GameState {
  // 1. Preparation & Temporal Logic
  const currentWeek = state.week;
  let nextWeek = currentWeek + 1;
  let nextYear = state.year || 1;

  if (nextWeek > 52) {
    nextWeek = 1;
    nextYear++;
  }

  // Consistent Root RNG for the new week
  const rootRng = new SeededRNGService(nextYear * 52 + nextWeek * 7919 + 101);
  const metaDrift = computeMetaDrift(state.arenaHistory || []);

  // 2. Settlement Phase (The "World Heartbeat")
  // Bouts settle against current state to finalize history/records for the week ending.
  let settledState = runBoutSimulationPass(state, rootRng);
  settledState.cachedMetaDrift = metaDrift;

  // Build and cache warrior map for subsequent AI passes
  const warriorMap = new Map<string, Warrior>();
  settledState.roster.forEach(w => warriorMap.set(w.id, w));
  (settledState.rivals || []).forEach(r => r.roster.forEach(w => warriorMap.set(w.id, w)));
  settledState.warriorMap = warriorMap;

  // 3. Collection Phase (Collect all intended changes)
  const impacts: StateImpact[] = [];

  // Core Simulation Impacts
  impacts.push(runWarriorPass(settledState, rootRng));
  impacts.push(runEconomyPass(settledState, rootRng));
  impacts.push(runEquipmentPass(settledState));

  // ⚡ Early Exit: Bankruptcy Check
  // We check against settledState + economy impact roughly
  const estimatedTreasury = settledState.treasury + (impacts[1]?.treasuryDelta || 0);
  if (estimatedTreasury < -500) {
    // If bankrupt, we still resolve basic impacts then exit
    let finalState = resolveImpacts(settledState, impacts);
    finalState.week = nextWeek;
    finalState.year = nextYear;
    return archiveWeekLogs(finalState);
  }

  // World & System Impacts
  impacts.push(runWorldPass(settledState, rootRng, nextWeek));
  impacts.push(runRecruitmentPass(settledState, rootRng));
  impacts.push(runSystemPass(settledState, rootRng));
  impacts.push(runRankingsPass(settledState));
  impacts.push(runPromoterPass(settledState));
  impacts.push(runPromoterLifecyclePass(settledState, rootRng));
  impacts.push(runTrainerPass(settledState, rootRng));

  // AI & Strategic Impacts
  impacts.push(runRivalStrategyPass(settledState, nextWeek, rootRng));

  // Narrative & Event Impacts
  impacts.push(runEventPass(settledState, nextWeek, rootRng));
  impacts.push(runNarrativePass(settledState, currentWeek, nextWeek, rootRng));

  // 4. Resolution Phase (Apply all impacts in one unified pass)
  let finalizedState = resolveImpacts(settledState, impacts);

  // 5. Finalization
  finalizedState.week = nextWeek;
  finalizedState.year = nextYear;
  finalizedState.day = 0; // Reset daily counter
  finalizedState.trainingAssignments = []; // Reset weekly assignments

  return archiveWeekLogs(finalizedState);
}
