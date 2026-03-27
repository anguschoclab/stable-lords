import { writeFileSync } from "fs";
import { createFreshState, advanceWeek } from "../src/state/gameStore";
import { processWeekBouts } from "../src/engine/boutProcessor";
import { computeMetaDrift } from "../src/engine/metaDrift";
import { FightingStyle } from "../src/types/game";
import { computeWarriorStats } from "../src/engine/skillCalc";

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

async function runBalanceReport() {
  console.log("\nStarting long-term headless simulation for Balance & Meta Report...");
  let state = createFreshState();
  const WEEKS_TO_SIM = 100;

  // Seed the roster so we actually have fights
  const styles = Object.values(FightingStyle);
  for (let i = 0; i < 20; i++) {
    state.roster.push(generateWarriorSim(`player-${i}`, styles[i % styles.length]));
  }

  if (!state.rivals) state.rivals = [];
  for (let r = 0; r < 3; r++) {
    const roster = [];
    for (let i = 0; i < 20; i++) {
      roster.push(generateWarriorSim(`rival-${r}-${i}`, styles[(i + r) % styles.length]));
    }
    state.rivals.push({
      owner: { id: `r-${r}`, name: `Owner ${r}`, stableName: `Rival ${r}`, fame: 0, renown: 0, titles: 0 },
      roster,
      tier: "Established"
    });
  }

  // Track metrics
  let totalBouts = 0;
  let totalKills = 0;
  let totalInjuries = 0;
  const wealthHistory: number[] = [];
  const styleWins: Record<string, number> = {};
  const styleFights: Record<string, number> = {};

  for (let i = 0; i < WEEKS_TO_SIM; i++) {
    // Top up missing roster due to deaths to keep sim going
    while (state.roster.filter(w => w.status === "Active").length < 10) {
       state.roster.push(generateWarriorSim(`player-rep-${i}-${Math.random()}`, styles[Math.floor(Math.random() * styles.length)]));
    }
    for (const rival of state.rivals) {
       while (rival.roster.filter(w => w.status === "Active").length < 10) {
         rival.roster.push(generateWarriorSim(`rival-rep-${i}-${Math.random()}`, styles[Math.floor(Math.random() * styles.length)]));
       }
    }

    const processed = processWeekBouts(state);

    totalBouts += processed.summary.bouts;
    totalKills += processed.summary.deaths;
    totalInjuries += processed.summary.injuries;

    for (const bout of processed.results) {
      if (!bout.outcome) continue;
      const sA = bout.a.style;
      const sD = bout.d.style;
      styleFights[sA] = (styleFights[sA] || 0) + 1;
      styleFights[sD] = (styleFights[sD] || 0) + 1;
      if (bout.outcome.winner === "A") {
        styleWins[sA] = (styleWins[sA] || 0) + 1;
      } else if (bout.outcome.winner === "D") {
        styleWins[sD] = (styleWins[sD] || 0) + 1;
      }
    }

    state = advanceWeek(processed.state);
    wealthHistory.push(state.gold);

    if (i % 10 === 0) {
      console.log(`Week ${i} completed. Bouts so far: ${totalBouts}`);
    }
  }

  console.log("Simulation complete. Generating report...");

  const avgWealth = wealthHistory.reduce((a, b) => a + b, 0) / wealthHistory.length;
  const initialWealth = wealthHistory[0];
  const finalWealth = wealthHistory[wealthHistory.length - 1];

  const meta = computeMetaDrift(state.arenaHistory, Math.min(200, state.arenaHistory.length));

  const killRate = totalBouts > 0 ? ((totalKills / totalBouts) * 100).toFixed(2) : "0.00";
  const injuryRate = totalBouts > 0 ? ((totalInjuries / totalBouts) * 100).toFixed(2) : "0.00";

  const sortedStyles = Object.keys(styleFights).sort((a, b) => {
    const rateA = (styleWins[a] || 0) / styleFights[a];
    const rateB = (styleWins[b] || 0) / styleFights[b];
    return rateB - rateA;
  });

  let report = `# Daily Balance & Meta Report\nGenerated after simulating ${WEEKS_TO_SIM} weeks.\n\n## 1. Economy Metrics\n- **Initial Gold:** ${initialWealth}\n- **Final Gold:** ${finalWealth}\n- **Average Gold (over time):** ${avgWealth.toFixed(2)}\n- *Observation:* ${finalWealth > initialWealth * 2 ? "Potential hyper-inflation detected. Consider adding more gold sinks." : "Economy appears stable."}\n\n## 2. Lethality & Injuries\n- **Total Bouts:** ${totalBouts}\n- **Total Deaths:** ${totalKills} (Kill Rate: ${killRate}%)\n- **Total Injuries:** ${totalInjuries} (Injury Rate: ${injuryRate}%)\n- *Observation:* Check against the \`Stable_Lords_Kill_Death_and_Permadeath_Spec_v0.2.md\`. Are these rates within expected bounds?\n\n## 3. Meta-Drift (AI Adaptation & Style Dominance)\nCurrent Meta Drift Window Analysis:\n`;

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

  report += `\n## 4. Anomalies & Suggestions\n- *Mathematical Anomalies:* `;

  const highWinRates = sortedStyles.filter(s => ((styleWins[s] || 0) / styleFights[s]) > 0.60);
  const lowWinRates = sortedStyles.filter(s => ((styleWins[s] || 0) / styleFights[s]) < 0.40);

  if (highWinRates.length === 0 && lowWinRates.length === 0) {
    report += `None detected. Styles are well balanced.\n`;
  } else {
    if (highWinRates.length > 0) report += `Styles with >60% win rate: ${highWinRates.join(", ")}. `;
    if (lowWinRates.length > 0) report += `Styles with <40% win rate: ${lowWinRates.join(", ")}. `;
    report += `\n`;
  }

  report += `- *Suggested Tweaks:* `;
  if (parseFloat(killRate) > 15) {
    report += `Lethality is high (${killRate}% vs expected 8-15%). Consider reducing \`KILL_THRESHOLD_BASE\` in \`src/engine/combat/resolution.ts\`. `;
  } else if (parseFloat(killRate) < 8) {
    report += `Lethality is low (${killRate}% vs expected 8-15%). Consider increasing \`KILL_THRESHOLD_BASE\` in \`src/engine/combat/resolution.ts\`. `;
  } else {
    report += `Lethality (${killRate}%) is within the target 8-15% bound. `;
  }

  if (finalWealth > initialWealth * 2) {
    report += `Economy is inflating. Consider reducing \`FIGHT_PURSE\` or \`WIN_BONUS\` in \`src/engine/economy.ts\`, or adding more gold sinks.`;
  }

  report += `\n`;

  writeFileSync("Daily_Balance_Report.md", report);
  console.log("Report generated at Daily_Balance_Report.md");
}

runBalanceReport().catch(console.error);
