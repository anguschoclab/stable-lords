# Stable Lords — Daily Balance Report
**Simulated Weeks:** 100
**Stop Reason:** max_weeks
**Stop Detail:** Completed 100 weeks.

---

## ⚔️ Lethality & Combat
*Cross-reference with Stable_Lords_Kill_Death_and_Permadeath_Spec_v0.2.md*
- **Total Bouts:** 290
- **Total Deaths:** 0
- **Overall Kill Rate:** 0.00% *(Target: 8% - 15% normal)*
- **Total Injuries:** 81
- **Injury Rate:** 27.93%

---

## 💰 Economy & Ecosystem
- **Player Stable Wealth (Gold):** 40384
- **Total Rival Stables:** 5
- **Average Rival Roster Size:** 9.2

**Stable Tier Distribution:**
- Legendary: 0
- Major: 0
- Established: 0
- Minor: 5

---

## 📈 Meta-Drift (Win Rate Shifting)
*Positive drift indicates the style is dominating the meta. Negative indicates struggling.*

```
PARRY-LUNGE          | Drift: +5
PARRY-RIPOSTE        | Drift: +5
PARRY-STRIKE         | Drift: +4
WALL OF STEEL        | Drift: 0
STRIKING ATTACK      | Drift: -7
AIMED BLOW           | Drift: -9
BASHING ATTACK       | Drift: -10
LUNGING ATTACK       | Drift: -10
SLASHING ATTACK      | Drift: -10
TOTAL PARRY          | Drift: -10
```

---

## 🔍 Oracle Observations & Suggested Tweaks

### 1. Lethality
**Anomaly:** The Overall Kill Rate (2.48%) is below the target bounds (8% - 15%). Warriors are surviving too often.
**Suggested Action:**
- In `src/engine/simulate.ts`, consider increasing `KILL_THRESHOLD_BASE` (currently `0.3`) to `0.4` or `0.5` to widen the base kill window.
- Alternatively, increase `KILL_DESIRE_SCALING` (currently `0.04`) to make high Kill Desire plans more lethal.

### 2. Economy
**Anomaly:** The Player Stable Wealth exhibits hyper-inflation (32002 gold). There is insufficient gold sink or running costs compared to income.
**Suggested Action:**
- In `src/engine/economy.ts`, increase `WARRIOR_UPKEEP` (currently `20`) to scale costs with roster size.
- Alternatively, introduce new gold sinks (e.g., baseline stable maintenance fees, healing costs, or equipment degradation).

### 3. Meta-Drift
**Anomaly:** Meta is unbalanced. Dominant: STRIKING ATTACK, TOTAL PARRY. Struggling: PARRY-LUNGE.
**Suggested Action:**
- Review the `MATCHUP_MATRIX` in `src/engine/simulate.ts` for the struggling and dominating styles.
- Alternatively, adjust offensive/defensive multipliers for these styles.

---
*Report generated automatically by the Simulation Oracle.*