# Daily Balance & Meta Report
Generated dynamically after autosimming 100 weeks.

## 1. Economy Metrics
- **Initial Gold:** 500
- **Final Gold:** 159384
- **Average Gold:** 66776.31
- *Observation:* Hyper-inflation detected (wealth increased by 318.8x).

## 2. Lethality & Injuries
- **Total Bouts Simulated:** 500
- **Total Deaths:** 0 (Kill Rate: 0.00%)
- **Total Injuries:** 0 (Injury Rate: 0.00%)
- *Observation:* Kill rate is below the 8% target bound.

## 3. Meta-Drift (AI Adaptation & Style Dominance)
- **AIMED BLOW**: -6 drift
- **BASHING ATTACK**: 0 drift
- **LUNGING ATTACK**: +6 drift
- **PARRY-LUNGE**: -1 drift
- **PARRY-RIPOSTE**: -10 drift
- **PARRY-STRIKE**: -8 drift
- **SLASHING ATTACK**: +8 drift
- **STRIKING ATTACK**: +3 drift
- **TOTAL PARRY**: -10 drift
- **WALL OF STEEL**: -7 drift

### Style Win Rates (Overall)
- **SLASHING ATTACK**: 156 wins / 171 fights (91.23%)
- **LUNGING ATTACK**: 139 wins / 159 fights (87.42%)
- **STRIKING ATTACK**: 120 wins / 154 fights (77.92%)
- **PARRY-LUNGE**: 57 wins / 182 fights (31.32%)
- **WALL OF STEEL**: 12 wins / 84 fights (14.29%)
- **PARRY-STRIKE**: 8 wins / 71 fights (11.27%)
- **AIMED BLOW**: 8 wins / 85 fights (9.41%)
- **TOTAL PARRY**: 0 wins / 63 fights (0.00%)
- **PARRY-RIPOSTE**: 0 wins / 31 fights (0.00%)

## 4. Anomalies & Actionable Suggestions
- **Economy Issue:** High inflation. Consider lowering `WIN_BONUS` or `FIGHT_PURSE` in `src/engine/economy.ts`, or adding scaling gold sinks like trainer tier salaries.
- **Lethality Issue:** Kill rate (0.00%) is lower than the 8-15% target. Consider increasing `KILL_THRESHOLD_BASE` in `src/engine/combat/resolution.ts` to make kills more frequent.
- **Meta-Drift Issue:** Styles like SLASHING ATTACK, LUNGING ATTACK, STRIKING ATTACK are overperforming (>60% win rate). Review their attack modifiers or stamina drain formulas.
- **Meta-Drift Issue:** Styles like PARRY-LUNGE, WALL OF STEEL, PARRY-STRIKE, AIMED BLOW, TOTAL PARRY, PARRY-RIPOSTE are heavily underperforming (<40% win rate). Review their base defensive bonuses, riposte chances, or fatigue costs.
