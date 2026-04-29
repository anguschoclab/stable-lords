import { describe, it, expect, vi } from 'vitest';
import { calculateXP, applyXP } from '@/engine/progression';
import type { Warrior } from '@/types/warrior.types';
import type { FightOutcome } from '@/types/combat.types';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';

describe('Warrior Progression', () => {
  describe('calculateXP', () => {
    it('grants 2 XP for a win', () => {
      const outcome = { winner: 'A', by: 'KO', minutes: 5 } as FightOutcome;
      expect(calculateXP(outcome, 'A', [])).toBe(2);
    });

    it('grants 1 XP for a loss', () => {
      const outcome = { winner: 'D', by: 'KO', minutes: 5 } as FightOutcome;
      expect(calculateXP(outcome, 'A', [])).toBe(1);
    });

    it('grants 1 XP for a draw', () => {
      const outcome = { winner: null, by: 'Draw', minutes: 5 } as FightOutcome;
      expect(calculateXP(outcome, 'A', [])).toBe(1);
    });

    it('grants bonus XP for a kill if the warrior won', () => {
      const outcome = { winner: 'A', by: 'Kill', minutes: 5 } as FightOutcome;
      expect(calculateXP(outcome, 'A', [])).toBe(3); // 2 (win) + 1 (kill)
    });

    it('does not grant bonus XP for a kill if the warrior lost', () => {
      const outcome = { winner: 'D', by: 'Kill', minutes: 5 } as FightOutcome;
      expect(calculateXP(outcome, 'A', [])).toBe(1); // 1 (loss)
    });

    it('grants bonus XP for Flashy tag', () => {
      const outcome = { winner: 'D', by: 'KO', minutes: 5 } as FightOutcome;
      expect(calculateXP(outcome, 'A', ['Flashy'])).toBe(2); // 1 (loss) + 1 (flashy)
    });

    it('grants bonus XP for Comeback tag if the warrior won', () => {
      const outcome = { winner: 'A', by: 'KO', minutes: 5 } as FightOutcome;
      expect(calculateXP(outcome, 'A', ['Comeback'])).toBe(3); // 2 (win) + 1 (comeback)
    });

    it('does not grant bonus XP for Comeback tag if the warrior lost', () => {
      const outcome = { winner: 'D', by: 'KO', minutes: 5 } as FightOutcome;
      expect(calculateXP(outcome, 'A', ['Comeback'])).toBe(1); // 1 (loss)
    });

    it('combines multiple bonuses', () => {
      const outcome = { winner: 'A', by: 'Kill', minutes: 5 } as FightOutcome;
      expect(calculateXP(outcome, 'A', ['Flashy', 'Comeback'])).toBe(5); // 2 (win) + 1 (kill) + 1 (flashy) + 1 (comeback)
    });
  });

  describe('applyXP', () => {
    const mockWarrior = (): Warrior => ({
      id: 'w1',
      name: 'Test Warrior',
      xp: 0,
      attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
      potential: { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 },
      potentialRevealed: {},
      style: 'AIMED BLOW',
      derivedStats: {} as any,
    } as Warrior);

    it('adds XP without leveling up', () => {
      const warrior = mockWarrior();
      const rng = new SeededRNGService(1); // deterministic RNG
      const { warrior: updated, gain } = applyXP(warrior, 3, rng);

      expect(updated.xp).toBe(3);
      expect(gain.levelUp).toBe(false);
      expect(gain.improvement).toBeUndefined();
    });

    it('levels up when XP crosses a 5-point threshold', () => {
      const warrior = mockWarrior();
      warrior.xp = 4;
      const rng = {
        next: () => 0.5,
        pick: (arr: any[]) => arr[0],
      } as any;

      const { warrior: updated, gain } = applyXP(warrior, 2, rng); // Total 6 XP

      expect(updated.xp).toBe(6);
      expect(gain.levelUp).toBe(true);
      expect(gain.improvement).toBeDefined();

      // Since all potentials are 15, attributes should be capable of growing
      const totalAttrs = Object.values(updated.attributes).reduce((sum, val) => sum + val, 0);
      expect(totalAttrs).toBe(71); // 70 (initial) + 1
    });

    it('does not improve attributes if all are at their potential ceiling', () => {
      const warrior = mockWarrior();
      warrior.xp = 4;
      // Set potential to match current attributes (sum = 70, which is < TOTAL_ATTR_CAP)
      warrior.potential = { ...warrior.attributes } as any;

      const rng = {
        next: () => 0.5,
        pick: (arr: any[]) => arr[0],
      } as any;

      const { warrior: updated, gain } = applyXP(warrior, 2, rng);

      expect(updated.xp).toBe(6);
      expect(gain.levelUp).toBe(true);
      expect(gain.improvement).toBeUndefined(); // No attribute improved

      const totalAttrs = Object.values(updated.attributes).reduce((sum, val) => sum + val, 0);
      expect(totalAttrs).toBe(70); // No growth
    });

    it('does not improve attributes if total exceeds TOTAL_ATTR_CAP (80)', () => {
      const warrior = mockWarrior();
      warrior.xp = 4;
      // Total attributes: 80
      warrior.attributes = { ST: 12, CN: 12, SZ: 12, WT: 12, WL: 11, SP: 11, DF: 10 };
      warrior.potential = { ST: 20, CN: 20, SZ: 20, WT: 20, WL: 20, SP: 20, DF: 20 };

      const rng = {
        next: () => 0.5,
        pick: (arr: any[]) => arr[0],
      } as any;

      const { warrior: updated, gain } = applyXP(warrior, 2, rng);

      expect(updated.xp).toBe(6);
      expect(gain.levelUp).toBe(true);
      expect(gain.improvement).toBeUndefined(); // Hit total cap

      const totalAttrs = Object.values(updated.attributes).reduce((sum, val) => sum + val, 0);
      expect(totalAttrs).toBe(80); // Unchanged
    });

    it('reveals potential based on probability', () => {
      const warrior = mockWarrior();
      // Force rng to trigger potential reveal (< 0.15)
      const rng = {
        next: () => 0.1, // 0.1 < 0.15, triggers reveal
        pick: (arr: any[]) => 'ST', // always pick ST
      } as any;

      const { warrior: updated, gain } = applyXP(warrior, 1, rng);

      expect(updated.potentialRevealed?.ST).toBe(true);
      expect(gain.potentialRevealed).toBe('ST');
    });

    it('does not reveal potential if rng roll is high', () => {
      const warrior = mockWarrior();
      const rng = {
        next: () => 0.9, // 0.9 > 0.15, no reveal
        pick: (arr: any[]) => 'ST',
      } as any;

      const { warrior: updated, gain } = applyXP(warrior, 1, rng);

      expect(Object.keys(updated.potentialRevealed || {}).length).toBe(0);
      expect(gain.potentialRevealed).toBeUndefined();
    });
  });
});
