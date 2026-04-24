import { describe, it, expect } from 'vitest';
import { createWeekBoutSummary, accumulateWeekStats } from '@/engine/bout/services/WeekStatsService';
import { BoutImpact } from '@/engine/bout/services/boutProcessorService';

describe('WeekStatsService', () => {
  describe('createWeekBoutSummary', () => {
    it('creates an empty initial summary', () => {
      const summary = createWeekBoutSummary();
      expect(summary).toEqual({
        bouts: 0,
        deaths: 0,
        injuries: 0,
        deathNames: [],
        injuryNames: [],
        hadPlayerDeath: false,
        hadRivalryEscalation: false,
      });
    });
  });

  describe('accumulateWeekStats', () => {
    it('accumulates empty bout stats correctly', () => {
      const summary = createWeekBoutSummary();
      const impact: BoutImpact = {
        stateUpdates: {},
        logs: [],
        pbp: [],
        stats: {
          death: false,
          deathNames: [],
          injured: false,
          injuredNames: [],
          playerDeath: false,
        },
      };

      accumulateWeekStats(summary, impact);
      expect(summary.bouts).toBe(1);
      expect(summary.deaths).toBe(0);
      expect(summary.injuries).toBe(0);
    });

    it('accumulates death and injury stats correctly', () => {
      const summary = createWeekBoutSummary();
      const impact: BoutImpact = {
        stateUpdates: {},
        logs: [],
        pbp: [],
        stats: {
          death: true,
          deathNames: ['Bob'],
          injured: true,
          injuredNames: ['Alice'],
          playerDeath: true,
        },
      };

      accumulateWeekStats(summary, impact);
      expect(summary.bouts).toBe(1);
      expect(summary.deaths).toBe(1);
      expect(summary.deathNames).toEqual(['Bob']);
      expect(summary.injuries).toBe(1);
      expect(summary.injuryNames).toEqual(['Alice']);
      expect(summary.hadPlayerDeath).toBe(true);
    });

    it('accumulates multiple bout impacts correctly', () => {
      const summary = createWeekBoutSummary();
      const impact1: BoutImpact = {
        stateUpdates: {},
        logs: [],
        pbp: [],
        stats: {
          death: true,
          deathNames: ['Bob'],
          injured: false,
          injuredNames: [],
          playerDeath: false,
        },
      };
      const impact2: BoutImpact = {
        stateUpdates: {},
        logs: [],
        pbp: [],
        stats: {
          death: false,
          deathNames: [],
          injured: true,
          injuredNames: ['Alice', 'Charlie'],
          playerDeath: false,
        },
      };

      accumulateWeekStats(summary, impact1);
      accumulateWeekStats(summary, impact2);

      expect(summary.bouts).toBe(2);
      expect(summary.deaths).toBe(1);
      expect(summary.deathNames).toEqual(['Bob']);
      expect(summary.injuries).toBe(2);
      expect(summary.injuryNames).toEqual(['Alice', 'Charlie']);
      expect(summary.hadPlayerDeath).toBe(false);
    });
  });
});
