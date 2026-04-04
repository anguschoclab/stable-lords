import { describe, it, expect, vi } from "vitest";
import {
  generatePotential,
  canGrow,
  diminishingReturnsFactor,
  revealPotential,
  potentialRating,
  potentialGrade
} from "@/engine/potential";
import type { Attributes, AttributePotential } from "@/types/game";

describe("Potential System", () => {
  const mockAttrs: Attributes = {
    ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10
  };

  describe("generatePotential", () => {
    it("should generate potential correctly for Common tier", () => {
      // Common tier headroom is [2, 5]. For ST=10, potential should be between 12 and 15
      const rng = vi.fn().mockReturnValue(0.5); // (5 - 2 + 1) * 0.5 = Math.floor(2) = 2. Headroom = 2 + 2 = 4
      const potential = generatePotential(mockAttrs, "Common", rng);

      expect(potential.ST).toBe(14); // 10 + 4
      expect(potential.CN).toBe(14);
    });

    it("should enforce the POTENTIAL_ABSOLUTE_MAX (25) boundary", () => {
      // If a warrior has somehow very high initial stats and tier
      const highAttrs: Attributes = {
        ST: 24, CN: 24, SZ: 24, WT: 24, WL: 24, SP: 24, DF: 24
      };
      const rng = vi.fn().mockReturnValue(0.99); // max out the headroom (Prodigy = 12)
      const potential = generatePotential(highAttrs, "Prodigy", rng);

      // Should be clamped to 25
      expect(potential.ST).toBe(25);
    });

    it("should gracefully handle potential > 100 scenario by clamping to MAX", () => {
      const veryHighAttrs: Attributes = {
        ST: 120, CN: 120, SZ: 120, WT: 120, WL: 120, SP: 120, DF: 120
      };
      const rng = vi.fn().mockReturnValue(0.99);
      const potential = generatePotential(veryHighAttrs, "Prodigy", rng);

      // The system should clamp the crazy potential down to 25
      expect(potential.ST).toBe(25);
    });
  });

  describe("canGrow", () => {
    it("should return true if current < potential", () => {
      expect(canGrow(10, 15)).toBe(true);
    });

    it("should return false if current >= potential", () => {
      expect(canGrow(15, 15)).toBe(false);
      expect(canGrow(16, 15)).toBe(false);
    });

    it("should return true if potential is undefined and current < 25", () => {
      expect(canGrow(10, undefined)).toBe(true);
    });

    it("should return false if potential is undefined and current >= 25", () => {
      expect(canGrow(25, undefined)).toBe(false);
    });
  });

  describe("diminishingReturnsFactor", () => {
    it("should return 1.0 when potential is undefined", () => {
      expect(diminishingReturnsFactor(10, undefined)).toBe(1.0);
    });

    it("should return 1.0 when far from ceiling", () => {
      expect(diminishingReturnsFactor(10, 15)).toBe(1.0); // gap = 5
    });

    it("should return 0.5 when within 2 points of ceiling", () => {
      expect(diminishingReturnsFactor(13, 15)).toBe(0.5); // gap = 2
    });

    it("should return 0.25 when within 1 point of ceiling", () => {
      expect(diminishingReturnsFactor(14, 15)).toBe(0.25); // gap = 1
    });

    it("should return 0.0 when at or above ceiling", () => {
      expect(diminishingReturnsFactor(15, 15)).toBe(0); // gap = 0
      expect(diminishingReturnsFactor(16, 15)).toBe(0); // gap = -1
    });
  });

  describe("revealPotential", () => {
    it("should reveal a new attribute without affecting others", () => {
      const initial = { ST: true };
      const updated = revealPotential(initial, "CN");
      expect(updated).toEqual({ ST: true, CN: true });
    });

    it("should handle undefined initial state", () => {
      const updated = revealPotential(undefined, "SZ");
      expect(updated).toEqual({ SZ: true });
    });
  });

  describe("potentialRating and grade", () => {
    it("should calculate rating correctly based on max possible (175)", () => {
      const mockPotential: AttributePotential = {
        ST: 25, CN: 25, SZ: 25, WT: 25, WL: 25, SP: 25, DF: 25
      };
      // Total 175 / 175 = 100%
      expect(potentialRating(mockPotential)).toBe(100);
    });

    it("should return correct grades", () => {
      expect(potentialGrade(90)).toBe("S");
      expect(potentialGrade(75)).toBe("A");
      expect(potentialGrade(60)).toBe("B");
      expect(potentialGrade(45)).toBe("C");
      expect(potentialGrade(30)).toBe("D");
    });
  });
});
