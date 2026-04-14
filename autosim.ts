import { createFreshState } from "./src/engine/factories";
import { advanceWeek } from "./src/engine/pipeline/services/weekPipelineService";
import { TickOrchestrator } from "./src/engine/tick/TickOrchestrator";

async function runAutosim(weeks: number) {
  console.log(`🚀 Starting ${weeks}-week stability check...`);
  let state = createFreshState("autosim-seed");
  
  // Seed the player stable with 3 starters to run the sim
  state.roster = state.recruitPool.slice(0, 3).map(r => ({ ...r, status: "Active" }));
  state.recruitPool = state.recruitPool.slice(3);
  
  try {
    for (let i = 1; i <= weeks; i++) {
      // simulate 6 days of daily stepping then 1 week jump
      for (let d = 1; d <= 6; d++) {
        state = TickOrchestrator.advanceDay(state);
      }
      state = advanceWeek(state);
      
      if (i % 10 === 0) {
        console.log(`✅ Week ${i} complete. Roster: ${state.roster.length}, Treasury: ${state.treasury}`);
      }
      
      // Basic invariant checks
      if (state.treasury < -5000) {
          console.warn(`⚠️ Warning: Treasury is very low (${state.treasury}) at week ${i}`);
      }
      if (state.roster.length === 0) {
          throw new Error(`❌ Error: Roster collapsed survival failure at week ${i}`);
      }
    }
    console.log(`✨ Stability check PASSED: Simulated ${weeks} weeks without a crash.`);
  } catch (e: any) {
    console.error(`💥 Stability check FAILED: ${e.message}`);
    if (e.stack) console.error(e.stack);
    process.exit(1);
  }
}

runAutosim(52);
