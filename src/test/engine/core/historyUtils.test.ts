import { describe, it, expect } from 'vitest';
import { getRecentFightsForWarrior } from '@/engine/core/historyUtils';
import { FightingStyle, type FightSummary } from '@/types/game';

describe('getRecentFightsForWarrior', () => {
  const createMockFight = (overrides: Partial<FightSummary>): FightSummary => ({
    id: 'mock-id',
    a: overrides.warriorIdA ?? 'Attacker',
    d: overrides.warriorIdD ?? 'Defender',
    warriorIdA: 'Attacker',
    warriorIdD: 'Defender',
    winner: 'A',
    by: "KO",
    styleA: FightingStyle.StrikingAttack,
    styleD: FightingStyle.ParryRiposte,
    week: 1,
    createdAt: new Date().toISOString(),
    transcript: [],
    ...overrides,
  });

  it('returns empty array when history is empty', () => {
    const history: FightSummary[] = [];
    const result = getRecentFightsForWarrior(history, 'Hero');
    expect(result).toEqual([]);
  });

  it('returns empty array when warrior is not in history', () => {
    const history: FightSummary[] = [
      createMockFight({ warriorIdA: 'Alpha', warriorIdD: 'Beta' }),
      createMockFight({ warriorIdA: 'Gamma', warriorIdD: 'Delta' }),
    ];
    const result = getRecentFightsForWarrior(history, 'Hero');
    expect(result).toEqual([]);
  });

  it('finds fights where warrior is attacker', () => {
    const history: FightSummary[] = [
      createMockFight({ warriorIdA: 'Hero', warriorIdD: 'Beta', week: 1 }),
      createMockFight({ warriorIdA: 'Gamma', warriorIdD: 'Delta', week: 2 }),
      createMockFight({ warriorIdA: 'Hero', warriorIdD: 'Epsilon', week: 3 }),
    ];
    const result = getRecentFightsForWarrior(history, 'Hero');
    expect(result).toHaveLength(2);
    expect(result.map(f => f.week)).toEqual([1, 3]); // Expect chronological order
  });

  it('finds fights where warrior is defender', () => {
    const history: FightSummary[] = [
      createMockFight({ warriorIdA: 'Alpha', warriorIdD: 'Hero', week: 1 }),
      createMockFight({ warriorIdA: 'Gamma', warriorIdD: 'Delta', week: 2 }),
      createMockFight({ warriorIdA: 'Epsilon', warriorIdD: 'Hero', week: 3 }),
    ];
    const result = getRecentFightsForWarrior(history, 'Hero');
    expect(result).toHaveLength(2);
    expect(result.map(f => f.week)).toEqual([1, 3]);
  });

  it('finds fights where warrior is both attacker and defender across different fights', () => {
    const history: FightSummary[] = [
      createMockFight({ warriorIdA: 'Hero', warriorIdD: 'Alpha', week: 1 }),
      createMockFight({ warriorIdA: 'Beta', warriorIdD: 'Hero', week: 2 }),
      createMockFight({ warriorIdA: 'Gamma', warriorIdD: 'Delta', week: 3 }),
    ];
    const result = getRecentFightsForWarrior(history, 'Hero');
    expect(result).toHaveLength(2);
    expect(result.map(f => f.week)).toEqual([1, 2]);
  });

  it('limits the results and returns the most recent fights chronologically', () => {
    const history: FightSummary[] = [
      createMockFight({ warriorIdA: 'Hero', warriorIdD: 'A', week: 1 }),
      createMockFight({ warriorIdA: 'Hero', warriorIdD: 'B', week: 2 }),
      createMockFight({ warriorIdA: 'Hero', warriorIdD: 'C', week: 3 }),
      createMockFight({ warriorIdA: 'Hero', warriorIdD: 'D', week: 4 }),
      createMockFight({ warriorIdA: 'Hero', warriorIdD: 'E', week: 5 }),
    ];

    // Default limit is 10, passing an explicit limit of 3
    const result = getRecentFightsForWarrior(history, 'Hero', 3);

    expect(result).toHaveLength(3);
    // Should get weeks 3, 4, 5, returned in chronological order
    expect(result.map(f => f.week)).toEqual([3, 4, 5]);
  });

  it('uses the default limit of 10', () => {
    const history: FightSummary[] = Array.from({ length: 15 }).map((_, i) =>
      createMockFight({ warriorIdA: 'Hero', warriorIdD: `Opponent${i}`, week: i + 1 })
    );

    const result = getRecentFightsForWarrior(history, 'Hero');

    expect(result).toHaveLength(10);
    // Should get the last 10 weeks (weeks 6 through 15) in chronological order
    expect(result.map(f => f.week)).toEqual([6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
  });
});
