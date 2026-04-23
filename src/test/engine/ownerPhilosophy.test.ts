import { describe, it, expect } from 'vitest';
import { evolvePhilosophies } from '@/engine/ownerPhilosophy';

describe('ownerPhilosophy - evolvePhilosophies', () => {
  const mockState: any = {
    week: 14,
    season: 'Spring',
    arenaHistory: [
      {
        id: 'f1',
        week: 1,
        a: 'W1',
        d: 'W2',
        warriorIdA: 'w1',
        warriorIdD: 'w2',
        styleA: 'Brawler',
        styleD: 'Brawler',
        winner: 'D',
      },
      {
        id: 'f2',
        week: 2,
        a: 'W1',
        d: 'W3',
        warriorIdA: 'w1',
        warriorIdD: 'w3',
        styleA: 'Brawler',
        styleD: 'Brawler',
        winner: 'D',
      },
      {
        id: 'f3',
        week: 3,
        a: 'W1',
        d: 'W4',
        warriorIdA: 'w1',
        warriorIdD: 'w4',
        styleA: 'Brawler',
        styleD: 'Brawler',
        winner: 'D',
      },
      {
        id: 'f4',
        week: 4,
        a: 'W1',
        d: 'W5',
        warriorIdA: 'w1',
        warriorIdD: 'w5',
        styleA: 'Brawler',
        styleD: 'Brawler',
        winner: 'D',
      },
    ],
    rivals: [
      {
        owner: {
          id: 'o1',
          personality: 'Methodical',
          metaAdaptation: 'Opportunist',
          stableName: 'Stab',
        },
        roster: [{ name: 'W1', status: 'Active' }],
        philosophy: 'Brute Force',
      },
    ],
  };

  it('should evolve philosophy on season change if performance is poor', () => {
    const { updatedRivals, gazetteItems } = evolvePhilosophies(mockState, 'Summer');

    expect(updatedRivals[0].philosophy).not.toBe('Brute Force');
    expect(gazetteItems[0]).toContain('shifts strategy');
  });

  it('should double down (no change) on season change if winning', () => {
    const winningState = {
      ...mockState,
      arenaHistory: mockState.arenaHistory.map((f: any) => ({ ...f, winner: 'A' })),
    };
    const { updatedRivals, gazetteItems } = evolvePhilosophies(winningState as any, 'Summer');

    expect(updatedRivals[0].philosophy).toBe('Brute Force');
    expect(gazetteItems.length).toBe(0);
  });
});
