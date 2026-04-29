# Batch Advance Production Readiness Guide

## Overview

This document provides the production rollout strategy for the new batch time advancement system (quarter/year advancement, headless mode, and deferred OPFS archiving).

## Feature Flags

All new functionality is gated behind feature flags for gradual rollout:

```typescript
// src/engine/featureFlags.ts
interface FeatureFlags {
  quarterPipeline: boolean;      // Enable 13-week batch advancement
  yearPipeline: boolean;         // Enable 52-week batch advancement
  headlessWeekAdvance: boolean;  // Skip UI-facing passes for performance
}
```

### Default State (Production)
```typescript
const DEFAULTS: FeatureFlags = {
  quarterPipeline: false,
  yearPipeline: false,
  headlessWeekAdvance: false,
};
```

## Rollout Phases

### Phase 1: Internal Testing (Week 1)
- Enable on dev/staging environments
- Run full test suite (851 tests)
- Manual QA on quarter/year advancement
- Monitor for any determinism issues

```typescript
setFeatureFlags({
  quarterPipeline: true,
  yearPipeline: true,
  headlessWeekAdvance: true,
});
```

### Phase 2: Canary Release (Week 2)
- Enable for 5% of new games
- Monitor error rates and performance
- A/B test: batch vs sequential

```typescript
// In game initialization
const enableBatch = Math.random() < 0.05 && isNewGame;
setFeatureFlags({
  quarterPipeline: enableBatch,
  yearPipeline: enableBatch,
  headlessWeekAdvance: enableBatch,
});
```

### Phase 3: Gradual Rollout (Week 3-4)
- Increase to 25% → 50% → 75% → 100%
- Monitor metrics at each step
- Keep rollback plan ready

### Phase 4: Full Enablement (Week 5+)
- Enable for all games
- Remove feature flag checks (future cleanup)

## Monitoring & Telemetry

### Key Metrics to Track

1. **Performance Metrics**
   ```typescript
   // Log timing for batch operations
   telemetry.timing('advance_quarter', durationMs);
   telemetry.timing('advance_year', durationMs);
   telemetry.timing('autosim_batch', durationMs);
   ```

2. **Error Rates**
   ```typescript
   // Track failures
   telemetry.increment('advance_quarter_error');
   telemetry.increment('deferred_archive_flush_error');
   ```

3. **Determinism Validation**
   ```typescript
   // Periodic determinism checks
   if (Math.random() < 0.01) { // 1% sample
     runDeterminismCheck(state);
   }
   ```

4. **Feature Flag Status**
   ```typescript
   telemetry.gauge('feature_flag_quarter', flags.quarterPipeline ? 1 : 0);
   telemetry.gauge('feature_flag_year', flags.yearPipeline ? 1 : 0);
   ```

### Recommended Dashboards

1. **Batch Advance Performance**
   - Quarter advance duration (p50, p95, p99)
   - Year advance duration
   - Headless vs full mode comparison

2. **Error Tracking**
   - Batch operation failures
   - OPFS archive flush failures
   - Stop condition triggers

3. **Adoption**
   - % of games using batch mode
   - % using headless mode
   - Weekly advancement method breakdown

## Rollback Procedures

### Automatic Rollback Triggers

```typescript
// In TimeAdvanceService - automatic rollback on error
async advanceQuarter(state: GameState, opts?: AdvanceOptions): Promise<QuarterAdvanceResult> {
  const flags = getFeatureFlags();
  
  if (!flags.quarterPipeline) {
    throw new Error('Quarter pipeline not enabled');
  }
  
  try {
    return await this._advanceQuarterInternal(state, opts);
  } catch (error) {
    telemetry.increment('advance_quarter_error');
    
    // Automatic rollback to sequential mode
    console.error('Batch quarter advance failed, falling back to sequential:', error);
    return this._sequentialQuarterFallback(state, opts);
  }
}
```

### Manual Rollback

If issues are detected, disable features immediately:

```typescript
// Emergency rollback - call from debug console or admin panel
setFeatureFlags({
  quarterPipeline: false,
  yearPipeline: false,
  headlessWeekAdvance: false,
});

// Clear any cached state
localStorage.removeItem('featureFlags');
```

### Gradual Rollback by User

```typescript
// Allow individual users to opt out
function setUserBatchPreference(enabled: boolean) {
  localStorage.setItem('userBatchPreference', enabled ? 'true' : 'false');
  
  const userPref = localStorage.getItem('userBatchPreference');
  const globalEnabled = getFeatureFlags().quarterPipeline;
  
  setFeatureFlags({
    quarterPipeline: globalEnabled && userPref !== 'false',
    yearPipeline: globalEnabled && userPref !== 'false',
    headlessWeekAdvance: globalEnabled && userPref !== 'false',
  });
}
```

## Usage Guidelines

### When to Use Batch Mode

**Recommended for:**
- Autosim operations (long-running simulations)
- Background season advancement
- Multiple AI rival processing

**Not recommended for:**
- User-initiated single week advancement (user expects immediate feedback)
- Tournament weeks (need full UI feedback)
- When player death/bankruptcy detection is critical

### Code Examples

```typescript
// Sequential mode (default, safest)
const newState = await TickOrchestrator.advanceWeek(currentState);

// Batch quarter mode (headless for performance)
const result = await TickOrchestrator.skipToQuarterEnd(currentState, {
  deferArchives: true,
});

// Batch year mode
const result = await TickOrchestrator.skipToYearEnd(currentState, {
  deferArchives: true,
});

// Autosim with batch mode
const result = await runAutosim(state, {
  weeksToSim: 52,
  useBatchMode: true,  // Uses quarter chunks internally
  deferArchives: true,
});
```

## Testing Checklist

Before full enablement, verify:

- [ ] All 851 tests pass
- [ ] Determinism tests pass (quarter === 13 weeks)
- [ ] Performance benchmarks meet targets
- [ ] Memory usage stable during long simulations
- [ ] OPFS archiving works correctly with deferral
- [ ] Stop conditions trigger correctly
- [ ] Error handling and rollback works
- [ ] Feature flags can be toggled at runtime

## Known Limitations

1. **Determinism**: Batch mode produces functionally equivalent but not byte-identical state (UUIDs may differ due to RNG timing)
2. **Per-week details**: Batch mode aggregates week summaries, losing some per-bout details in autosim
3. **UI content**: Headless mode skips newsletters and gazettes (intentional for performance)
4. **Offer processing**: Batch autosim processes player offers at quarter boundaries, not per-week

## Support

For issues with batch advancement:
1. Check feature flag status
2. Review telemetry logs
3. Try sequential fallback
4. File bug report with state dump

## Future Enhancements

- Object pooling for StateImpact (rejected for now - too complex)
- Parallel pipeline passes (rejected - determinism risk)
- Streaming autosim (process weeks as they complete)
- Web Worker offload for batch operations
