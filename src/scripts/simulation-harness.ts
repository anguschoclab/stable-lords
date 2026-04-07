import { type GameState } from "@/types/game";
import { advanceWeek } from "@/engine/weekPipeline";
import { processWeekBouts } from "@/engine/boutProcessor";
import { populateInitialWorld } from "@/engine/core/worldSeeder";
import { createFreshState } from "@/engine/factories";
import { collectPulse, type SimPulse } from "@/engine/stats/simulationMetrics";

export interface SimulationConfig {
  weeks: number;
  seed: number;
  logFrequency?: number; // Log every N weeks
}

export interface SimulationResult {
  finalState: GameState;
  pulses: SimPulse[];
}

/**
 * Run a headless simulation loop.
 * Synchronous and deterministic.
 */
export function runSimulation(config: SimulationConfig): SimulationResult {
  const { weeks, seed, logFrequency = 1 } = config;
  
  // 1. Initialize State
  const seedStr = seed.toString();
  let state = populateInitialWorld(createFreshState(seedStr), seed);
  const pulses: SimPulse[] = [];

  // 2. Main Loop
  console.log(`[Harness] Starting simulation for ${weeks} weeks...`);
  
  for (let w = 1; w <= weeks; w++) {
    // A. Weekly Decision Logic (AI/Player)
    state.boutOffers = {}; // Clear old offers
    // ... logic for responding to offers if any ...

    // B. Advance Week
    state = advanceWeek(state);
    
    let totalWarriors = 0;
    state.rivals.forEach(r => totalWarriors += r.roster.length);
    
    if (w % logFrequency === 0) {
      console.log(`[Harness] Week ${state.week} | Roster: ${state.roster.length} | Treasury: ${state.treasury}`);
      pulses.push(collectPulse(state));
    }

    // Stop Conditions (Optional)
    if (state.roster.length === 0 && state.treasury < 100) {
      console.warn(`[Sim] Failure at week ${w}: Stable Bankrupt/Empty.`);
      break;
    }
  }

  return {
    finalState: state,
    pulses
  };
}
