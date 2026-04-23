import { describe, it, expect } from 'vitest';
import {
  pickRivalOpponent,
  generateRivalryNarrative,
  calculateRivalryScore,
} from '@/engine/rivals/rivalUtils';
import type { RivalStableData, Warrior } from '@/types/state.types';

describe('rivalUtils', () => {
  const createMockWarrior = (
    id: string,
    status: 'Active' | 'Dead' | 'Injured' = 'Active'
  ): Warrior =>
    ({
      id,
      status,
      name: `Warrior ${id}`,
    }) as Warrior;

  const createMockStable = (id: string, roster: Warrior[]): RivalStableData =>
    ({
      id,
      name: `Stable ${id}`,
      roster,
    }) as RivalStableData;

  describe('pickRivalOpponent', () => {
    it('should return null if no rivals exist', () => {
      const result = pickRivalOpponent([], new Set());
      expect(result).toBeNull();
    });

    it('should return null if all rivals are excluded', () => {
      const rivals = [createMockStable('S1', [createMockWarrior('W1')])];
      const excludeIds = new Set(['W1']);

      const result = pickRivalOpponent(rivals, excludeIds);
      expect(result).toBeNull();
    });

    it('should return null if no active warriors exist', () => {
      const rivals = [
        createMockStable('S1', [
          createMockWarrior('W1', 'Dead'),
          createMockWarrior('W2', 'Injured'),
        ]),
      ];

      const result = pickRivalOpponent(rivals, new Set());
      expect(result).toBeNull();
    });

    it('should pick an active warrior not in the exclude list', () => {
      const w1 = createMockWarrior('W1', 'Active');
      const w2 = createMockWarrior('W2', 'Active');

      const rivals = [createMockStable('S1', [w1]), createMockStable('S2', [w2])];

      const excludeIds = new Set(['W1']);

      const result = pickRivalOpponent(rivals, excludeIds);

      expect(result).not.toBeNull();
      expect(result?.warrior.id).toBe('W2');
      expect(result?.rival.id).toBe('S2');
    });

    it('should be deterministic based on the provided seed', () => {
      const w1 = createMockWarrior('W1');
      const w2 = createMockWarrior('W2');
      const w3 = createMockWarrior('W3');

      const rivals = [createMockStable('S1', [w1, w2, w3])];

      const run1 = pickRivalOpponent(rivals, new Set(), 12345);
      const run2 = pickRivalOpponent(rivals, new Set(), 12345);
      const run3 = pickRivalOpponent(rivals, new Set(), 67890); // Different seed

      expect(run1).not.toBeNull();
      expect(run1?.warrior.id).toBe(run2?.warrior.id); // Same seed, same result
      // While it's possible run3 gives the same result by chance, we just want to ensure run1 === run2
    });
  });

  describe('generateRivalryNarrative', () => {
    it('should generate a narrative string containing stable and warrior names', () => {
      const stableA = 'Blood Hawks';
      const stableB = 'Iron Skulls';
      const warriorA = 'Grom';
      const warriorB = 'Thar';

      const narrative = generateRivalryNarrative(stableA, stableB, warriorA, warriorB);

      expect(narrative).toContain(stableA);
      expect(narrative).toContain(stableB);
      expect(narrative).toContain(warriorA);
      expect(narrative).toContain(warriorB);
    });

    it('should be deterministic based on the provided seed', () => {
      const stableA = 'Blood Hawks';
      const stableB = 'Iron Skulls';
      const warriorA = 'Grom';
      const warriorB = 'Thar';

      const narrative1 = generateRivalryNarrative(stableA, stableB, warriorA, warriorB, 111);
      const narrative2 = generateRivalryNarrative(stableA, stableB, warriorA, warriorB, 111);

      expect(narrative1).toBe(narrative2);
    });
  });

  describe('calculateRivalryScore', () => {
    it('should calculate correctly based on formula', () => {
      // Math.floor(7/3) + 1*5 + 2*3 = 2 + 5 + 6 = 13. Max is 5.
      expect(calculateRivalryScore(7, 1, 2)).toBe(5);
    });

    it('should not go below 1', () => {
      expect(calculateRivalryScore(0, 0, 0)).toBe(1);
      expect(calculateRivalryScore(2, 0, 0)).toBe(1); // 2/3 = 0, floor is 0 -> clamped to 1
    });

    it('should not exceed 5', () => {
      expect(calculateRivalryScore(30, 0, 0)).toBe(5);
      expect(calculateRivalryScore(0, 2, 0)).toBe(5);
      expect(calculateRivalryScore(0, 0, 2)).toBe(5);
    });

    it('should evaluate correctly in the middle range', () => {
      // 3/3 + 0 + 0 = 1, clamped to 1. Wait, max(1, 1) -> 1
      expect(calculateRivalryScore(3, 0, 0)).toBe(1);

      // 6/3 + 0 + 0 = 2
      expect(calculateRivalryScore(6, 0, 0)).toBe(2);

      // 0/3 + 0 + 1 = 3 -> 3
      expect(calculateRivalryScore(0, 0, 1)).toBe(3);
    });
  });
});
