import { createFreshState } from "../src/engine/factories";
import { advanceWeek } from "../src/engine/pipeline/services/weekPipelineService";
import { setFeatureFlags } from "../src/engine/featureFlags";
import { FightingStyle } from "../src/types/shared.types";

setFeatureFlags({ skipCombatNarration: true });

const origLog = console.log;
console.log = () => {}; // suppress engine logging

let state = createFreshState("world-health-seed");
state.roster = []; // observe rivals only

const start = Date.now();
const years = 15;

for (let w = 1; w <= years * 52; w++) {
  state = advanceWeek(state);
  // Trim heavy arrays each week to control memory
  if (state.arenaHistory.length > 50) state.arenaHistory = state.arenaHistory.slice(-50);
  if (state.matchHistory.length > 50) state.matchHistory = state.matchHistory.slice(-50);
  state.newsletter = [];
  state.gazettes = [];
  if (state.ledger.length > 100) state.ledger = state.ledger.slice(-100);
  state.moodHistory = [];
  state.scoutReports = [];

  if (w % 52 === 0) {
    const yr = w / 52;
    const allWarriors = state.rivals.flatMap(r => r.roster);
    const styleCounts: Record<string, number> = {};
    allWarriors.forEach(w => styleCounts[w.style] = (styleCounts[w.style] || 0) + 1);
    const avgPwr = allWarriors.length > 0
      ? allWarriors.reduce((s, w) => s + Object.values(w.attributes).reduce((a, b) => a + b, 0), 0) / allWarriors.length
      : 0;
    origLog(`Y${yr} | rivals=${state.rivals.length} active=${allWarriors.length} dead=${state.graveyard.length} ret=${state.retired.length} avgPwr=${avgPwr.toFixed(1)} pool=${state.recruitPool.length} treasury=[${state.rivals.map(r=>r.treasury).sort((a,b)=>a-b).map(t=>t).join(',')}]`);
    origLog(`     style: ${Object.entries(styleCounts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v])=>k.slice(0,6)+':'+v).join(' ')}`);
  }
}
origLog(`\nDONE in ${((Date.now()-start)/1000).toFixed(1)}s`);
