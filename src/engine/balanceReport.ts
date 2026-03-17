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
*Report generated automatically by the Simulation Oracle.*
`.trim();
}
