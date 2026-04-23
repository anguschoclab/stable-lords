import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { runSimulation } from './simulation-harness';

const WEEKS_TO_SIMULATE = 1000;
const CONSTANTS_FILE = path.join(process.cwd(), 'src/engine/combat/mechanics/combatConstants.ts');
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

  // Determine adjustments
  let commitMessage = 'chore(balance): autonomous adjustments\n\nAutobalance Engine Findings:\n';
  let constantsContent = fs.readFileSync(CONSTANTS_FILE, 'utf-8');
  let changed = false;

  // Rule: If mortality rate is above 10%, nerf CRIT_DAMAGE_MULT slightly.
  // If it's below 2%, buff it slightly.
  const critDamageMatch = constantsContent.match(/export const CRIT_DAMAGE_MULT = ([0-9.]+);/);
  if (critDamageMatch) {
    const critDamageMult = parseFloat(critDamageMatch[1]);
    let newCrit = critDamageMult;

    if (mortalityRate > 0.1) {
      newCrit = Math.max(1.1, critDamageMult - 0.1);
      commitMessage += `- Mortality rate is high (${(mortalityRate * 100).toFixed(2)}%). Reducing CRIT_DAMAGE_MULT from ${critDamageMult} to ${newCrit.toFixed(2)}.\n`;
      changed = true;
    } else if (mortalityRate < 0.02) {
      newCrit = Math.min(2.5, critDamageMult + 0.1);
      commitMessage += `- Mortality rate is low (${(mortalityRate * 100).toFixed(2)}%). Increasing CRIT_DAMAGE_MULT from ${critDamageMult} to ${newCrit.toFixed(2)}.\n`;
      changed = true;
    }

    if (changed) {
      constantsContent = constantsContent.replace(
        `export const CRIT_DAMAGE_MULT = ${critDamageMult};`,
        `export const CRIT_DAMAGE_MULT = ${newCrit.toFixed(2)};`
      );
    }
  }

  // Adjust style winrates
  for (const [style, rate] of Object.entries(styleWinRates)) {
    if (rate > 0.65) {
      const enumStyle = style
        .split(/[\s-]/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join('');
      const match = constantsContent.match(
        new RegExp(`\\[FightingStyle\\.${enumStyle}\\]: ([-0-9.]+),`)
      );
      if (match) {
        const currentVal = parseFloat(match[1]);
        const newVal = currentVal - 1; // Nerf by 1
        constantsContent = constantsContent.replace(
          `[FightingStyle.${enumStyle}]: ${currentVal},`,
          `[FightingStyle.${enumStyle}]: ${newVal},`
        );
        commitMessage += `- ${style} winrate is too high (${(rate * 100).toFixed(2)}%). Reduced base bonus from ${currentVal} to ${newVal}.\n`;
        changed = true;
      }
    } else if (rate < 0.35) {
      const enumStyle = style
        .split(/[\s-]/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join('');
      const match = constantsContent.match(
        new RegExp(`\\[FightingStyle\\.${enumStyle}\\]: ([-0-9.]+),`)
      );
      if (match) {
        const currentVal = parseFloat(match[1]);
        const newVal = currentVal + 1; // Buff by 1
        constantsContent = constantsContent.replace(
          `[FightingStyle.${enumStyle}]: ${currentVal},`,
          `[FightingStyle.${enumStyle}]: ${newVal},`
        );
        commitMessage += `- ${style} winrate is too low (${(rate * 100).toFixed(2)}%). Increased base bonus from ${currentVal} to ${newVal}.\n`;
        changed = true;
      }
    }
  }

  // Check economy
  if (avgEconomy < -50000) {
    const ecoFile = path.join(process.cwd(), 'src/data/economyConstants.ts');
    if (fs.existsSync(ecoFile)) {
      let ecoContent = fs.readFileSync(ecoFile, 'utf-8');
      const fightPurseMatch = ecoContent.match(/export const FIGHT_PURSE = ([0-9.]+);/);
      if (fightPurseMatch) {
        const val = parseFloat(fightPurseMatch[1]);
        const newVal = val + 20;
        ecoContent = ecoContent.replace(
          `export const FIGHT_PURSE = ${val};`,
          `export const FIGHT_PURSE = ${newVal};`
        );
        fs.writeFileSync(ecoFile, ecoContent);
        commitMessage += `- Average economy is negative (${avgEconomy.toFixed(0)} gold). Increased FIGHT_PURSE from ${val} to ${newVal}.\n`;
        changed = true;
      }
    }
  } else if (avgEconomy > 50000) {
    const ecoFile = path.join(process.cwd(), 'src/data/economyConstants.ts');
    if (fs.existsSync(ecoFile)) {
      let ecoContent = fs.readFileSync(ecoFile, 'utf-8');
      const fightPurseMatch = ecoContent.match(/export const FIGHT_PURSE = ([0-9.]+);/);
      if (fightPurseMatch) {
        const val = parseFloat(fightPurseMatch[1]);
        const newVal = Math.max(10, val - 20);
        ecoContent = ecoContent.replace(
          `export const FIGHT_PURSE = ${val};`,
          `export const FIGHT_PURSE = ${newVal};`
        );
        fs.writeFileSync(ecoFile, ecoContent);
        commitMessage += `- Average economy is too high (${avgEconomy.toFixed(0)} gold). Decreased FIGHT_PURSE from ${val} to ${newVal}.\n`;
        changed = true;
      }
    }
  }

  if (changed) {
    fs.writeFileSync(CONSTANTS_FILE, constantsContent);
    console.log('\nApplied autonomous balance tweaks.');
    console.log('Commit Message:\n');
    console.log(commitMessage);

    try {
      execSync(
        'git add src/engine/combat/mechanics/combatConstants.ts src/data/economyConstants.ts Daily_Balance_Report.md'
      );
      execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}" || true`);
      console.log('Committed to git successfully.');
    } catch (e: any) {
      console.error('Git commit failed:', e.message);
    }
  } else {
    console.log('\nNo autonomous balance tweaks required. Meta is stable.');
    commitMessage = 'chore(balance): autonomous engine found meta stable.\n\nNo tweaks required.\n';
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

## Adjustments
${changed ? commitMessage : 'None.'}
`;

  fs.writeFileSync(REPORT_FILE, report);
  console.log(`\nWrote Daily_Balance_Report.md`);
}

main().catch(console.error);
