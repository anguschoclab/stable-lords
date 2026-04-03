# Daily Balance & Meta Report
Generated dynamically after autosimming 100 weeks.

## 1. Economy Metrics
- **Initial Gold:** 500
- **Final Gold:** 159889
- **Average Gold:** 66868.79
- *Observation:* Hyper-inflation detected (wealth increased by 319.8x).

## 2. Lethality & Injuries
- **Total Bouts Simulated:** 1699
- **Total Deaths:** 222 (Kill Rate: 13.07%)
- **Total Injuries:** 0 (Injury Rate: 0.00%)
- *Observation:* Kill rate is safely within the target 8-15% bounds.

## 3. Meta-Drift (AI Adaptation & Style Dominance)
- **AIMED BLOW**: +2 drift
- **BASHING ATTACK**: +2 drift
- **LUNGING ATTACK**: +3 drift
- **PARRY-LUNGE**: 0 drift
- **PARRY-RIPOSTE**: -3 drift
- **PARRY-STRIKE**: -2 drift
- **SLASHING ATTACK**: +4 drift
- **STRIKING ATTACK**: +5 drift
- **TOTAL PARRY**: -5 drift
- **WALL OF STEEL**: -4 drift

### Style Win Rates (Overall)
- **AIMED BLOW**: 1 wins / 1 fights (100.00%)
- **BASHING ATTACK**: 10 wins / 13 fights (76.92%)
- **SLASHING ATTACK**: 5 wins / 7 fights (71.43%)
- **LUNGING ATTACK**: 4 wins / 6 fights (66.67%)
- **STRIKING ATTACK**: 3 wins / 5 fights (60.00%)
- **PARRY-LUNGE**: 4 wins / 8 fights (50.00%)
- **PARRY-STRIKE**: 9 wins / 19 fights (47.37%)
- **TOTAL PARRY**: 1 wins / 3 fights (33.33%)
- **WALL OF STEEL**: 4 wins / 13 fights (30.77%)
- **PARRY-RIPOSTE**: 0 wins / 7 fights (0.00%)

## 4. Anomalies & Actionable Suggestions
- **Economy Issue:** High inflation. **Recommendation:** Lower `FIGHT_PURSE` from 75 to 50, and `WIN_BONUS` from 40 to 25 in `src/engine/economy.ts` to curb hyper-inflation.
- **Meta-Drift Issue:** Styles like AIMED BLOW, BASHING ATTACK, SLASHING ATTACK, LUNGING ATTACK are overperforming (>60% win rate). **Recommendation:** Increase base stamina drain for attacks by 10% or reduce their base damage modifier by 5%.
- **Meta-Drift Issue:** Styles like TOTAL PARRY, WALL OF STEEL, PARRY-RIPOSTE are heavily underperforming (<40% win rate). **Recommendation:** Increase riposte chance on successful parries by 10% or lower base fatigue costs for parries.
