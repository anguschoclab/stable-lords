# Stable Lords — Daily Balance Report
**Simulated Weeks:** 100
**Stop Reason:** max_weeks
**Stop Detail:** Completed 100 weeks.

---

## ⚔️ Lethality & Combat
*Cross-reference with Stable_Lords_Kill_Death_and_Permadeath_Spec_v0.2.md*
- **Total Bouts:** 98
- **Total Deaths:** 10
- **Overall Kill Rate:** 10.20% *(Target: 8% - 15% normal)*
- **Total Injuries:** 34
- **Injury Rate:** 34.69%

---

## 💰 Economy & Ecosystem
- **Player Stable Wealth (Gold):** 18048
- **Total Rival Stables:** 5
- **Average Rival Roster Size:** 8.2

**Stable Tier Distribution:**
- Legendary: 0
- Major: 0
- Established: 0
- Minor: 5

---

## 📈 Meta-Drift (Win Rate Shifting)
*Positive drift indicates the style is dominating the meta. Negative indicates struggling.*

```
LUNGING ATTACK       | Drift: +7
BASHING ATTACK       | Drift: +2
SLASHING ATTACK      | Drift: +1
AIMED BLOW           | Drift: -1
PARRY-LUNGE          | Drift: -1
WALL OF STEEL        | Drift: -1
PARRY-STRIKE         | Drift: -7
STRIKING ATTACK      | Drift: -8
PARRY-RIPOSTE        | Drift: -9
TOTAL PARRY          | Drift: -10
```

---

## 🔍 Oracle Observations & Suggested Tweaks

### 1. Lethality
**Status:** Kill Rate is within target bounds (8% - 15%).

### 2. Economy
**Anomaly:** The Player Stable Wealth exhibits hyper-inflation (18048 gold). There is insufficient gold sink or running costs compared to income.
**Suggested Action:** 
- In `src/engine/economy.ts`, increase `WARRIOR_UPKEEP` (currently `20`) to scale costs with roster size.
- Alternatively, introduce new gold sinks (e.g., baseline stable maintenance fees, healing costs, or equipment degradation).

### 3. Meta-Drift
**Anomaly:** Meta is unbalanced. Dominant: LUNGING ATTACK. Struggling: PARRY-RIPOSTE, PARRY-STRIKE, STRIKING ATTACK, TOTAL PARRY.
**Suggested Action:**
- Review the `MATCHUP_MATRIX` in `src/engine/simulate.ts` for the struggling and dominating styles.
- Alternatively, adjust offensive/defensive multipliers for these styles.

---
*Report generated automatically by the Simulation Oracle.*