# Daily Balance & Meta Report
Generated after simulating 100 weeks.

## 1. Economy Metrics
- **Initial Gold:** 1484
- **Final Gold:** 123292
- **Average Gold (over time):** 53729.12
- *Observation:* Potential hyper-inflation detected. Consider adding more gold sinks.

## 2. Lethality & Injuries
- **Total Bouts:** 1006
- **Total Deaths:** 52 (Kill Rate: 5.17%)
- **Total Injuries:** 136 (Injury Rate: 13.52%)
- *Observation:* Check against the `Stable_Lords_Kill_Death_and_Permadeath_Spec_v0.2.md`. Are these rates within expected bounds?

## 3. Meta-Drift (AI Adaptation & Style Dominance)
Current Meta Drift Window Analysis:
- **AIMED BLOW**: +3 drift
- **BASHING ATTACK**: +8 drift
- **LUNGING ATTACK**: +6 drift
- **PARRY-LUNGE**: +2 drift
- **PARRY-RIPOSTE**: -7 drift
- **PARRY-STRIKE**: +1 drift
- **SLASHING ATTACK**: +4 drift
- **STRIKING ATTACK**: +5 drift
- **TOTAL PARRY**: -10 drift
- **WALL OF STEEL**: -4 drift

### Style Win Rates (Overall)
- **BASHING ATTACK**: 223 wins / 259 fights (86.10%)
- **STRIKING ATTACK**: 148 wins / 190 fights (77.89%)
- **SLASHING ATTACK**: 130 wins / 184 fights (70.65%)
- **LUNGING ATTACK**: 69 wins / 102 fights (67.65%)
- **PARRY-STRIKE**: 132 wins / 258 fights (51.16%)
- **AIMED BLOW**: 83 wins / 166 fights (50.00%)
- **PARRY-LUNGE**: 71 wins / 149 fights (47.65%)
- **WALL OF STEEL**: 97 wins / 314 fights (30.89%)
- **PARRY-RIPOSTE**: 30 wins / 179 fights (16.76%)
- **TOTAL PARRY**: 23 wins / 211 fights (10.90%)

## 4. Anomalies & Suggestions
- *Mathematical Anomalies:* Styles with >60% win rate: BASHING ATTACK, STRIKING ATTACK, SLASHING ATTACK, LUNGING ATTACK. Styles with <40% win rate: WALL OF STEEL, PARRY-RIPOSTE, TOTAL PARRY.
- *Suggested Tweaks:* Lethality (5.17%) seems reasonable. Economy is inflating. Adjust `economy.ts` or add maintenance costs.
