# Daily Balance & Meta Report
Generated after simulating 100 weeks.

## 1. Economy Metrics
- **Initial Gold:** 1358
- **Final Gold:** 92800
- **Average Gold (over time):** 39641.52
- *Observation:* Potential hyper-inflation detected. Consider adding more gold sinks.

## 2. Lethality & Injuries
- **Total Bouts:** 772
- **Total Deaths:** 128 (Kill Rate: 16.58%)
- **Total Injuries:** 138 (Injury Rate: 17.88%)
- *Observation:* Check against the `Stable_Lords_Kill_Death_and_Permadeath_Spec_v0.2.md`. Are these rates within expected bounds?

## 3. Meta-Drift (AI Adaptation & Style Dominance)
Current Meta Drift Window Analysis:
- **AIMED BLOW**: +1 drift
- **BASHING ATTACK**: +1 drift
- **LUNGING ATTACK**: +4 drift
- **PARRY-LUNGE**: -4 drift
- **PARRY-RIPOSTE**: -7 drift
- **PARRY-STRIKE**: -2 drift
- **SLASHING ATTACK**: -1 drift
- **STRIKING ATTACK**: +4 drift
- **TOTAL PARRY**: -4 drift
- **WALL OF STEEL**: +3 drift

### Style Win Rates (Overall)
- **LUNGING ATTACK**: 137 wins / 183 fights (74.86%)
- **STRIKING ATTACK**: 174 wins / 257 fights (67.70%)
- **WALL OF STEEL**: 64 wins / 110 fights (58.18%)
- **AIMED BLOW**: 127 wins / 220 fights (57.73%)
- **BASHING ATTACK**: 54 wins / 118 fights (45.76%)
- **SLASHING ATTACK**: 52 wins / 122 fights (42.62%)
- **PARRY-LUNGE**: 20 wins / 57 fights (35.09%)
- **PARRY-STRIKE**: 41 wins / 128 fights (32.03%)
- **TOTAL PARRY**: 91 wins / 299 fights (30.43%)
- **PARRY-RIPOSTE**: 11 wins / 50 fights (22.00%)

## 4. Anomalies & Suggestions
- *Mathematical Anomalies:* Styles with >60% win rate: LUNGING ATTACK, STRIKING ATTACK. Styles with <40% win rate: PARRY-LUNGE, PARRY-STRIKE, TOTAL PARRY, PARRY-RIPOSTE.
- *Suggested Tweaks:* Lethality (16.58%) seems reasonable. Economy is inflating. Adjust `economy.ts` or add maintenance costs.
