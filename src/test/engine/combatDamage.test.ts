import { describe, it, expect, vi } from "vitest";
import {
  protectCovers,
  rollHitLocation,
  applyProtectMod,
  computeHitDamage,
  HIT_LOCATIONS,
  type HitLocation
} from "@/engine/combat/combatDamage";

describe("combatDamage engine", () => {
  describe("protectCovers", () => {
    it("returns empty array for no protection", () => {
      expect(protectCovers()).toEqual([]);
      expect(protectCovers("none_armor")).toEqual([]);
    });

    it("returns chest and abdomen for body armor", () => {
      const bodyArmors = ["leather_armor", "chainmail", "platemail"];
      bodyArmors.forEach(armor => {
        expect(protectCovers(armor)).toEqual(["chest", "abdomen"]);
      });
    });

    it("returns head for head protection", () => {
      const headArmors = ["leather_cap", "steel_cap", "helm", "full_helm"];
      headArmors.forEach(armor => {
        expect(protectCovers(armor)).toEqual(["head"]);
      });
    });

    it("returns empty array for unknown protection", () => {
      expect(protectCovers("unknown")).toEqual([]);
    });
  });

  describe("rollHitLocation", () => {
    it("returns target if rng < TARGET_HIT_CHANCE", () => {
      const rng = vi.fn().mockReturnValue(0.5); // < 0.6
      const result = rollHitLocation(rng, "head");
      expect(result).toBe("head");
      expect(rng).toHaveBeenCalledTimes(1);
    });

    it("ignores target 'any'", () => {
      const rng = vi.fn().mockReturnValue(0.1);
      // If it didn't ignore "any", it would return "any" (which is not a HitLocation)
      // but the logic skips the target check if target === "any"
      const result = rollHitLocation(rng, "any");
      expect(HIT_LOCATIONS).toContain(result);
    });

    it("falls through to random when targeted hit fails (rng >= 0.6)", () => {
      // First call for target check: 0.7 (fail)
      // Second call for exposed location check: 0.4 (fail)
      // Third call for random location index: 0
      const rng = vi.fn()
        .mockReturnValueOnce(0.7)
        .mockReturnValueOnce(0.4)
        .mockReturnValueOnce(0);

      const result = rollHitLocation(rng, "head");
      expect(result).toBe(HIT_LOCATIONS[0]);
    });

    it("prefers exposed locations when rng < 0.3 after missing target", () => {
      // Target: head
      // Protect: helm (covers head)
      // Exposed: everything except head

      // 1. Target check: 0.7 (fail)
      // 2. Exposed check: 0.2 (success)
      // 3. Exposed index: 0
      const rng = vi.fn()
        .mockReturnValueOnce(0.7)
        .mockReturnValueOnce(0.2)
        .mockReturnValueOnce(0);

      const result = rollHitLocation(rng, "head", "helm");
      const covered = protectCovers("helm");
      const exposed = HIT_LOCATIONS.filter(l => !covered.includes(l));

      expect(result).toBe(exposed[0]);
      expect(covered).toContain("head");
      expect(result).not.toBe("head");
    });

    it("falls back to completely random if no target and rng >= 0.3 for exposed", () => {
       // 1. Exposed check: 0.4 (fail)
       // 2. Random index: 0
       const rng = vi.fn()
        .mockReturnValueOnce(0.4)
        .mockReturnValueOnce(0);

       const result = rollHitLocation(rng);
       expect(result).toBe(HIT_LOCATIONS[0]);
    });
  });

  describe("applyProtectMod", () => {
    it("applies penalty if no protection is provided", () => {
      // 100 * 1.1 = 110
      expect(applyProtectMod(100, "head")).toBe(110);
      expect(applyProtectMod(100, "chest", undefined)).toBe(110);
    });

    it("applies penalty if protection is 'none_armor'", () => {
      // 100 * 1.1 = 110
      expect(applyProtectMod(100, "head", "none_armor")).toBe(110);
    });

    it("applies reduction if location is covered by protection", () => {
      // leather_armor covers chest and abdomen
      // 100 * 0.75 = 75
      expect(applyProtectMod(100, "chest", "leather_armor")).toBe(75);
      expect(applyProtectMod(100, "abdomen", "platemail")).toBe(75);

      // helm covers head
      expect(applyProtectMod(100, "head", "helm")).toBe(75);
    });

    it("applies penalty if location is NOT covered by protection", () => {
      // leather_armor does NOT cover head or arms
      // 100 * 1.1 = 110
      expect(applyProtectMod(100, "head", "leather_armor")).toBe(110);
      expect(applyProtectMod(100, "right arm", "chainmail")).toBe(110);

      // helm does NOT cover chest
      expect(applyProtectMod(100, "chest", "helm")).toBe(110);
    });

    it("correctly applies Math.floor to ensure integer damage values", () => {
      // Reduction: 10 * 0.75 = 7.5 -> Math.floor -> 7
      expect(applyProtectMod(10, "chest", "leather_armor")).toBe(7);

      // Penalty: 11 * 1.1 = 12.1 -> Math.floor -> 12
      expect(applyProtectMod(11, "head", "leather_armor")).toBe(12);

      // Penalty with no armor: 15 * 1.1 = 16.5 -> Math.floor -> 16
      expect(applyProtectMod(15, "right leg")).toBe(16);
    });

    it("handles zero damage correctly", () => {
      expect(applyProtectMod(0, "head")).toBe(0);
      expect(applyProtectMod(0, "chest", "leather_armor")).toBe(0);
    });

    it("handles negative damage correctly (though rare in engine)", () => {
      // -10 * 1.1 = -11
      expect(applyProtectMod(-10, "head")).toBe(-11);
      // -10 * 0.75 = -7.5 -> Math.floor -> -8
      expect(applyProtectMod(-10, "chest", "leather_armor")).toBe(-8);
    });
  });

  describe("computeHitDamage", () => {
    it("applies head multiplier", () => {
      const rng = vi.fn().mockReturnValue(0.5); // average variance (0.85 + 0.5 * 0.3 = 1.0)
      // base = 10 + 2 = 12
      // locMult = 1.5 (head)
      // damage = 12 * 1.5 * 1.0 = 18
      const result = computeHitDamage(rng, 10, "head");
      expect(result).toBe(18);
    });

    it("applies chest multiplier", () => {
      const rng = vi.fn().mockReturnValue(0.5);
      // base = 10 + 2 = 12
      // locMult = 1.2 (chest)
      // damage = 12 * 1.2 * 1.0 = 14.4 -> 14
      const result = computeHitDamage(rng, 10, "chest");
      expect(result).toBe(14);
    });

    it("applies abdomen multiplier", () => {
      const rng = vi.fn().mockReturnValue(0.5);
      // base = 10 + 2 = 12
      // locMult = 1.1 (abdomen)
      // damage = 12 * 1.1 * 1.0 = 13.2 -> 13
      const result = computeHitDamage(rng, 10, "abdomen");
      expect(result).toBe(13);
    });

    it("applies limb multiplier", () => {
      const rng = vi.fn().mockReturnValue(0.5);
      // base = 10 + 2 = 12
      // locMult = 1.0 (limb)
      // damage = 12 * 1.0 * 1.0 = 12
      const result = computeHitDamage(rng, 10, "right arm");
      expect(result).toBe(12);
    });

    it("respects variance range", () => {
      const baseClass = 10;
      const baseVal = 12; // 10 + 2

      const rngMin = vi.fn().mockReturnValue(0);
      const resMin = computeHitDamage(rngMin, baseClass, "right arm");
      // 12 * 1.0 * 0.85 = 10.2 -> 10
      expect(resMin).toBe(10);

      const rngMax = vi.fn().mockReturnValue(0.9999);
      const resMax = computeHitDamage(rngMax, baseClass, "right arm");
      // 12 * 1.0 * 1.15 = 13.8 -> 14
      expect(resMax).toBe(14);
    });

    it("minimum damage is 1", () => {
      const rng = vi.fn().mockReturnValue(0);
      const result = computeHitDamage(rng, -10, "right arm");
      // base = -10 + 2 = -8
      // even with negative base, min is 1
      expect(result).toBe(1);
    });
  });
});
