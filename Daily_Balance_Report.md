# Daily Balance & Meta Report
Generated dynamically after autosimming 100 weeks.

## 1. Economy Metrics
- **Initial Gold:** 500
- **Final Gold:** 278642
- **Average Gold:** 128502.32
- *Observation:* Hyper-inflation detected (wealth increased by 557.3x).

## 2. Lethality & Injuries
- **Total Bouts Simulated:** 1723
- **Total Deaths:** 192 (Kill Rate: 11.14%)
- **Total Injuries:** 0 (Injury Rate: 0.00%)
- *Observation:* Kill rate is safely within the target 8-15% bounds.

## 3. Meta-Drift (AI Adaptation & Style Dominance)
- **AIMED BLOW**: +1 drift
- **BASHING ATTACK**: +4 drift
- **LUNGING ATTACK**: +8 drift
- **PARRY-LUNGE**: 0 drift
- **PARRY-RIPOSTE**: -4 drift
- **PARRY-STRIKE**: -2 drift
- **SLASHING ATTACK**: +4 drift
- **STRIKING ATTACK**: +5 drift
- **TOTAL PARRY**: -7 drift
- **WALL OF STEEL**: -1 drift

### Style Win Rates (Overall)
- **LUNGING ATTACK**: 2 wins / 2 fights (100.00%)
- **SLASHING ATTACK**: 4 wins / 5 fights (80.00%)
- **STRIKING ATTACK**: 5 wins / 7 fights (71.43%)
- **PARRY-RIPOSTE**: 8 wins / 13 fights (61.54%)
- **BASHING ATTACK**: 6 wins / 11 fights (54.55%)
- **WALL OF STEEL**: 6 wins / 12 fights (50.00%)
- **PARRY-STRIKE**: 9 wins / 18 fights (50.00%)
- **TOTAL PARRY**: 3 wins / 18 fights (16.67%)

## 4. Anomalies & Actionable Suggestions
- **Economy Issue:** High inflation. Consider lowering `WIN_BONUS` or `FIGHT_PURSE` in `src/engine/economy.ts`, or adding scaling gold sinks like trainer tier salaries.
- **Meta-Drift Issue:** Styles like LUNGING ATTACK, SLASHING ATTACK, STRIKING ATTACK, PARRY-RIPOSTE are overperforming (>60% win rate). Review their attack modifiers or stamina drain formulas.
- **Meta-Drift Issue:** Styles like TOTAL PARRY are heavily underperforming (<40% win rate). Review their base defensive bonuses, riposte chances, or fatigue costs.
