import * as fs from 'fs';
import * as path from 'path';

import { runSimulation } from './simulation-harness';

const WEEKS_TO_SIMULATE = 1000;

const REPORT_FILE = path.join(process.cwd(), 'Daily_Balance_Report.md');

interface MetricStats {
  styleWinRates: Record<string, number>;
  mortalityRate: number;
  avgEconomy: number;
}

async function main() {
  console.log(`Starting Autobalance Simulation for ${WEEKS_TO_SIMULATE} weeks...`);

  const result = runSimulation({
    weeks: WEEKS_TO_SIMULATE,
    seed: 12345, // Deterministic
    logFrequency: 52,
  });

  const { finalState, pulses } = result;

  console.log('Simulation complete. Analyzing data...');

  // Calculate Metrics
  const styleWins: Record<string, number> = {};
  const styleLosses: Record<string, number> = {};

  finalState.arenaHistory.forEach((bout) => {
    const aStyle = bout.styleA || 'Unknown';
    const dStyle = bout.styleD || 'Unknown';

    if (!styleWins[aStyle]) styleWins[aStyle] = 0;
    if (!styleLosses[aStyle]) styleLosses[aStyle] = 0;
    if (!styleWins[dStyle]) styleWins[dStyle] = 0;
    if (!styleLosses[dStyle]) styleLosses[dStyle] = 0;

    if (bout.winner === 'A') {
      styleWins[aStyle]++;
      styleLosses[dStyle]++;
    } else if (bout.winner === 'D') {
      styleWins[dStyle]++;
      styleLosses[aStyle]++;
    }
  });

  const styleWinRates: Record<string, number> = {};
  for (const style in styleWins) {
    const wins = styleWins[style];
    const losses = styleLosses[style];
    const total = wins + losses;
    if (total > 0) {
      styleWinRates[style] = wins / total;
    }
  }

  const deaths = finalState.graveyard.length;
  const bouts = finalState.arenaHistory.length;
  const mortalityRate = bouts > 0 ? deaths / bouts : 0;

  const avgEconomy =
    pulses.length > 0 ? pulses.reduce((sum, p) => sum + p.playerTreasury, 0) / pulses.length : 0;

  console.log('=== Autobalance Engine Metrics ===');
  console.log(`Mortality Rate: ${(mortalityRate * 100).toFixed(2)}%`);
  console.log(`Average Economy: ${avgEconomy.toFixed(0)} gold`);
  console.log(`Win Rates:`);
  for (const [style, rate] of Object.entries(styleWinRates).sort((a, b) => b[1] - a[1])) {
    console.log(`- ${style}: ${(rate * 100).toFixed(2)}%`);
  }


  // Determine adjustments (Suggestions only)
  let recommendations = '';
  let hasAnomalies = false;

  // Rule: If mortality rate is above 15%, suggest nerfing CRIT_DAMAGE_MULT.
  // If it's below 8%, suggest buffing it.
  if (mortalityRate > 0.15) {
    recommendations += `- **Lethality High**: Mortality rate is ${(mortalityRate * 100).toFixed(2)}% (Target: 8% - 15%). Suggest reducing CRIT_DAMAGE_MULT.\n`;
    hasAnomalies = true;
  } else if (mortalityRate < 0.08) {
    recommendations += `- **Lethality Low**: Mortality rate is ${(mortalityRate * 100).toFixed(2)}% (Target: 8% - 15%). Suggest increasing CRIT_DAMAGE_MULT.\n`;
    hasAnomalies = true;
  }

  // Adjust style winrates
  for (const [style, rate] of Object.entries(styleWinRates)) {
    if (rate > 0.65) {
      recommendations += `- **Meta Anomaly**: ${style} win rate is too high (${(rate * 100).toFixed(2)}%). Suggest reducing base bonus.\n`;
      hasAnomalies = true;
    } else if (rate < 0.35) {
      recommendations += `- **Meta Anomaly**: ${style} win rate is too low (${(rate * 100).toFixed(2)}%). Suggest increasing base bonus.\n`;
      hasAnomalies = true;
    }
  }

  // Check economy
  if (avgEconomy < -50000) {
    recommendations += `- **Economy Warning**: Average stable economy is deeply negative (${avgEconomy.toFixed(0)} gold). Suggest increasing FIGHT_PURSE or reducing costs.\n`;
    hasAnomalies = true;
  } else if (avgEconomy > 50000) {
    recommendations += `- **Economy Warning**: Hyper-inflation detected (${avgEconomy.toFixed(0)} gold). Suggest introducing new gold sinks or decreasing FIGHT_PURSE.\n`;
    hasAnomalies = true;
  }

  if (!hasAnomalies) {
    recommendations = '- No mathematical anomalies detected. Meta is stable.';
  }

  // Generate Report
  const report = `# Daily Balance Report

## Simulation Results
- **Weeks Simulated:** ${WEEKS_TO_SIMULATE}
- **Total Bouts:** ${bouts}
- **Total Deaths:** ${deaths}
- **Mortality Rate:** ${(mortalityRate * 100).toFixed(2)}%
- **Average Stable Gold:** ${avgEconomy.toFixed(0)}

## Style Win Rates
${Object.entries(styleWinRates)
  .sort((a, b) => b[1] - a[1])
  .map(([style, rate]) => `- **${style}:** ${(rate * 100).toFixed(2)}%`)
  .join('\n')}

## Suggested Variable Tweaks (For Product Owner Approval)
${recommendations}
`;

  fs.writeFileSync(REPORT_FILE, report);
  console.log(`\nWrote Daily_Balance_Report.md`);
}

main().catch(console.error);