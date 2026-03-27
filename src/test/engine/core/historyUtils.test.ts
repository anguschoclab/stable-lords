import { describe, it, expect } from 'vitest';
import {
  getFightsForWeek,
  getRecentFights,
  getRecentFightsForWarrior,
  getAllFightsForWarrior,
  getFightsForTournament
} from '@/engine/core/historyUtils';
import { type FightSummary } from '@/types/game';

const mockFight = (overrides: Partial<FightSummary> = {}): FightSummary => ({
  id: 'f-' + Math.random(),
  week: 1,
  title: 'Test Fight',
  a: 'Warrior A',
  d: 'Warrior B',
  winner: 'A',
  by: 'KO',
  styleA: 'Slasher',
  styleD: 'Striker',
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe('historyUtils', () => {
  const history: FightSummary[] = [
    mockFight({ id: 'f1', week: 1, a: 'W1', d: 'W2' }),
    mockFight({ id: 'f2', week: 1, a: 'W3', d: 'W4' }),
    mockFight({ id: 'f3', week: 2, a: 'W1', d: 'W3', tournamentId: 't1' }),
    mockFight({ id: 'f4', week: 2, a: 'W2', d: 'W4', tournamentId: 't1' }),
    mockFight({ id: 'f5', week: 3, a: 'W1', d: 'W4' }),
  ];

  describe('getFightsForWeek', () => {
    it('returns empty array if history is empty', () => {
      expect(getFightsForWeek([], 1)).toEqual([]);
    });

    it('returns fights for a specific week in chronological order', () => {
      const result = getFightsForWeek(history, 2);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('f3');
      expect(result[1].id).toBe('f4');
    });

    it('returns empty array if no fights for that week', () => {
      expect(getFightsForWeek(history, 4)).toEqual([]);
    });

    it('breaks early when reaching earlier weeks (optimized)', () => {
      // This is more of a behavior test, but we can verify it still returns correct data
      const result = getFightsForWeek(history, 1);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('f1');
      expect(result[1].id).toBe('f2');
    });
  });

  describe('getRecentFights', () => {
    it('returns fights starting from minWeek', () => {
      const result = getRecentFights(history, 2);
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('f3');
      expect(result[1].id).toBe('f4');
      expect(result[2].id).toBe('f5');
    });

    it('returns empty array if all fights are before minWeek', () => {
      expect(getRecentFights(history, 10)).toEqual([]);
    });
  });

  describe('getRecentFightsForWarrior', () => {
    it('returns the most recent fights for a warrior up to a limit', () => {
      const result = getRecentFightsForWarrior(history, 'W1', 2);
      expect(result).toHaveLength(2);
      // Recent means chronological order in output, but we find them from the back.
      // f1 (w=1), f3 (w=2), f5 (w=3) are W1's fights.
      // From back: f5, f3, f1. Limit 2: f5, f3.
      // result.reverse() in the function makes it [f3, f5]
      expect(result[0].id).toBe('f3');
      expect(result[1].id).toBe('f5');
    });

    it('returns all fights if limit is higher than match count', () => {
      const result = getRecentFightsForWarrior(history, 'W1', 10);
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('f1');
      expect(result[1].id).toBe('f3');
      expect(result[2].id).toBe('f5');
    });
  });

  describe('getAllFightsForWarrior', () => {
    it('returns all fights for a specific warrior', () => {
      const result = getAllFightsForWarrior(history, 'W3');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('f2');
      expect(result[1].id).toBe('f3');
    });
  });

  describe('getFightsForTournament', () => {
    it('returns fights for a specific tournament', () => {
      const result = getFightsForTournament(history, 't1');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('f3');
      expect(result[1].id).toBe('f4');
    });

    it('returns empty array if tournament ID not found', () => {
      expect(getFightsForTournament(history, 't-nonexistent')).toEqual([]);
    });
  });
});
