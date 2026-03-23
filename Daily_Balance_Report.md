# Daily Balance & Meta Report
Generated after simulating 100 weeks.

## 1. Economy Metrics
- **Initial Gold:** 1444
- **Final Gold:** 101922
- **Average Gold (over time):** 40101.88
- *Observation:* Potential hyper-inflation detected. Consider adding more gold sinks.

## 2. Lethality & Injuries
- **Total Bouts:** 828
- **Total Deaths:** 149 (Kill Rate: 18.00%)
- **Total Injuries:** 144 (Injury Rate: 17.39%)
- *Observation:* Check against the `Stable_Lords_Kill_Death_and_Permadeath_Spec_v0.2.md`. Are these rates within expected bounds?

## 3. Meta-Drift (AI Adaptation & Style Dominance)
Current Meta Drift Window Analysis:
- **AIMED BLOW**: -1 drift
- **BASHING ATTACK**: -4 drift
- **LUNGING ATTACK**: +5 drift
- **PARRY-LUNGE**: -5 drift
- **PARRY-RIPOSTE**: -8 drift
- **PARRY-STRIKE**: -6 drift
- **SLASHING ATTACK**: -3 drift
- **STRIKING ATTACK**: +4 drift
- **TOTAL PARRY**: -3 drift
- **WALL OF STEEL**: +3 drift

### Style Win Rates (Overall)
- **LUNGING ATTACK**: 188 wins / 239 fights (78.66%)
- **STRIKING ATTACK**: 149 wins / 226 fights (65.93%)
- **WALL OF STEEL**: 121 wins / 201 fights (60.20%)
- **AIMED BLOW**: 87 wins / 175 fights (49.71%)
- **SLASHING ATTACK**: 40 wins / 89 fights (44.94%)
- **TOTAL PARRY**: 81 wins / 190 fights (42.63%)
- **BASHING ATTACK**: 56 wins / 137 fights (40.88%)
- **PARRY-LUNGE**: 42 wins / 120 fights (35.00%)
- **PARRY-STRIKE**: 24 wins / 103 fights (23.30%)
- **PARRY-RIPOSTE**: 40 wins / 176 fights (22.73%)

## 4. Anomalies & Suggestions
- *Mathematical Anomalies:* Styles with >60% win rate: LUNGING ATTACK, STRIKING ATTACK, WALL OF STEEL. Styles with <40% win rate: PARRY-LUNGE, PARRY-STRIKE, PARRY-RIPOSTE.
- *Suggested Tweaks:* Lethality (18.00%) seems reasonable. Economy is inflating. Adjust `economy.ts` or add maintenance costs.
