# Daily Balance & Meta Report
Generated dynamically after autosimming 100 weeks.

## 1. Economy Metrics
- **Initial Gold:** 500
- **Final Gold:** -109500
- **Average Gold:** -54500.00
- *Observation:* Deflation / poverty detected (wealth decreased by -0.0x).

## 2. Lethality & Injuries
- **Total Bouts Simulated:** 0
- **Total Deaths:** 0 (Kill Rate: 0.00%)
- **Total Injuries:** 0 (Injury Rate: 0.00%)
- *Observation:* Kill rate is below the 8% target bound.

## 3. Meta-Drift (AI Adaptation & Style Dominance)
- **AIMED BLOW**: 0 drift
- **BASHING ATTACK**: 0 drift
- **LUNGING ATTACK**: 0 drift
- **PARRY-LUNGE**: 0 drift
- **PARRY-RIPOSTE**: 0 drift
- **PARRY-STRIKE**: 0 drift
- **SLASHING ATTACK**: 0 drift
- **STRIKING ATTACK**: 0 drift
- **TOTAL PARRY**: 0 drift
- **WALL OF STEEL**: 0 drift

### Style Win Rates (Overall)

## 4. Anomalies & Actionable Suggestions
- **Economy Issue:** Negative economy balance. **Recommendation:** Increase `FIGHT_PURSE` from 40 to 65 or lower `WARRIOR_UPKEEP_BASE` from 55 to 45 in `src/data/economyConstants.ts` to prevent early bankruptcies.
- **Lethality Issue:** Kill rate (0.00%) is lower than the 8-15% target. **Recommendation:** Increase `KILL_THRESHOLD_BASE` from 0.3 to 0.35 in `src/engine/combat/resolution.ts` to make kills more frequent.
