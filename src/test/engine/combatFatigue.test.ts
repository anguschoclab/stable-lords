import { describe, it, expect } from 'vitest';
import { enduranceCost, fatiguePenalty } from '@/engine/combat/mechanics/combatFatigue';

describe('combatFatigue engine', () => {
  describe('fatiguePenalty', () => {
    it('returns 0 penalty when endurance is high (> 45%)', () => {
      expect(fatiguePenalty(100, 100)).toBe(0); // 100%
      expect(fatiguePenalty(46, 100)).toBe(0); // 46%
    });

    it('returns -4 moderate penalty when endurance is <= 45% and > 25%', () => {
      expect(fatiguePenalty(45, 100)).toBe(-4); // 45%
      expect(fatiguePenalty(26, 100)).toBe(-4); // 26%
    });

    it('returns -8 heavy penalty when endurance is <= 25%', () => {
      expect(fatiguePenalty(25, 100)).toBe(-8); // 25%
      expect(fatiguePenalty(0, 100)).toBe(-8); // 0%
    });

    it('handles zero or negative maxEndurance gracefully (div by zero prevention)', () => {
      // ratio = endurance / Math.max(1, maxEndurance)
      // endurance 0, max 0 => 0 / 1 => 0 => -8 heavy penalty
      expect(fatiguePenalty(0, 0)).toBe(-8);
      // endurance 1, max 0 => 1 / 1 => 1 => 0 penalty
      expect(fatiguePenalty(1, 0)).toBe(0);
      // endurance 0, max -10 => 0 / 1 => 0 => -8 heavy penalty
      expect(fatiguePenalty(0, -10)).toBe(-8);
    });
  });

  describe('enduranceCost', () => {
    // Tuned 2026-04: scaling raised from 0.10/0.05 to 0.18/0.09, and the
    // internal Math.floor was removed so callers (applyEnduranceCosts) can
    // round once after all multipliers. Prior values + floor truncated most
    // OE/AL combos to 0 endurance/exchange — fatigue was effectively dead.
    it('calculates cost based on OE (0.18) + AL (0.09) without internal floor', () => {
      // 10 * 0.18 + 10 * 0.09 = 1.8 + 0.9 = 2.7
      expect(enduranceCost(10, 10)).toBeCloseTo(2.7);
      // 5 * 0.18 + 5 * 0.09 = 0.9 + 0.45 = 1.35 (was 0 under prior floor)
      expect(enduranceCost(5, 5)).toBeCloseTo(1.35);
      // 8 * 0.18 + 8 * 0.09 = 1.44 + 0.72 = 2.16
      expect(enduranceCost(8, 8)).toBeCloseTo(2.16);
    });

    it('returns 0 if inputs are 0', () => {
      expect(enduranceCost(0, 0)).toBe(0);
    });
  });
});
