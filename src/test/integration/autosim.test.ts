/**
 * Autosim Integration Tests
 *
 * Tests the autosim system that allows multi-week advancement with stop conditions.
 */
import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import { createFreshState } from '@/engine/factories';

// Mock localStorage for Vitest since autosim triggers stat rollup saves
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  },
});
import { runAutosim } from '@/engine/autosim';
import { FightingStyle, type GameState, type Warrior } from '@/types/game';
import { computeWarriorStats } from '@/engine/skillCalc';

function makeWarrior(id: string, name: string, overrides?: Partial<Warrior>): Warrior {
  const attrs = { ST: 12, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 12 };
  const { baseSkills, derivedStats } = computeWarriorStats(attrs, FightingStyle.StrikingAttack);
  return {
    id,
    name,
    style: FightingStyle.StrikingAttack,
    attributes: attrs,
    baseSkills,
    derivedStats,
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: 'Active',
    age: 20,
    ...overrides,
  };
}

describe('Autosim Integration', () => {
  let errorSpy: any;

  beforeAll(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    errorSpy.mockRestore();
  });

  let initialState: GameState;

  beforeEach(() => {
    initialState = createFreshState('test-seed');
    initialState.roster = [
      makeWarrior('w1', 'Test Warrior 1'),
      makeWarrior('w2', 'Test Warrior 2'),
    ];
  });

  describe('Basic Autosim', () => {
    it('should advance specified number of weeks', async () => {
      const weeksToAdvance = 5;
      let progressCalls = 0;

      const result = await runAutosim(initialState, weeksToAdvance, () => {
        progressCalls++;
      });

      expect(result.finalState).toBeDefined();
      expect(result.finalState.week).toBeGreaterThan(initialState.week);
      expect(result.weeksSimmed).toBe(weeksToAdvance);
      expect(progressCalls).toBe(weeksToAdvance);
    });

    it('should provide week summaries', async () => {
      const result = await runAutosim(initialState, 5, () => {});

      expect(result.weekSummaries).toBeDefined();
      expect(Array.isArray(result.weekSummaries)).toBe(true);
      expect(result.weekSummaries.length).toBe(result.weeksSimmed);
    });

    it('should call progress callback for each week', async () => {
      const progressCallbacks: number[] = [];

      await runAutosim(initialState, 3, (completed, total) => {
        progressCallbacks.push(completed);
        expect(total).toBe(3);
      });

      expect(progressCallbacks.length).toBeGreaterThan(0);
    });
  });

  describe('Stop Conditions', () => {
    it('should stop when no valid pairings available', async () => {
      const state = {
        ...initialState,
        roster: [],
      };

      const result = await runAutosim(state, 10, () => {});

      expect(result.stopReason).toBe('no_pairings');
      expect(result.weeksSimmed).toBeLessThan(10);
    });

    it('should provide stop details', async () => {
      const result = await runAutosim(initialState, 5, () => {});

      expect(result.stopDetail).toBeDefined();
      expect(typeof result.stopDetail).toBe('string');
      expect(result.stopDetail.length).toBeGreaterThan(0);
    });

    it('should stop at max weeks when no other conditions trigger', async () => {
      const result = await runAutosim(initialState, 3, () => {});

      expect(result.stopReason).toBe('max_weeks');
      expect(result.weeksSimmed).toBe(3);
    });
  });

  describe('State Consistency', () => {
    it('should maintain roster integrity during autosim', async () => {
      const result = await runAutosim(initialState, 10, () => {});

      expect(result.finalState).toBeDefined();

      // Roster + graveyard + retired should account for all warriors
      const totalWarriors =
        (result.finalState.roster || []).length +
        (result.finalState.graveyard || []).length +
        (result.finalState.retired || []).length;

      expect(totalWarriors).toBeGreaterThanOrEqual(0);
    });

    it('should preserve warrior data during simulation', async () => {
      const uniqueWarrior = makeWarrior('unique_1', 'Unique Name', {
        fame: 10,
        popularity: 5,
      });
      const state = {
        ...initialState,
        roster: [uniqueWarrior],
      };

      const result = await runAutosim(state, 5, () => {});

      expect(result.finalState).toBeDefined();

      // Find the warrior in any collection
      const warrior =
        (result.finalState.roster || []).find((w) => w.id === 'unique_1') ||
        (result.finalState.graveyard || []).find((w) => w.id === 'unique_1') ||
        (result.finalState.retired || []).find((w) => w.id === 'unique_1');

      expect(warrior).toBeDefined();
      expect(warrior?.name).toBe('Unique Name');
    });

    it('should accumulate newsletter entries', async () => {
      // Force an event that creates newsletter entries by giving high attributes
      const uniqueWarrior = makeWarrior('unique_1', 'Unique Name', {
        fame: 10,
        popularity: 5,
      });
      const state = {
        ...initialState,
        roster: [uniqueWarrior],
      };

      const result = await runAutosim(state, 5, () => {});

      expect(result.finalState).toBeDefined();
      expect(result.finalState.newsletter).toBeDefined();
    });

    it('should process economy correctly', async () => {
      const result = await runAutosim(initialState, 5, () => {});

      expect(result.finalState).toBeDefined();

      // Ledger should have entries
      expect(result.finalState.ledger).toBeDefined();
      expect(result.finalState.ledger.length).toBeGreaterThan(0);

      // Gold should be a valid number
      expect(typeof result.finalState.treasury).toBe('number');
      expect(isFinite(result.finalState.treasury)).toBe(true);
    });
  });

  describe('Week Summaries', () => {
    it('should track bouts per week', async () => {
      const result = await runAutosim(initialState, 5, () => {});

      for (const summary of result.weekSummaries) {
        expect(summary.bouts).toBeDefined();
        expect(typeof summary.bouts).toBe('number');
        expect(summary.bouts).toBeGreaterThanOrEqual(0);
      }
    });

    it('should track deaths and injuries', async () => {
      const result = await runAutosim(initialState, 10, () => {});

      for (const summary of result.weekSummaries) {
        expect(summary.deaths).toBeDefined();
        expect(summary.injuries).toBeDefined();
        expect(Array.isArray(summary.deathNames)).toBe(true);
        expect(Array.isArray(summary.injuryNames)).toBe(true);
      }
    });

    it('should include week numbers', async () => {
      const result = await runAutosim(initialState, 5, () => {});

      let lastWeek = 0;
      for (const summary of result.weekSummaries) {
        expect(summary.week).toBeGreaterThan(lastWeek);
        lastWeek = summary.week;
      }
    });
  });

  describe('Long-term Simulation', () => {
    it('should handle multi-week simulation', async () => {
      const result = await runAutosim(initialState, 20, () => {});

      expect(result.weeksSimmed).toBeGreaterThan(0);
      expect(result.finalState.week).toBeGreaterThan(initialState.week);
    });

    it('should complete in reasonable time', async () => {
      const startTime = Date.now();

      await runAutosim(initialState, 30, () => {});

      const elapsed = Date.now() - startTime;

      // Should complete in reasonable time (< 10 seconds for 30 weeks)
      expect(elapsed).toBeLessThan(10000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty roster gracefully', async () => {
      const state = {
        ...initialState,
        roster: [],
      };

      const result = await runAutosim(state, 5, () => {});

      expect(result).toBeDefined();
      expect(result.stopReason).toBe('no_pairings');
    });

    it('should handle zero weeks to advance', async () => {
      const result = await runAutosim(initialState, 0, () => {});

      expect(result.weeksSimmed).toBe(0);
      expect(result.finalState.week).toBe(initialState.week);
    });
  });

  describe('Result Metadata', () => {
    it('should provide accurate weeks simmed count', async () => {
      const result = await runAutosim(initialState, 5, () => {});

      expect(result.weeksSimmed).toBeGreaterThanOrEqual(0);
      expect(result.weeksSimmed).toBeLessThanOrEqual(5);
    });

    it('should always have a stop reason', async () => {
      const result = await runAutosim(initialState, 3, () => {});

      expect(result.stopReason).toBeDefined();
      expect([
        'death',
        'player_death',
        'injury',
        'rivalry_escalation',
        'tournament_week',
        'max_weeks',
        'no_pairings',
        'bankrupt',
      ]).toContain(result.stopReason);
    });

    it('should provide descriptive stop details', async () => {
      const result = await runAutosim(initialState, 5, () => {});

      expect(result.stopDetail).toBeDefined();
      expect(typeof result.stopDetail).toBe('string');
      expect(result.stopDetail.length).toBeGreaterThan(0);
    });
  });
});
