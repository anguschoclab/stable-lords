import { describe, it, expect } from "vitest";
import { enduranceCost, fatiguePenalty } from "@/engine/combat/mechanics/combatFatigue";

describe("combatFatigue engine", () => {
  describe("fatiguePenalty", () => {
    it("returns 0 penalty when endurance is high (> 45%)", () => {
      expect(fatiguePenalty(100, 100)).toBe(0); // 100%
      expect(fatiguePenalty(46, 100)).toBe(0);  // 46%
    });

    it("returns -4 moderate penalty when endurance is <= 45% and > 25%", () => {
      expect(fatiguePenalty(45, 100)).toBe(-4); // 45%
      expect(fatiguePenalty(26, 100)).toBe(-4); // 26%
    });

    it("returns -8 heavy penalty when endurance is <= 25%", () => {
      expect(fatiguePenalty(25, 100)).toBe(-8); // 25%
      expect(fatiguePenalty(0, 100)).toBe(-8);  // 0%
    });

    it("handles zero or negative maxEndurance gracefully (div by zero prevention)", () => {
      // ratio = endurance / Math.max(1, maxEndurance)
      // endurance 0, max 0 => 0 / 1 => 0 => -8 heavy penalty
      expect(fatiguePenalty(0, 0)).toBe(-8);
      // endurance 1, max 0 => 1 / 1 => 1 => 0 penalty
      expect(fatiguePenalty(1, 0)).toBe(0);
      // endurance 0, max -10 => 0 / 1 => 0 => -8 heavy penalty
      expect(fatiguePenalty(0, -10)).toBe(-8);
    });
  });

  describe("enduranceCost", () => {
    it("calculates cost based on OE (0.10) and AL (0.05) and floors the result", () => {
      // 10 * 0.10 + 10 * 0.05 = 1.0 + 0.5 = 1.5 -> floor = 1
      expect(enduranceCost(10, 10)).toBe(1);

      // 5 * 0.10 + 5 * 0.05 = 0.5 + 0.25 = 0.75 -> floor = 0
      expect(enduranceCost(5, 5)).toBe(0);

      // 8 * 0.10 + 8 * 0.05 = 0.8 + 0.4 = 1.2 -> floor = 1
      expect(enduranceCost(8, 8)).toBe(1);
    });

    it("returns 0 if inputs are 0", () => {
      expect(enduranceCost(0, 0)).toBe(0);
    });
  });
});
