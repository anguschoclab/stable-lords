import { type GameState } from '@/types/state.types';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { processWeekBouts } from '@/engine/boutProcessor';
import { populateInitialWorld } from '@/engine/core/worldSeeder';
import { createFreshState } from '@/engine/factories';
import { collectPulse, type SimPulse } from '@/engine/stats/simulationMetrics';
import { resolveImpacts } from '@/engine/impacts';

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

    // Headless: Auto-Respond to Player Contracts
    const playerOffers = Object.values(state.boutOffers || {}).filter(
      (o) =>
        o.status === 'Proposed' && o.warriorIds.some((id) => state.roster.some((w) => w.id === id))
    );

    playerOffers.forEach((offer) => {
      const playerWarriorId = offer.warriorIds.find((id) => state.roster.some((w) => w.id === id));
      if (!playerWarriorId) return;
      if (offer.hype > 100 || offer.purse > 200) {
        state.boutOffers[offer.id].responses[playerWarriorId] = 'Accepted';
        const allResponded = offer.warriorIds.every(
          (wid) => state.boutOffers[offer.id].responses[wid] !== 'Pending'
        );
        if (allResponded) {
          state.boutOffers[offer.id].status = 'Signed';
        }
      }
    });

    // B. Advance Week
    state = advanceWeek(state);

    let totalWarriors = 0;
    state.rivals.forEach((r) => (totalWarriors += r.roster.length));

    if (w % logFrequency === 0) {
      console.log(
        `[Harness] Week ${state.week} | Roster: ${state.roster.length} | Treasury: ${state.treasury}`
      );
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
    pulses,
  };
}
