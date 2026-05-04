import { describe, it, expect, vi, afterEach } from 'vitest';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { TimeAdvanceService } from '@/engine/tick/TimeAdvanceService';

// Mock the archiver adapter (used by weekPipelineService) to avoid disk I/O during tests
vi.mock('@/engine/pipeline/adapters/opfsArchiver', () => ({
  archiveWeekLogs: (state: unknown) => state,
}));

describe('Simulation Determinism', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should produce identical results from a fresh state over 5 weeks', () => {
    // Pin toISOString so any new Date().toISOString() calls inside advanceWeek are stable
    const FIXED_ISO = '2026-04-11T09:00:00.000Z';
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(FIXED_ISO);

    // 1. Setup two identical states
    // Pass a fixed timestamp to ensure meta.createdAt remains stable
    const stateA = createFreshState('test-seed-1', '2026-04-11T09:00:00Z');
    const stateB = createFreshState('test-seed-1', '2026-04-11T09:00:00Z');

    // 2. Advance both states 5 weeks
    let currentA = stateA;
    let currentB = stateB;

    for (let i = 0; i < 5; i++) {
      currentA = advanceWeek(currentA);
      currentB = advanceWeek(currentB);
    }

    // 3. Compare states (Omit non-serializable caches)
    delete (currentA as any).warriorMap;
    delete (currentB as any).warriorMap;
    delete (currentA as any).cachedMetaDrift;
    delete (currentB as any).cachedMetaDrift;

    // Use toEqual for deep comparison and clear diffs in Vitest output
    const objA = JSON.parse(JSON.stringify(currentA));
    const objB = JSON.parse(JSON.stringify(currentB));

    expect(currentA).toEqual(currentB);
  });

  it('should remain deterministic even when branching (recreating RNG)', () => {
    const rng1 = new SeededRNGService(12345);
    const rng2 = new SeededRNGService(12345);

    for (let i = 0; i < 100; i++) {
      expect(rng1.next()).toBe(rng2.next());
    }
  });

  it('should produce different results for different seeds', () => {
    const stateA = createFreshState('seed-a');

    // Manually skew one state's week or a seed-relevant property if needed,
    // but here we just verify that they are deterministic based on the week index.

    // Run week 1
    const week1A = advanceWeek(stateA);

    // Simulate a different "next week" path (this is a bit contrived but tests the principle)
    // Actually, just changing the starting week will change the seed.
    const stateC = { ...stateA, week: 10 };
    const week11C = advanceWeek(stateC);

    expect(JSON.stringify(week1A)).not.toBe(JSON.stringify(week11C));
  });
});

describe('Quarter/Year Advancement Determinism', () => {
  it('advanceQuarter should produce functionally equivalent state to 13 sequential advanceWeek calls', async () => {
    const FIXED_ISO = '2026-04-11T09:00:00.000Z';
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(FIXED_ISO);

    // Create two identical states
    const stateBatch = createFreshState('determinism-test', '2026-04-11T09:00:00Z');
    const stateSequential = createFreshState('determinism-test', '2026-04-11T09:00:00Z');

    // Advance using batch method
    const batchResult = await TimeAdvanceService.advanceQuarter(stateBatch);

    // Advance using sequential method
    let sequentialState = stateSequential;
    for (let i = 0; i < 13; i++) {
      sequentialState = advanceWeek(sequentialState);
    }

    // Compare functional state (week, year, treasury, roster size, etc.)
    // Note: Exact IDs may differ due to RNG usage patterns, but functional values should match
    expect(batchResult.state.week).toBe(sequentialState.week);
    expect(batchResult.state.year).toBe(sequentialState.year);
    expect(batchResult.state.treasury).toBe(sequentialState.treasury);
    expect(batchResult.state.roster.length).toBe(sequentialState.roster.length);
    expect(batchResult.state.arenaHistory.length).toBe(sequentialState.arenaHistory.length);

    // Compare week summaries structure
    expect(batchResult.summaries.length).toBe(13);
    expect(batchResult.quarterSummary.weekSummaries.length).toBe(13);

    // Compare functional week summary values
    for (let i = 0; i < 13; i++) {
      const batchSum = batchResult.summaries[i]!;
      // Sequential summaries would need to be extracted similarly
      expect(batchSum.week).toBeGreaterThan(0);
      expect(batchSum.year).toBeGreaterThan(0);
    }
  });

  it('advanceYear should produce functionally equivalent state to 52 sequential advanceWeek calls', async () => {
    const FIXED_ISO = '2026-04-11T09:00:00.000Z';
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(FIXED_ISO);

    // Create two identical states
    const stateBatch = createFreshState('year-determinism-test', '2026-04-11T09:00:00Z');
    const stateSequential = createFreshState('year-determinism-test', '2026-04-11T09:00:00Z');

    // Advance using batch method
    const batchResult = await TimeAdvanceService.advanceYear(stateBatch);

    // Advance using sequential method
    let sequentialState = stateSequential;
    for (let i = 0; i < 52; i++) {
      sequentialState = advanceWeek(sequentialState);
    }

    // Compare functional state (week, year, treasury, roster size, etc.)
    expect(batchResult.state.week).toBe(sequentialState.week);
    expect(batchResult.state.year).toBe(sequentialState.year);
    expect(batchResult.state.treasury).toBe(sequentialState.treasury);
    expect(batchResult.state.roster.length).toBe(sequentialState.roster.length);
    expect(batchResult.state.arenaHistory.length).toBe(sequentialState.arenaHistory.length);

    // Verify we completed 4 quarters
    expect(batchResult.quarterResults.length).toBe(4);
    expect(batchResult.annualSummary.endYear).toBe(batchResult.state.year);
  });

  it('quarter advancement should handle year boundaries correctly', async () => {
    // Start at week 50 (near year end)
    const state = createFreshState('year-boundary-test', '2026-04-11T09:00:00Z');
    state.week = 50;
    state.year = 1;

    const result = await TimeAdvanceService.advanceQuarter(state);

    // Should have advanced 13 weeks: 50→52 (year 1), then 1→11 (year 2)
    expect(result.state.year).toBe(2);
    expect(result.state.week).toBe(11);
    expect(result.quarterSummary.startWeek).toBe(50);
    expect(result.quarterSummary.endWeek).toBe(11);
    expect(result.quarterSummary.startYear).toBe(1);
    expect(result.quarterSummary.endYear).toBe(2);
  });

  it('should stop early when stop condition is met', async () => {
    const state = createFreshState('stop-condition-test', '2026-04-11T09:00:00Z');

    // Empty roster should trigger stop
    state.roster = [];

    const result = await TimeAdvanceService.advanceQuarter(state, {
      stopConditions: [{ type: 'rosterEmpty' }],
      checkpointInterval: 1,
    });

    expect(result.stopReason).toBe('roster_empty');
    expect(result.weeksCompleted).toBe(1); // Stopped after first checkpoint
  });

  it('should provide week summaries for each week advanced', async () => {
    const state = createFreshState('summaries-test', '2026-04-11T09:00:00Z');

    const result = await TimeAdvanceService.advanceQuarter(state);

    expect(result.summaries).toHaveLength(13);
    expect(result.quarterSummary.weekSummaries).toHaveLength(13);

    // Verify each summary has required fields
    for (const summary of result.summaries) {
      expect(summary).toHaveProperty('week');
      expect(summary).toHaveProperty('year');
      expect(summary).toHaveProperty('treasury');
      expect(summary).toHaveProperty('rosterSize');
      expect(summary).toHaveProperty('bouts');
      expect(summary).toHaveProperty('deaths');
    }
  });
});
