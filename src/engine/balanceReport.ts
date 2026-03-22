import type { GameState } from "@/types/game";
import { type AutosimResult } from "@/engine/autosim";
import { computeMetaDrift } from "@/engine/metaDrift";
import { FightingStyle } from "@/types/game";

export function generateBalanceReport(result: AutosimResult): string {
  const { weekSummaries, finalState } = result;

  // 1. Calculate Lethality Metrics
  let totalBouts = 0;
  let totalDeaths = 0;
  let totalInjuries = 0;

  for (const w of weekSummaries) {
    totalBouts += w.bouts;
    totalDeaths += w.deaths;
    totalInjuries += w.injuries;
  }

  const killRate = totalBouts > 0 ? (totalDeaths / totalBouts) * 100 : 0;
  const injuryRate = totalBouts > 0 ? (totalInjuries / totalBouts) * 100 : 0;

  // 2. Calculate Economy / Roster Metrics
  const playerGold = finalState.gold;
  const totalRivals = finalState.rivals.length;
  let totalRivalWarriors = 0;

  const tierCounts: Record<string, number> = {
    "Minor": 0,
    "Established": 0,
    "Major": 0,
    "Legendary": 0
  };

  for (const r of finalState.rivals) {
    totalRivalWarriors += r.roster.length;
    const tier = r.tier || "Minor";
    tierCounts[tier] = (tierCounts[tier] || 0) + 1;
  }

  const avgRivalRosterSize = totalRivals > 0 ? (totalRivalWarriors / totalRivals) : 0;

  // 3. Calculate Meta-Drift
  // computeMetaDrift uses the recent history window (default 20, let's use 100 to capture the whole sim)
  const meta = computeMetaDrift(finalState.arenaHistory, 100);

  const sortedMeta = Object.entries(meta)
    .sort(([, driftA], [, driftB]) => driftB - driftA)
    .map(([style, drift]) => `${style.padEnd(20)} | Drift: ${drift > 0 ? '+' : ''}${drift}`);

  // 4. Generate Oracle Observations & Suggested Tweaks
  const anomalies: string[] = [];

  // Lethality Observations
  anomalies.push("### 1. Lethality");
  if (killRate < 8) {
    anomalies.push(`**Anomaly:** The Overall Kill Rate (${killRate.toFixed(2)}%) is below the target bounds (8% - 15%). Warriors are surviving too often.`);
    anomalies.push("**Suggested Action:** \n- In `src/engine/simulate.ts`, consider increasing `KILL_THRESHOLD_BASE` (currently `0.3`) to `0.4` or `0.5` to widen the base kill window.\n- Alternatively, increase `KILL_DESIRE_SCALING` (currently `0.04`) to make high Kill Desire plans more lethal.");
  } else if (killRate > 15) {
    anomalies.push(`**Anomaly:** The Overall Kill Rate (${killRate.toFixed(2)}%) is above the target bounds (8% - 15%). The game is too lethal.`);
    anomalies.push("**Suggested Action:** \n- In `src/engine/simulate.ts`, consider decreasing `KILL_THRESHOLD_BASE` (currently `0.3`) to reduce the base kill window.\n- Alternatively, decrease `KILL_DESIRE_SCALING` (currently `0.04`).");
  } else {
    anomalies.push(`**Status:** Kill Rate is within target bounds (8% - 15%).`);
  }
  anomalies.push("");

  // Economy Observations
  anomalies.push("### 2. Economy");
  if (playerGold > 10000) {
    anomalies.push(`**Anomaly:** The Player Stable Wealth exhibits hyper-inflation (${playerGold} gold). There is insufficient gold sink or running costs compared to income.`);
    anomalies.push("**Suggested Action:** \n- In `src/engine/economy.ts`, increase `WARRIOR_UPKEEP` (currently `20`) to scale costs with roster size.\n- Alternatively, introduce new gold sinks (e.g., baseline stable maintenance fees, healing costs, or equipment degradation).");
  } else if (playerGold < 1000) {
    anomalies.push(`**Anomaly:** The Player Stable Wealth is very low (${playerGold} gold). The economy might be too punishing.`);
    anomalies.push("**Suggested Action:** \n- Check income sources in `src/engine/economy.ts` (e.g. `FIGHT_PURSE` or `WIN_BONUS`).");
  } else {
    anomalies.push(`**Status:** Player Stable Wealth is relatively stable.`);
  }
  anomalies.push("");

  // Meta-Drift Observations
  anomalies.push("### 3. Meta-Drift");
  const dominantStyles = Object.entries(meta).filter(([, drift]) => drift >= 5).map(([s]) => s);
  const strugglingStyles = Object.entries(meta).filter(([, drift]) => drift <= -5).map(([s]) => s);

  if (dominantStyles.length > 0 || strugglingStyles.length > 0) {
    anomalies.push(`**Anomaly:** Meta is unbalanced. Dominant: ${dominantStyles.length > 0 ? dominantStyles.join(', ') : 'None'}. Struggling: ${strugglingStyles.length > 0 ? strugglingStyles.join(', ') : 'None'}.`);
    anomalies.push(`**Suggested Action:**\n- Review the \`MATCHUP_MATRIX\` in \`src/engine/simulate.ts\` for the struggling and dominating styles.\n- Alternatively, adjust offensive/defensive multipliers for these styles.`);
  } else {
    anomalies.push(`**Status:** Meta drift is healthy. No severely dominant or struggling styles.`);
  }

  // Format the Report
  return `
# Stable Lords — Daily Balance Report
**Simulated Weeks:** ${result.weeksSimmed}
**Stop Reason:** ${result.stopReason}
**Stop Detail:** ${result.stopDetail}

---

## ⚔️ Lethality & Combat
*Cross-reference with Stable_Lords_Kill_Death_and_Permadeath_Spec_v0.2.md*
- **Total Bouts:** ${totalBouts}
- **Total Deaths:** ${totalDeaths}
- **Overall Kill Rate:** ${killRate.toFixed(2)}% *(Target: 8% - 15% normal)*
- **Total Injuries:** ${totalInjuries}
- **Injury Rate:** ${injuryRate.toFixed(2)}%

---

## 💰 Economy & Ecosystem
- **Player Stable Wealth (Gold):** ${playerGold}
- **Total Rival Stables:** ${totalRivals}
- **Average Rival Roster Size:** ${avgRivalRosterSize.toFixed(1)}

**Stable Tier Distribution:**
- Legendary: ${tierCounts["Legendary"]}
- Major: ${tierCounts["Major"]}
- Established: ${tierCounts["Established"]}
- Minor: ${tierCounts["Minor"]}

---

## 📈 Meta-Drift (Win Rate Shifting)
*Positive drift indicates the style is dominating the meta. Negative indicates struggling.*

\`\`\`
${sortedMeta.join("\n")}
\`\`\`

---

## 🔍 Oracle Observations & Suggested Tweaks

${anomalies.join("\n")}

---
*Report generated automatically by the Simulation Oracle.*
`.trim();
}
