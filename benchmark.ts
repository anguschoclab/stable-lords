import { performance } from "perf_hooks";

// Generate mock data representing a stable with 10 warriors (up to 100 for other stables)
const generateData = (count: number) => {
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push({
      id: `w-${i}`,
      status: i % 2 === 0 ? "Active" : "Inactive", // 50% active
      name: `Warrior ${i}`
    });
  }
  return data;
};

const runBenchmark = (count: number, iterations = 100000) => {
  const roster = generateData(count);
  console.log(`\nBenchmarking with roster size: ${count}`);

  // Test 1: filter + map
  const startFilterMap = performance.now();
  for (let i = 0; i < iterations; i++) {
    const result = roster
      .filter(w => w.status === "Active")
      .map(w => ({ ...w, mapped: true }));
    // Prevent optimization out
    if (result.length === -1) console.log("unreachable");
  }
  const endFilterMap = performance.now();
  const filterMapTime = endFilterMap - startFilterMap;
  console.log(`filter().map() time: ${filterMapTime.toFixed(2)}ms`);

  // Test 2: reduce
  const startReduce = performance.now();
  for (let i = 0; i < iterations; i++) {
    const result = roster.reduce((acc, w) => {
      if (w.status === "Active") {
        acc.push({ ...w, mapped: true });
      }
      return acc;
    }, [] as any[]);
    // Prevent optimization out
    if (result.length === -1) console.log("unreachable");
  }
  const endReduce = performance.now();
  const reduceTime = endReduce - startReduce;
  console.log(`reduce() time: ${reduceTime.toFixed(2)}ms`);

  const diff = filterMapTime - reduceTime;
  const percent = (diff / filterMapTime) * 100;
  console.log(`Difference: ${diff > 0 ? '+' : ''}${percent.toFixed(2)}% (${diff > 0 ? 'Faster' : 'Slower'})`);
};

// Test sizes
runBenchmark(10);   // Standard single stable size
runBenchmark(100);  // Modest multi-stable game size
runBenchmark(1000); // Massive world size

import { writeFileSync } from "fs";
import { createFreshState, advanceWeek } from "./src/state/gameStore";
import { processWeekBouts } from "./src/engine/boutProcessor";
import { computeMetaDrift } from "./src/engine/metaDrift";
import { FightingStyle } from "./src/types/game";
import { computeWarriorStats } from "./src/engine/skillCalc";
import { FIGHT_PURSE, WIN_BONUS, WARRIOR_UPKEEP_BASE } from "./src/data/economyConstants";
import { KILL_THRESHOLD_BASE } from "./src/engine/combat/resolution";

// Polyfill crypto for node if needed
import crypto from "crypto";
if (typeof globalThis.crypto === "undefined") {
  (globalThis as any).crypto = crypto.webcrypto;
}

// Polyfill localStorage to prevent errors in Zustand/autosim
if (typeof localStorage === "undefined") {
  (globalThis as any).localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateWarriorSim(id: string, style: FightingStyle) {
  const attrs = { ST: 14, CN: 14, SZ: 14, WT: 14, WL: 14, SP: 14, DF: 14 };
  const stats = computeWarriorStats(attrs, style);
  return {
    id,
    name: `W-${id}`,
    style,
    attributes: attrs,
    baseSkills: stats.baseSkills,
    derivedStats: stats.derivedStats,
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: "Active" as const,
    age: 20,
    equipment: { weapon: "shortsword", armor: "leather", shield: "none", helm: "none" }
  };
}

import { writeFileSync } from "fs";
import { createFreshState, advanceWeek } from "./src/state/gameStore";
import { runAutosim, type AutosimResult } from "./src/engine/autosim";
import { computeMetaDrift } from "./src/engine/metaDrift";
import { FightingStyle, type GameState, type Warrior } from "./src/types/game";
import { computeWarriorStats } from "./src/engine/skillCalc";

// Simple UUID alternative without external dependencies for headless testing
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Polyfill crypto for node if needed
import crypto from "crypto";
if (typeof globalThis.crypto === "undefined") {
  (globalThis as any).crypto = crypto.webcrypto;
}

// Polyfill localStorage to prevent errors in Zustand/autosim
if (typeof localStorage === "undefined") {
  (globalThis as any).localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateWarriorSim(style: FightingStyle): Warrior {
  const attrs = {
    ST: randInt(10, 16),
    CN: randInt(10, 16),
    SZ: randInt(10, 16),
    WT: randInt(10, 16),
    WL: randInt(10, 16),
    SP: randInt(10, 16),
    DF: randInt(10, 16)
  };
  const stats = computeWarriorStats(attrs, style);
  const id = generateUUID();
  return {
    id,
    name: `W-${id.substring(0, 4)}`,
    style,
    attributes: attrs,
    baseSkills: stats.baseSkills,
    derivedStats: stats.derivedStats,
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: "Active" as const,
    age: 20,
    equipment: { weapon: "shortsword", armor: "leather", shield: "none", helm: "none" }
  };
}

function topUpRosters(state: GameState) {
  const styles = Object.values(FightingStyle);
  const activeRoster = state.roster.filter(w => w.status === "Active");

  if (activeRoster.length < 15) {
     for (let i = activeRoster.length; i < 20; i++) {
        const warrior = generateWarriorSim(styles[Math.floor(Math.random() * styles.length)]);
        warrior.stableId = "owner_1";
        state.roster.push(warrior);
     }
  }

  if (state.rivals) {
    for (const rival of state.rivals) {
       const activeRivalRoster = rival.roster.filter(w => w.status === "Active");
       if (activeRivalRoster.length < 15) {
         for (let i = activeRivalRoster.length; i < 20; i++) {
           const warrior = generateWarriorSim(styles[Math.floor(Math.random() * styles.length)]);
           warrior.stableId = rival.owner.id;
           rival.roster.push(warrior);
         }
       }
    }
  }
}

async function runDailySimulation() {
  console.log("\nStarting headless AUTOSIM simulation for Balance & Meta Report...");
  let state = createFreshState();
  const WEEKS_TO_SIM = 100;

  // Track continuous metrics
  const wealthHistory: number[] = [state.gold];

  // Initial Roster Seeding
  if (!state.rivals || state.rivals.length === 0) {
     const { generateRivalStables } = await import("./src/engine/rivals");
     state.rivals = generateRivalStables(5, 42);
  }
  topUpRosters(state);

  let totalWeeksSimmed = 0;

  const noopProgress = () => {};

  while (totalWeeksSimmed < WEEKS_TO_SIM) {
    topUpRosters(state);
    const remainingWeeks = WEEKS_TO_SIM - totalWeeksSimmed;

    // Autosim runs until a stop condition is met, or it finishes remainingWeeks.
    const result: AutosimResult = await runAutosim(state, remainingWeeks, noopProgress);

    // Autosim naturally stops on "death", "injury", etc.
    // If it stopped due to "no_pairings", the topUpRosters loop will handle it on the next cycle.
    state = result.finalState;
    totalWeeksSimmed += result.weeksSimmed;

    // If autosim didn't actually simulate any weeks (e.g. stopped on week 0 due to an injury),
    // we must manually advance to prevent an infinite loop.
    if (result.weeksSimmed === 0 && result.stopReason !== "max_weeks") {
       state = advanceWeek(state);
       totalWeeksSimmed += 1;
    }

    wealthHistory.push(state.gold);

    if (totalWeeksSimmed % 10 === 0) {
       console.log(`Simulated ${totalWeeksSimmed} weeks... (Last Stop Reason: ${result.stopReason})`);
    }
  }

  console.log("Autosim complete. Calculating metrics and generating dynamic report...");

  // Calculate Economy
  const initialWealth = wealthHistory[0];
  const finalWealth = state.gold;
  const avgWealth = wealthHistory.reduce((a, b) => a + b, 0) / wealthHistory.length;

  // Calculate Lethality & Meta-Drift from state.arenaHistory
  let totalBouts = 0;
  let totalKills = 0;
  let totalInjuries = 0;

  const styleWins: Record<string, number> = {};
  const styleFights: Record<string, number> = {};

  for (const f of state.arenaHistory) {
      totalBouts++;
      if (f.by === "Kill" || f.isDeathEvent) totalKills++;
      // Basic approximation for injuries since full history doesn't strictly track all injury severities in a simple boolean flag
      if (f.injurySeverity && f.injurySeverity !== "None") totalInjuries++;

      const wA = state.roster.find(w => w.name === f.a) || state.graveyard.find(w => w.name === f.a) || (state.rivals || []).flatMap(r => r.roster).find(w => w.name === f.a);
      const wD = state.roster.find(w => w.name === f.d) || state.graveyard.find(w => w.name === f.d) || (state.rivals || []).flatMap(r => r.roster).find(w => w.name === f.d);

      const sA = wA ? wA.style : "Unknown";
      const sD = wD ? wD.style : "Unknown";

      if (sA !== "Unknown" && sD !== "Unknown") {
         styleFights[sA] = (styleFights[sA] || 0) + 1;
         styleFights[sD] = (styleFights[sD] || 0) + 1;

         if (f.winner === "A") styleWins[sA] = (styleWins[sA] || 0) + 1;
         if (f.winner === "D") styleWins[sD] = (styleWins[sD] || 0) + 1;
      }
  }

  const meta = computeMetaDrift(state.arenaHistory, Math.min(200, state.arenaHistory.length));

  const killRateNum = totalBouts > 0 ? (totalKills / totalBouts) * 100 : 0;
  const injuryRateNum = totalBouts > 0 ? (totalInjuries / totalBouts) * 100 : 0;

  const killRate = killRateNum.toFixed(2);
  const injuryRate = injuryRateNum.toFixed(2);

  const sortedStyles = Object.keys(styleFights).sort((a, b) => {
    const rateA = (styleWins[a] || 0) / styleFights[a];
    const rateB = (styleWins[b] || 0) / styleFights[b];
    return rateB - rateA;
  });

  const highWinRates = sortedStyles.filter(s => ((styleWins[s] || 0) / styleFights[s]) > 0.60);
  const lowWinRates = sortedStyles.filter(s => ((styleWins[s] || 0) / styleFights[s]) < 0.40);

  // Dynamic String Generation
  let report = `# Daily Balance & Meta Report\nGenerated dynamically after autosimming ${WEEKS_TO_SIM} weeks.\n\n`;

  report += `## 1. Economy Metrics\n`;
  report += `- **Initial Gold:** ${initialWealth}\n`;
  report += `- **Final Gold:** ${finalWealth}\n`;
  report += `- **Average Gold:** ${avgWealth.toFixed(2)}\n`;

  const inflationRatio = finalWealth / (initialWealth || 1);
  if (inflationRatio > 2.0) {
    report += `- *Observation:* Hyper-inflation detected (wealth increased by ${(inflationRatio).toFixed(1)}x).\n`;
  } else if (inflationRatio < 0.5) {
    report += `- *Observation:* Deflation / poverty detected (wealth decreased by ${(1/inflationRatio).toFixed(1)}x).\n`;
  } else {
    report += `- *Observation:* Economy appears balanced.\n`;
  }

  report += `\n## 2. Lethality & Injuries\n`;
  report += `- **Total Bouts Simulated:** ${totalBouts}\n`;
  report += `- **Total Deaths:** ${totalKills} (Kill Rate: ${killRate}%)\n`;
  report += `- **Total Injuries:** ${totalInjuries} (Injury Rate: ${injuryRate}%)\n`;
  report += `- *Observation:* `;
  if (killRateNum < 8.0) {
     report += `Kill rate is below the 8% target bound.\n`;
  } else if (killRateNum > 15.0) {
     report += `Kill rate is above the 15% target bound.\n`;
  } else {
     report += `Kill rate is safely within the target 8-15% bounds.\n`;
  }

  report += `\n## 3. Meta-Drift (AI Adaptation & Style Dominance)\n`;
  for (const [style, drift] of Object.entries(meta)) {
    report += `- **${style}**: ${drift > 0 ? '+' : ''}${drift} drift\n`;
  }

  report += `\n### Style Win Rates (Overall)\n`;
  for (const style of sortedStyles) {
    const wins = styleWins[style] || 0;
    const fights = styleFights[style];
    const rate = ((wins / fights) * 100).toFixed(2);
    report += `- **${style}**: ${wins} wins / ${fights} fights (${rate}%)\n`;
  }

  report += `\n## 4. Anomalies & Actionable Suggestions\n`;

  let needsChanges = false;

  if (inflationRatio > 2.0) {
    needsChanges = true;
    report += `- **Economy Issue:** High inflation. **Recommendation:** Lower \`FIGHT_PURSE\` from ${FIGHT_PURSE} to ${Math.max(10, FIGHT_PURSE - 25)}, and \`WIN_BONUS\` from ${WIN_BONUS} to ${Math.max(10, WIN_BONUS - 15)} in \`src/data/economyConstants.ts\` to curb hyper-inflation.\n`;
  } else if (inflationRatio < 0.5) {
    needsChanges = true;
    report += `- **Economy Issue:** Negative economy balance. **Recommendation:** Increase \`FIGHT_PURSE\` from ${FIGHT_PURSE} to ${FIGHT_PURSE + 25} or lower \`WARRIOR_UPKEEP_BASE\` from ${WARRIOR_UPKEEP_BASE} to ${Math.max(0, WARRIOR_UPKEEP_BASE - 10)} in \`src/data/economyConstants.ts\` to prevent early bankruptcies.\n`;
  }

  if (killRateNum < 8.0) {
    needsChanges = true;
    report += `- **Lethality Issue:** Kill rate (${killRate}%) is lower than the 8-15% target. **Recommendation:** Increase \`KILL_THRESHOLD_BASE\` from ${KILL_THRESHOLD_BASE} to ${(KILL_THRESHOLD_BASE + 0.05).toFixed(2)} in \`src/engine/combat/resolution.ts\` to make kills more frequent.\n`;
  } else if (killRateNum > 15.0) {
    needsChanges = true;
    report += `- **Lethality Issue:** Kill rate (${killRate}%) exceeds the 8-15% target. **Recommendation:** Decrease \`KILL_THRESHOLD_BASE\` from ${KILL_THRESHOLD_BASE} to ${Math.max(0, KILL_THRESHOLD_BASE - 0.05).toFixed(2)} in \`src/engine/combat/resolution.ts\` to reduce lethality.\n`;
  }

  if (highWinRates.length > 0) {
    needsChanges = true;
    report += `- **Meta-Drift Issue:** Styles like ${highWinRates.join(", ")} are overperforming (>60% win rate). **Recommendation:** Increase base stamina drain for attacks by 10% or reduce their base damage modifier by 5%.\n`;
  }

  if (lowWinRates.length > 0) {
    needsChanges = true;
    report += `- **Meta-Drift Issue:** Styles like ${lowWinRates.join(", ")} are heavily underperforming (<40% win rate). **Recommendation:** Increase riposte chance on successful parries by 10% or lower base fatigue costs for parries.\n`;
  }

  if (!needsChanges) {
    report += `- **System Stable:** The autosim run detected no major economic, lethality, or meta-drift anomalies. Current engine math appears robust.\n`;
  }

  writeFileSync("Daily_Balance_Report.md", report);
  console.log("Dynamic report generated at Daily_Balance_Report.md");
}

runDailySimulation().catch(console.error);
