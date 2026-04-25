import { describe, it, expect } from 'vitest';
import { runSeasonalPass } from '@/engine/pipeline/seasonal';
import type { GameState } from '@/types/state.types';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';

describe('runSeasonalPass', () => {
  it('should not do anything if nextWeek is not 1', () => {
    const impact = runSeasonalPass({ year: 1 } as GameState, 2);
    expect(impact).toEqual({});
  });

  // Adding basic coverage to make sure the seasonal pass doesn't crash
  it('should run offseason event when nextWeek is 1', () => {
    const state: Partial<GameState> = {
      year: 1,
      roster: [{ id: 'w1', name: 'Bob', status: 'Active', injuries: [] } as any],
    };

    const rng = new SeededRNGService(42);
    const impact = runSeasonalPass(state as GameState, 1, rng);

    // Impact should have some changes, let's just make sure it doesn't crash
    // and returns a state impact object.
    expect(impact).toBeDefined();
    // In our SeededRNGService, 42 will pick a specific event, we just want to know it didn't throw.
  });
});
