import { describe, it, expect } from "vitest";
import { enduranceCost, fatiguePenalty } from "@/engine/combat/combatFatigue";

describe("combatFatigue engine", () => {
  describe("fatiguePenalty", () => {
    it("returns 0 penalty when endurance is high (> 55%)", () => {
      expect(fatiguePenalty(100, 100)).toBe(0); // 100%
      expect(fatiguePenalty(56, 100)).toBe(0);  // 56%
    });

    it("returns -2 moderate penalty when endurance is <= 55% and > 30%", () => {
      expect(fatiguePenalty(55, 100)).toBe(-2); // 55%
      expect(fatiguePenalty(31, 100)).toBe(-2); // 31%
    });

    it("returns -5 heavy penalty when endurance is <= 30%", () => {
      expect(fatiguePenalty(30, 100)).toBe(-5); // 30%
      expect(fatiguePenalty(0, 100)).toBe(-5);  // 0%
    });

    it("handles zero or negative maxEndurance gracefully (div by zero prevention)", () => {
      // ratio = endurance / Math.max(1, maxEndurance)
      // endurance 0, max 0 => 0 / 1 => 0 => -5 heavy penalty
      expect(fatiguePenalty(0, 0)).toBe(-5);
      // endurance 1, max 0 => 1 / 1 => 1 => 0 penalty
      expect(fatiguePenalty(1, 0)).toBe(0);
      // endurance 0, max -10 => 0 / 1 => 0 => -5 heavy penalty
      expect(fatiguePenalty(0, -10)).toBe(-5);
    });
  });

  describe("enduranceCost", () => {
    it("calculates cost based on OE (0.4) and AL (0.2) and floors the result", () => {
      // 10 * 0.4 + 10 * 0.2 = 4 + 2 = 6
      expect(enduranceCost(10, 10)).toBe(6);

      // 5 * 0.4 + 5 * 0.2 = 2 + 1 = 3
      expect(enduranceCost(5, 5)).toBe(3);

      // Floor check: 3 * 0.4 (1.2) + 2 * 0.2 (0.4) = 1.6 -> 1
      expect(enduranceCost(3, 2)).toBe(1);
    });

    it("returns 0 if inputs are 0", () => {
      expect(enduranceCost(0, 0)).toBe(0);
    });
  });
});
