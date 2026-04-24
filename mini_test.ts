import { createFreshState } from './src/engine/factories';
import { advanceWeek } from './src/engine/pipeline/services/weekPipelineService';
import { type GameState, type RivalStableData } from './src/types/state.types';
import { setFeatureFlags } from './src/engine/featureFlags';

async function runMiniTest() {
  console.log("Starting Mini Test (1 Year)...");
  setFeatureFlags({ skipCombatNarration: true });
  let state = createFreshState("mini-test-seed");

  // Move player to rivals
  const playerAsRival: RivalStableData = {
    id: state.player.id,
    owner: { ...state.player, personality: 'Aggressive' as any },
    fame: state.fame,
    treasury: state.treasury,
    roster: state.recruitPool.slice(0, 3).map(r => ({ ...r, status: 'Active' as const })),
    trainers: [],
    ledger: []
  };
  state.rivals.push(playerAsRival);
  state.roster = [];
  state.recruitPool = state.recruitPool.slice(3);

  console.log(`Initial Rivals: ${state.rivals.length}`);
  console.log(`Initial Population: ${state.rivals.reduce((sum, r) => sum + r.roster.length, 0)}`);

  for (let w = 1; w <= 52; w++) {
    state = advanceWeek(state);
    const pop = state.rivals.reduce((sum, r) => sum + r.roster.length, 0);
    const totalPower = state.rivals.reduce((sum, r) => sum + r.roster.reduce((ps, warrior) => ps + Object.values(warrior.attributes).reduce((a, b) => a + b, 0), 0), 0);
    const avgPower = pop > 0 ? totalPower / pop : 0;
    
    if (w % 10 === 0 || w === 1 || w === 52) {
        console.log(`Week ${w} | Pop: ${pop} | Avg Power: ${avgPower.toFixed(2)} | Avg T: ${Math.round(state.rivals.reduce((s, r) => s + r.treasury, 0) / state.rivals.length)}`);
    }
  }
}

runMiniTest();
