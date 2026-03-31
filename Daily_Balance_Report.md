# Daily Balance & Meta Report
Generated dynamically after autosimming 100 weeks.

## 1. Economy Metrics
- **Initial Gold:** 500
- **Final Gold:** 308903
- **Average Gold:** 131592.01
- *Observation:* Hyper-inflation detected (wealth increased by 617.8x).

## 2. Lethality & Injuries
- **Total Bouts Simulated:** 500
- **Total Deaths:** 0 (Kill Rate: 0.00%)
- **Total Injuries:** 0 (Injury Rate: 0.00%)
- *Observation:* Kill rate is below the 8% target bound.

## 3. Meta-Drift (AI Adaptation & Style Dominance)
- **AIMED BLOW**: 0 drift
- **BASHING ATTACK**: +6 drift
- **LUNGING ATTACK**: +5 drift
- **PARRY-LUNGE**: -1 drift
- **PARRY-RIPOSTE**: -5 drift
- **PARRY-STRIKE**: -2 drift
- **SLASHING ATTACK**: +5 drift
- **STRIKING ATTACK**: +7 drift
- **TOTAL PARRY**: -8 drift
- **WALL OF STEEL**: -1 drift

### Style Win Rates (Overall)
- **STRIKING ATTACK**: 64 wins / 75 fights (85.33%)
- **BASHING ATTACK**: 30 wins / 37 fights (81.08%)
- **LUNGING ATTACK**: 35 wins / 45 fights (77.78%)
- **AIMED BLOW**: 23 wins / 33 fights (69.70%)
- **SLASHING ATTACK**: 65 wins / 95 fights (68.42%)
- **PARRY-STRIKE**: 18 wins / 33 fights (54.55%)
- **PARRY-LUNGE**: 19 wins / 40 fights (47.50%)
- **WALL OF STEEL**: 31 wins / 88 fights (35.23%)
- **PARRY-RIPOSTE**: 11 wins / 53 fights (20.75%)
- **TOTAL PARRY**: 5 wins / 105 fights (4.76%)

## 4. Anomalies & Actionable Suggestions
- **Economy Issue:** High inflation. Consider lowering `WIN_BONUS` or `FIGHT_PURSE` in `src/engine/economy.ts`, or adding scaling gold sinks like trainer tier salaries.
- **Lethality Issue:** Kill rate (0.00%) is lower than the 8-15% target. Consider increasing `KILL_THRESHOLD_BASE` in `src/engine/combat/resolution.ts` to make kills more frequent.
- **Meta-Drift Issue:** Styles like STRIKING ATTACK, BASHING ATTACK, LUNGING ATTACK, AIMED BLOW, SLASHING ATTACK are overperforming (>60% win rate). Review their attack modifiers or stamina drain formulas.
- **Meta-Drift Issue:** Styles like WALL OF STEEL, PARRY-RIPOSTE, TOTAL PARRY are heavily underperforming (<40% win rate). Review their base defensive bonuses, riposte chances, or fatigue costs.
