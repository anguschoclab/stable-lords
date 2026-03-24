# Daily Balance & Meta Report
Generated after simulating 100 weeks.

## 1. Economy Metrics
- **Initial Gold:** 1736
- **Final Gold:** 102282
- **Average Gold (over time):** 45409.64
- *Observation:* Potential hyper-inflation detected. Consider adding more gold sinks.

## 2. Lethality & Injuries
- **Total Bouts:** 838
- **Total Deaths:** 55 (Kill Rate: 6.56%)
- **Total Injuries:** 141 (Injury Rate: 16.83%)
- *Observation:* Check against the `Stable_Lords_Kill_Death_and_Permadeath_Spec_v0.2.md`. Are these rates within expected bounds?

## 3. Meta-Drift (AI Adaptation & Style Dominance)
Current Meta Drift Window Analysis:
- **AIMED BLOW**: +5 drift
- **BASHING ATTACK**: +7 drift
- **LUNGING ATTACK**: +6 drift
- **PARRY-LUNGE**: 0 drift
- **PARRY-RIPOSTE**: -5 drift
- **PARRY-STRIKE**: -4 drift
- **SLASHING ATTACK**: +3 drift
- **STRIKING ATTACK**: +4 drift
- **TOTAL PARRY**: -4 drift
- **WALL OF STEEL**: -1 drift

### Style Win Rates (Overall)
- **BASHING ATTACK**: 161 wins / 178 fights (90.45%)
- **SLASHING ATTACK**: 145 wins / 197 fights (73.60%)
- **STRIKING ATTACK**: 144 wins / 199 fights (72.36%)
- **LUNGING ATTACK**: 69 wins / 108 fights (63.89%)
- **PARRY-LUNGE**: 54 wins / 112 fights (48.21%)
- **AIMED BLOW**: 20 wins / 44 fights (45.45%)
- **PARRY-STRIKE**: 77 wins / 178 fights (43.26%)
- **WALL OF STEEL**: 77 wins / 223 fights (34.53%)
- **PARRY-RIPOSTE**: 33 wins / 138 fights (23.91%)
- **TOTAL PARRY**: 57 wins / 299 fights (19.06%)

## 4. Anomalies & Suggestions
- *Mathematical Anomalies:* Styles with >60% win rate: BASHING ATTACK, SLASHING ATTACK, STRIKING ATTACK, LUNGING ATTACK. Styles with <40% win rate: WALL OF STEEL, PARRY-RIPOSTE, TOTAL PARRY.
- *Suggested Tweaks:* Lethality is low (6.56% vs expected 8-15%). Consider increasing `KILL_THRESHOLD_BASE` in `src/engine/combat/resolution.ts`. Economy is inflating. Consider reducing `FIGHT_PURSE` or `WIN_BONUS` in `src/engine/economy.ts`, or adding more gold sinks.
