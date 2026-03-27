
import { describe, it, expect, vi } from "vitest";
import { skillCheck, getPhase } from "@/engine/combat/combatMath";

describe("combatMath engine", () => {
  describe("skillCheck", () => {
    it("auto-succeeds on a natural 1 (rng = 0), regardless of low skill", () => {
      const rng = vi.fn().mockReturnValue(0.0);
      expect(skillCheck(rng, -10)).toBe(true);
    });
    it("auto-fails on a natural 20 (rng = 0.99), regardless of high skill", () => {
      const rng = vi.fn().mockReturnValue(0.99);
      expect(skillCheck(rng, 100)).toBe(false);
    });
    it("succeeds when roll is <= target", () => {
      const rng = vi.fn().mockReturnValue(0.45);
      expect(skillCheck(rng, 12)).toBe(true);
    });
    it("fails when roll is > target", () => {
      const rng = vi.fn().mockReturnValue(0.45);
      expect(skillCheck(rng, 8)).toBe(false);
    });
    it("clamps target between 1 and 19", () => {
      const rngUpper = vi.fn().mockReturnValue(0.94);
      expect(skillCheck(rngUpper, 100)).toBe(true);
      const rngLower = vi.fn().mockReturnValue(0.06);
      expect(skillCheck(rngLower, -10)).toBe(false);
    });
    it("incorporates modifier correctly", () => {
      const rng = vi.fn().mockReturnValue(0.45);
      expect(skillCheck(rng, 8, 2)).toBe(true);
      expect(skillCheck(rng, 12, -3)).toBe(false);
    });
    it("handles fractional skill levels by flooring", () => {
       const rng = vi.fn().mockReturnValue(0.45);
       expect(skillCheck(rng, 10.9)).toBe(true);
       expect(skillCheck(rng, 9.9)).toBe(false);
    });
  });

  describe("getPhase", () => {
    it("returns 'opening' when ratio is exactly the threshold (0.25)", () => {
      expect(getPhase(2.5, 10)).toBe("opening");
    });
    it("returns 'opening' when ratio is below the threshold (< 0.25)", () => {
      expect(getPhase(2, 10)).toBe("opening");
      expect(getPhase(0, 10)).toBe("opening");
    });
    it("returns 'mid' when ratio is exactly the mid threshold (0.65)", () => {
      expect(getPhase(6.5, 10)).toBe("mid");
    });
    it("returns 'mid' when ratio is between opening and mid thresholds", () => {
      expect(getPhase(3, 10)).toBe("mid");
      expect(getPhase(5, 10)).toBe("mid");
    });
    it("returns 'late' when ratio is above the mid threshold (> 0.65)", () => {
      expect(getPhase(7, 10)).toBe("late");
      expect(getPhase(10, 10)).toBe("late");
    });
  });
});
