# Daily Balance & Meta Report
Generated dynamically after autosimming 100 weeks.

## 1. Economy Metrics
- **Initial Gold:** 500
- **Final Gold:** 6005
- **Average Gold:** 3315.18
- *Observation:* Hyper-inflation detected (wealth increased by 12.0x).

## 2. Lethality & Injuries
- **Total Bouts Simulated:** 1752
- **Total Deaths:** 188 (Kill Rate: 10.73%)
- **Total Injuries:** 0 (Injury Rate: 0.00%)
- *Observation:* Kill rate is safely within the target 8-15% bounds.

## 3. Meta-Drift (AI Adaptation & Style Dominance)
- **AIMED BLOW**: -1 drift
- **BASHING ATTACK**: +5 drift
- **LUNGING ATTACK**: +7 drift
- **PARRY-LUNGE**: -1 drift
- **PARRY-RIPOSTE**: -4 drift
- **PARRY-STRIKE**: +2 drift
- **SLASHING ATTACK**: +7 drift
- **STRIKING ATTACK**: +3 drift
- **TOTAL PARRY**: -9 drift
- **WALL OF STEEL**: -3 drift

### Style Win Rates (Overall)
- **SLASHING ATTACK**: 55 wins / 78 fights (70.51%)
- **LUNGING ATTACK**: 9 wins / 14 fights (64.29%)
- **STRIKING ATTACK**: 52 wins / 84 fights (61.90%)
- **PARRY-LUNGE**: 28 wins / 52 fights (53.85%)
- **AIMED BLOW**: 44 wins / 93 fights (47.31%)
- **BASHING ATTACK**: 15 wins / 32 fights (46.88%)
- **PARRY-RIPOSTE**: 33 wins / 77 fights (42.86%)
- **PARRY-STRIKE**: 17 wins / 40 fights (42.50%)
- **WALL OF STEEL**: 35 wins / 89 fights (39.33%)
- **TOTAL PARRY**: 6 wins / 29 fights (20.69%)

## 4. Anomalies & Actionable Suggestions
- **Economy Issue:** High inflation. **Recommendation:** Lower `FIGHT_PURSE` from 40 to 15, and `WIN_BONUS` from 25 to 10 in `src/data/economyConstants.ts` to curb hyper-inflation.
- **Meta-Drift Issue:** Styles like SLASHING ATTACK, LUNGING ATTACK, STRIKING ATTACK are overperforming (>60% win rate). **Recommendation:** Increase base stamina drain for attacks by 10% or reduce their base damage modifier by 5%.
- **Meta-Drift Issue:** Styles like WALL OF STEEL, TOTAL PARRY are heavily underperforming (<40% win rate). **Recommendation:** Increase riposte chance on successful parries by 10% or lower base fatigue costs for parries.
