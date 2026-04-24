import { createFreshState } from './src/engine/factories';
import { advanceWeek } from './src/engine/pipeline/services/weekPipelineService';
import { type GameState, type RivalStableData } from './src/types/state.types';
import { FightingStyle } from './src/types/shared.types';
import { setFeatureFlags } from './src/engine/featureFlags';
import * as fs from 'fs';

/**
 * STABLE LORDS: 25-YEAR LONGITUDINAL STRESS TEST
 * 
 * Objectives:
 * 1. Validate long-term economic stability (inflation/deflation).
 * 2. Track class popularity and meta drift.
 * 3. Monitor banzuke health and rank turnover.
 * 4. Verify generational turnover (aging, retirement, legacy).
 * 5. Detect world depopulation or power creep.
 */

async function runStressTest(years: number) {
  const TOTAL_WEEKS = years * 52;
  console.log(`\n🏰 STABLE LORDS: ${years}-YEAR LONGITUDINAL STRESS TEST`);
  console.log(`====================================================`);

  // Optimization: Disable expensive combat narration for headless sim
  setFeatureFlags({ skipCombatNarration: true });
  
  // Initialize state with a fixed seed for determinism
  let state = createFreshState("stress-test-seed-2026-v2");
  
  // Setup: Convert player to a managed Rival
  const playerRecruits = state.recruitPool.slice(0, 3);
  state.recruitPool = state.recruitPool.slice(3);
  
  const playerAsRival: RivalStableData = {
    id: state.player.id,
    owner: { 
        ...state.player, 
        personality: 'Pragmatic' as any,
        metaAdaptation: 'Opportunist' as any
    },
    fame: state.fame,
    treasury: state.treasury,
    roster: playerRecruits.map(r => ({ ...r, status: 'Active' as const })),
    trainers: [],
    ledger: []
  };
  
  state.rivals.push(playerAsRival);
  state.roster = [];
  state.treasury = 0;
  
  console.log(`✅ Player converted to AI: "${state.player.stableName}"`);

  const metrics: any = {
    annual: []
  };

  const startTime = Date.now();

  try {
    for (let w = 1; w <= TOTAL_WEEKS; w++) {
      const weekStart = Date.now();
      
      // Assign training for player warriors so they don't stagnate
      state.trainingAssignments = state.roster.map(warrior => ({
          warriorId: warrior.id,
          type: 'attribute',
          attribute: 'ST'
      }));

      state = advanceWeek(state);
      const weekDuration = Date.now() - weekStart;
      
      if (weekDuration > 500) {
          console.log(`\n⚠️ SLOW WEEK [${w}]: ${weekDuration}ms`);
      }

      if (w % 52 === 0) {
        const year = w / 52;
        const allWarriors = [...state.roster, ...state.rivals.flatMap(r => r.roster)];
        const treasuries = state.rivals.map(r => r.treasury).sort((a, b) => a - b);
        const avgTreasury = treasuries.reduce((a, b) => a + b, 0) / (state.rivals.length || 1);
        const wealthGap = treasuries[treasuries.length - 1] - treasuries[0];

        // Class Popularity
        const classCounts: Record<string, number> = {};
        Object.values(FightingStyle).forEach(s => classCounts[s] = 0);
        allWarriors.forEach(warrior => {
            classCounts[warrior.style] = (classCounts[warrior.style] || 0) + 1;
        });

        // Power Creep (Avg Sum of Attributes)
        const avgAttributeSum = allWarriors.length > 0 
            ? allWarriors.reduce((sum, warrior) => {
                const total = Object.values(warrior.attributes).reduce((a, b) => a + b, 0);
                return sum + total;
            }, 0) / allWarriors.length
            : 0;

        // Prospect Levels (Draft Pool)
        const poolTiers: Record<string, number> = { Common: 0, Promising: 0, Exceptional: 0, Prodigy: 0 };
        state.recruitPool.forEach(p => poolTiers[p.tier]++);

        const yearReport = {
          year,
          demographics: {
            active: allWarriors.length,
            dead: state.graveyard.length,
            retired: state.retired.length,
          },
          economy: {
            avgTreasury,
            wealthGap,
            bankruptRivals: state.rivals.filter(r => r.treasury < 0).length,
          },
          power: {
            avgAttributeSum,
          },
          meta: {
            classPopularity: classCounts,
            drift: { ...state.cachedMetaDrift },
          },
          prospects: poolTiers
        };

        metrics.annual.push(yearReport);
        fs.writeFileSync('./stress_test_report.json', JSON.stringify(metrics, null, 2));

        // --- Optimization: Purge old history ---
        // Clear heavy arrays to prevent state bloat and performance degradation
        state.arenaHistory = state.arenaHistory.slice(-20); // Keep last 20 for meta-drift
        state.matchHistory = [];
        state.newsletter = [];
        state.gazettes = [];
        state.ledger = state.ledger.slice(-100); // Keep last 100 entries
        state.moodHistory = [];
        state.scoutReports = [];
        
        // Clear rival action history to prevent per-stable bloat
        state.rivals = state.rivals.map(r => ({
            ...r,
            actionHistory: [],
            seasonalGrowth: []
        }));

        console.log(`🧹 Yearly Purge [Year ${year}] | Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);

        process.stdout.write(`\r📅 Year ${year}/${years} | Pop: ${allWarriors.length} | Avg T: ${Math.round(avgTreasury)}g | Power: ${avgAttributeSum.toFixed(1)}`);
        
        // Invariants
        if (allWarriors.length < 5) throw new Error("WORLD DEPOPULATED");
        if (state.rivals.length < 3) throw new Error("POLITICAL COLLAPSE: Too many bankruptcies");
      }
    }

    const duration = (Date.now() - startTime) / 1000;
    console.log(`\n\n✅ Simulation Finished in ${duration.toFixed(2)}s`);

    // Final Summary
    console.log('\n--- Final Stability Report ---');
    console.log(`Total Deaths: ${state.graveyard.length}`);
    console.log(`Total Retirements: ${state.retired.length}`);
    console.log(`Final Avg Treasury: ${Math.round(metrics.annual[metrics.annual.length-1].economy.avgTreasury)}g`);
    console.log(`Final Avg Power: ${metrics.annual[metrics.annual.length-1].power.avgAttributeSum.toFixed(1)}`);
    
    // Save report
    fs.writeFileSync('./stress_test_report.json', JSON.stringify(metrics, null, 2));
    console.log('\n📄 Detailed metrics saved to stress_test_report.json');

  } catch (e: any) {
    console.error(`\n\n❌ Simulation Failed: ${e.message}`);
    process.exit(1);
  }
}

runStressTest(25);
