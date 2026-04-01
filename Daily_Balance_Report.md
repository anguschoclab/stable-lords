# Daily Balance & Meta Report
Generated dynamically after autosimming 100 weeks.

## 1. Economy Metrics
- **Initial Gold:** 500
- **Final Gold:** 323567
- **Average Gold:** 145485.92
- *Observation:* Hyper-inflation detected (wealth increased by 647.1x).

## 2. Lethality & Injuries
- **Total Bouts Simulated:** 1727
- **Total Deaths:** 186 (Kill Rate: 10.77%)
- **Total Injuries:** 0 (Injury Rate: 0.00%)
- *Observation:* Kill rate is safely within the target 8-15% bounds.

## 3. Meta-Drift (AI Adaptation & Style Dominance)
- **AIMED BLOW**: -1 drift
- **BASHING ATTACK**: +7 drift
- **LUNGING ATTACK**: +5 drift
- **PARRY-LUNGE**: -2 drift
- **PARRY-RIPOSTE**: -3 drift
- **PARRY-STRIKE**: -3 drift
- **SLASHING ATTACK**: +4 drift
- **STRIKING ATTACK**: +4 drift
- **TOTAL PARRY**: -7 drift
- **WALL OF STEEL**: -5 drift

### Style Win Rates (Overall)
- **STRIKING ATTACK**: 15 wins / 18 fights (83.33%)
- **TOTAL PARRY**: 2 wins / 3 fights (66.67%)
- **PARRY-STRIKE**: 13 wins / 25 fights (52.00%)
- **BASHING ATTACK**: 6 wins / 15 fights (40.00%)
- **PARRY-RIPOSTE**: 1 wins / 3 fights (33.33%)
- **AIMED BLOW**: 2 wins / 6 fights (33.33%)
- **WALL OF STEEL**: 3 wins / 11 fights (27.27%)
- **PARRY-LUNGE**: 0 wins / 2 fights (0.00%)
- **LUNGING ATTACK**: 0 wins / 1 fights (0.00%)

## 4. Anomalies & Actionable Suggestions
- **Economy Issue:** High inflation. Consider lowering `WIN_BONUS` or `FIGHT_PURSE` in `src/engine/economy.ts`, or adding scaling gold sinks like trainer tier salaries.
- **Meta-Drift Issue:** Styles like STRIKING ATTACK, TOTAL PARRY are overperforming (>60% win rate). Review their attack modifiers or stamina drain formulas.
- **Meta-Drift Issue:** Styles like PARRY-RIPOSTE, AIMED BLOW, WALL OF STEEL, PARRY-LUNGE, LUNGING ATTACK are heavily underperforming (<40% win rate). Review their base defensive bonuses, riposte chances, or fatigue costs.
