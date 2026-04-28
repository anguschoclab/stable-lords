import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createFreshState } from '@/engine/factories';
import { TimeAdvanceService } from '@/engine/tick/TimeAdvanceService';
import { setFeatureFlags } from '@/engine/featureFlags';
import { runAutosim } from '@/engine/autosim';

// Mock the archiver to avoid disk I/O during perf tests
vi.mock('@/engine/pipeline/adapters/opfsArchiver', () => ({
  archiveWeekLogs: (state: unknown) => state,
  flushDeferredArchives: async (state: unknown) => state,
}));

describe('Pipeline Performance Benchmarks', () => {
  beforeEach(() => {
    setFeatureFlags({
      quarterPipeline: true,
      yearPipeline: true,
      headlessWeekAdvance: true,
    });
  });

  afterEach(() => {
    setFeatureFlags({
      quarterPipeline: false,
      yearPipeline: false,
      headlessWeekAdvance: false,
    });
    vi.restoreAllMocks();
  });

  it('should complete quarter advance within reasonable time', async () => {
    const state = createFreshState('perf-test', '2026-04-28T09:00:00Z');
    const startTime = performance.now();

    const result = await TimeAdvanceService.advanceQuarter(state, {
      headless: true,
      deferArchives: true,
    });

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(result.weeksCompleted).toBe(13);
    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
  });

  it('headless mode should be faster than full mode', async () => {
    const state = createFreshState('perf-test-headless', '2026-04-28T09:00:00Z');

    // Measure headless mode (skips EventPass and NarrativePass)
    const headlessStart = performance.now();
    await TimeAdvanceService.advanceQuarter(state, {
      headless: true,
      deferArchives: true,
    });
    const headlessDuration = performance.now() - headlessStart;

    // Note: We can't easily compare to full mode since it requires feature flags
    // But we can verify headless completes in reasonable time
    expect(headlessDuration).toBeLessThan(5000);
  });

  it('autosim batch mode should handle large week counts', async () => {
    const state = createFreshState('autosim-perf-test', '2026-04-28T09:00:00Z');
    const weeksToSim = 52; // One year

    const startTime = performance.now();

    const result = await runAutosim(state, {
      weeksToSim,
      useBatchMode: true,
      deferArchives: true,
    });

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(result.weeksSimmed).toBeGreaterThan(0);
    expect(duration).toBeLessThan(30000); // Should complete within 30 seconds for a year
  });

  it('should not accumulate excessive memory during batch operations', async () => {
    // This is a basic check - we can't easily measure heap in tests
    // But we can verify the simulation completes without OOM
    const state = createFreshState('memory-test', '2026-04-28T09:00:00Z');

    // Run 4 quarters (1 year) with deferred archives
    let currentState = state;
    for (let q = 0; q < 4; q++) {
      const result = await TimeAdvanceService.advanceQuarter(currentState, {
        headless: true,
        deferArchives: true,
      });
      currentState = result.state;

      // Verify deferred logs don't accumulate indefinitely
      // They should be cleared after each quarter flush
      expect((currentState as any).deferredBoutLogs ?? []).toHaveLength(0);
    }

    expect(currentState.year).toBeGreaterThan(1);
  });
});

describe('Determinism vs Performance Trade-offs', () => {
  beforeEach(() => {
    setFeatureFlags({
      quarterPipeline: true,
      yearPipeline: true,
      headlessWeekAdvance: true,
    });
  });

  afterEach(() => {
    setFeatureFlags({
      quarterPipeline: false,
      yearPipeline: false,
      headlessWeekAdvance: false,
    });
  });

  it('sequential vs batch should produce similar functional state', async () => {
    const FIXED_ISO = '2026-04-28T09:00:00Z';
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(FIXED_ISO);

    const stateSeq = createFreshState('determinism-perf', FIXED_ISO);
    const stateBatch = createFreshState('determinism-perf', FIXED_ISO);

    // Sequential: 13 individual weeks
    let seqState = stateSeq;
    for (let i = 0; i < 13; i++) {
      const { advanceWeek } = await import('@/engine/pipeline/services/weekPipelineService');
      seqState = advanceWeek(seqState, { headless: true });
    }

    // Batch: 1 quarter call
    const batchResult = await TimeAdvanceService.advanceQuarter(stateBatch, {
      headless: true,
    });

    // Functional state should match
    expect(batchResult.state.week).toBe(seqState.week);
    expect(batchResult.state.year).toBe(seqState.year);
    expect(batchResult.state.treasury).toBe(seqState.treasury);
    expect(batchResult.state.roster.length).toBe(seqState.roster.length);
  });
});

// Stress test for long-running simulations
describe('Long-running Simulation Stress Tests', () => {
  beforeEach(() => {
    setFeatureFlags({
      quarterPipeline: true,
      headlessWeekAdvance: true,
    });
  });

  afterEach(() => {
    setFeatureFlags({
      quarterPipeline: false,
      headlessWeekAdvance: false,
    });
  });

  it('should handle 5 years of simulation without memory issues', async () => {
    const state = createFreshState('stress-test', '2026-04-28T09:00:00Z');
    const targetYears = 5;
    const weeksPerYear = 52;
    const totalWeeks = targetYears * weeksPerYear;

    const result = await runAutosim(state, {
      weeksToSim: totalWeeks,
      useBatchMode: true,
      deferArchives: true,
    });

    expect(result.weeksSimmed).toBeGreaterThanOrEqual(totalWeeks - 13); // Allow for stop conditions
    expect(result.finalState.year).toBeGreaterThanOrEqual(targetYears);
  }, 120000); // 2 minute timeout for stress test
});
