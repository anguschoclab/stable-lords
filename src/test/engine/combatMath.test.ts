import { describe, it, expect, vi } from "vitest";
import { skillCheck } from "@/engine/combat/combatMath";

describe("combatMath engine", () => {
  describe("skillCheck", () => {
    it("auto-succeeds on a natural 1 (rng = 0), regardless of low skill", () => {
      const rng = vi.fn().mockReturnValue(0.0); // Math.floor(0 * 20) + 1 = 1
      const result = skillCheck(rng, -10); // Very low skill
      expect(result).toBe(true);
      expect(rng).toHaveBeenCalledTimes(1);
    });

    it("auto-fails on a natural 20 (rng = 0.99), regardless of high skill", () => {
      const rng = vi.fn().mockReturnValue(0.99); // Math.floor(0.99 * 20) + 1 = 20
      const result = skillCheck(rng, 100); // Very high skill
      expect(result).toBe(false);
      expect(rng).toHaveBeenCalledTimes(1);
    });

    it("succeeds when roll is <= target", () => {
      const rng = vi.fn().mockReturnValue(0.45); // Math.floor(0.45 * 20) + 1 = 10
      const result = skillCheck(rng, 12); // target = 12
      expect(result).toBe(true);
    });

    it("fails when roll is > target", () => {
      const rng = vi.fn().mockReturnValue(0.45); // Math.floor(0.45 * 20) + 1 = 10
      const result = skillCheck(rng, 8); // target = 8
      expect(result).toBe(false);
    });

    it("clamps target between 1 and 19", () => {
      // Test target clamping upper bound
      const rngUpper = vi.fn().mockReturnValue(0.94); // Math.floor(0.94 * 20) + 1 = 19
      const resultUpper = skillCheck(rngUpper, 100); // Target clamped to 19, roll 19 <= 19 -> true
      expect(resultUpper).toBe(true);

      // Test target clamping lower bound
      const rngLower = vi.fn().mockReturnValue(0.06); // Math.floor(0.06 * 20) + 1 = 2
      const resultLower = skillCheck(rngLower, -10); // Target clamped to 1, roll 2 <= 1 -> false
      expect(resultLower).toBe(false);
    });

    it("incorporates modifier correctly", () => {
      const rng = vi.fn().mockReturnValue(0.45); // Math.floor(0.45 * 20) + 1 = 10

      // Skill 8, Modifier 2 -> target 10. Roll 10 <= 10 -> true
      const resultSuccess = skillCheck(rng, 8, 2);
      expect(resultSuccess).toBe(true);

      // Skill 12, Modifier -3 -> target 9. Roll 10 <= 9 -> false
      const resultFailure = skillCheck(rng, 12, -3);
      expect(resultFailure).toBe(false);
    });

    it("handles fractional skill levels by flooring", () => {
       const rng = vi.fn().mockReturnValue(0.45); // Roll 10

       // Skill 10.9 -> Floored to 10. Roll 10 <= 10 -> true
       expect(skillCheck(rng, 10.9)).toBe(true);

       // Skill 9.9 -> Floored to 9. Roll 10 <= 9 -> false
       expect(skillCheck(rng, 9.9)).toBe(false);
    });
  });
});
