import fs from "fs";
import { createFreshState } from "../src/engine/factories";
import { populateInitialWorld } from "../src/engine/core/worldSeeder";
import { runAutosim } from "../src/engine/autosim";
import { computeMetaDrift, getMetaLabel } from "../src/engine/metaDrift";
import { FIGHT_PURSE, WIN_BONUS, WARRIOR_UPKEEP_BASE } from "../src/data/economyConstants";

async function runBenchmark() {
  console.log("Initializing Game State...");
  const rawState = createFreshState("oracle-seed-1");
  const initialState = populateInitialWorld(rawState, 1337);

  // Give ourselves plenty of treasury so we don't bankrupt out early
  initialState.treasury = 50000;

  // Simulation params
  const weeksToSim = 100;

  console.log(`Running Simulation for ${weeksToSim} weeks...`);
  const result = await runAutosim(initialState, weeksToSim, (completed, total) => {
    if (completed % 10 === 0) console.log(`Simulated ${completed}/${total} weeks...`);
  });

  const finalState = result.finalState;

  // 1. Metrics: Economy
  const finalGold = finalState.treasury;
  const avgStableWealth = finalGold;

  // 2. Metrics: Lethality
  const totalBouts = result.weekSummaries.reduce((sum, w) => sum + w.bouts, 0);
  const deaths = result.weekSummaries.reduce((sum, w) => sum + w.deaths, 0);
  const lethalityRate = totalBouts > 0 ? ((deaths / totalBouts) * 100).toFixed(2) : "0.00";

  // 3. Metrics: Meta-Drift
  const metaDrift = computeMetaDrift(finalState.arenaHistory || [], 200);
  let metaDriftString = "";
  for (const [style, drift] of Object.entries(metaDrift)) {
      metaDriftString += `- **${style}**: Drift: ${drift > 0 ? "+" : ""}${drift} (${getMetaLabel(drift)})\n`;
  }

  // 4. Generate Report
  console.log("Generating Report...");
  const report = `# Stable Lords: Daily Balance & Meta Report

## Simulation Details
- **Weeks Simulated**: ${result.weeksSimmed}
- **Stop Reason**: ${result.stopReason}
- **Total Bouts Ran**: ${totalBouts}

## 💰 Economy Report
- **Final Stable Wealth**: ${avgStableWealth} Gold
- **Inflation Check**: ${avgStableWealth > 100000 ? "⚠️ Hyper-inflation detected. Consider more gold sinks." : "✅ Economy looks stable."}
- **Current Constants**:
  - Purse: ${FIGHT_PURSE}g
  - Win Bonus: ${WIN_BONUS}g
  - Base Upkeep: ${WARRIOR_UPKEEP_BASE}g

*Suggestion*: If wealth is inflating, consider increasing \`WARRIOR_UPKEEP_BASE\` (current: ${WARRIOR_UPKEEP_BASE}) or reducing \`FIGHT_PURSE\` (current: ${FIGHT_PURSE}).

## 💀 Lethality & Permadeath
- **Total Fatalities**: ${deaths}
- **Kill Rate**: ${lethalityRate}%
- **Spec Cross-Reference**: According to \`Stable_Lords_Kill_Death_and_Permadeath_Spec_v0.2.md\`, lethality should not cause rapid roster depletion but remain a visible risk.

*Suggestion*: If kill rate > 10%, review \`combat.ts\` logic or adjust endurance/fatigue curves to ensure fights don't cascade into death too frequently.

## ⚔️ Meta-Drift
${metaDriftString}

*Suggestion*: Styles labeled as "Dominant" may need tuning down via anti-synergies or attribute modifiers, whereas "Struggling" styles might need buffs.
`;

  fs.writeFileSync("Daily_Balance_Report.md", report);
  console.log("Report generated at Daily_Balance_Report.md");
}

runBenchmark().catch(err => {
    console.error("Benchmark failed:", err);
    process.exit(1);
});
