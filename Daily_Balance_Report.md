# Daily Balance & Meta Report
Generated after simulating 100 weeks.

## 1. Economy Metrics
- **Initial Gold:** 2034
- **Final Gold:** 141220
- **Average Gold (over time):** 63483.54
- *Observation:* Potential hyper-inflation detected. Consider adding more gold sinks.

## 2. Lethality & Injuries
- **Total Bouts:** 987
- **Total Deaths:** 75 (Kill Rate: 7.60%)
- **Total Injuries:** 148 (Injury Rate: 14.99%)
- *Observation:* Check against the `Stable_Lords_Kill_Death_and_Permadeath_Spec_v0.2.md`. Are these rates within expected bounds?

## 3. Meta-Drift (AI Adaptation & Style Dominance)
Current Meta Drift Window Analysis:
- **AIMED BLOW**: 0 drift
- **BASHING ATTACK**: +9 drift
- **LUNGING ATTACK**: +5 drift
- **PARRY-LUNGE**: 0 drift
- **PARRY-RIPOSTE**: -4 drift
- **PARRY-STRIKE**: -1 drift
- **SLASHING ATTACK**: +2 drift
- **STRIKING ATTACK**: +5 drift
- **TOTAL PARRY**: -6 drift
- **WALL OF STEEL**: -2 drift

### Style Win Rates (Overall)
- **BASHING ATTACK**: 200 wins / 216 fights (92.59%)
- **SLASHING ATTACK**: 162 wins / 221 fights (73.30%)
- **STRIKING ATTACK**: 117 wins / 160 fights (73.13%)
- **LUNGING ATTACK**: 84 wins / 125 fights (67.20%)
- **PARRY-LUNGE**: 95 wins / 175 fights (54.29%)
- **AIMED BLOW**: 36 wins / 72 fights (50.00%)
- **PARRY-STRIKE**: 135 wins / 281 fights (48.04%)
- **WALL OF STEEL**: 70 wins / 227 fights (30.84%)
- **PARRY-RIPOSTE**: 48 wins / 187 fights (25.67%)
- **TOTAL PARRY**: 39 wins / 310 fights (12.58%)

## 4. Anomalies & Suggestions
- *Mathematical Anomalies:* Styles with >60% win rate: BASHING ATTACK, SLASHING ATTACK, STRIKING ATTACK, LUNGING ATTACK. Styles with <40% win rate: WALL OF STEEL, PARRY-RIPOSTE, TOTAL PARRY.
- *Suggested Tweaks:* Lethality is low (7.60% vs expected 8-15%). Consider increasing `KILL_THRESHOLD_BASE` in `src/engine/combat/resolution.ts`. Economy is inflating. Consider reducing `FIGHT_PURSE` or `WIN_BONUS` in `src/engine/economy.ts`, or adding more gold sinks.
