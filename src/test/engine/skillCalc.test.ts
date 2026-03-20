import { describe, it, expect } from "vitest";
import { computeHP } from "../../engine/skillCalc";
import type { Attributes } from "../../types/game";

describe("skillCalc", () => {
  describe("computeHP", () => {
    // Helper to create a complete Attributes object with default values
    const createAttrs = (overrides: Partial<Attributes>): Attributes => ({
      ST: 10,
      CN: 10,
      SZ: 10,
      WT: 10,
      WL: 10,
      SP: 10,
      DF: 10,
      ...overrides,
    });

    it("calculates HP correctly for minimum attributes (3s)", () => {
      // CN: 3, SZ: 3, WL: 3
      // CN*2 = 6. SZ_MOD[3] = 0. WL_MOD_HP[3] = 0. Total = 6.
      const attrs = createAttrs({ CN: 3, SZ: 3, WL: 3 });
      expect(computeHP(attrs)).toBe(6);
    });

    it("calculates HP correctly for average attributes (10s)", () => {
      // CN: 10, SZ: 10, WL: 10
      // CN*2 = 20. SZ_MOD[10] = 3. WL_MOD_HP[10] = 2. Total = 25.
      const attrs = createAttrs({ CN: 10, SZ: 10, WL: 10 });
      expect(computeHP(attrs)).toBe(25);
    });

    it("calculates HP correctly for maximum normal attributes", () => {
      // CN: 25, SZ: 21, WL: 25
      // CN*2 = 50. SZ_MOD[21] = 10. WL_MOD_HP[25] = 10. Total = 70.
      const attrs = createAttrs({ CN: 25, SZ: 21, WL: 25 });
      expect(computeHP(attrs)).toBe(70);
    });

    it("clamps SZ correctly for out-of-bounds low values", () => {
      // SZ: 1 should clamp to 3 -> SZ_MOD[3] = 0
      // CN: 10, WL: 10
      // CN*2 = 20. WL_MOD_HP[10] = 2. Total = 22.
      const attrs = createAttrs({ CN: 10, SZ: 1, WL: 10 });
      expect(computeHP(attrs)).toBe(22);
    });

    it("clamps WL correctly for out-of-bounds low values", () => {
      // WL: -5 should clamp to 3 -> WL_MOD_HP[3] = 0
      // CN: 10, SZ: 10
      // CN*2 = 20. SZ_MOD[10] = 3. Total = 23.
      const attrs = createAttrs({ CN: 10, SZ: 10, WL: -5 });
      expect(computeHP(attrs)).toBe(23);
    });

    it("clamps SZ correctly for out-of-bounds high values", () => {
      // SZ: 30 should clamp to 21 -> SZ_MOD[21] = 10
      // CN: 10, WL: 10
      // CN*2 = 20. WL_MOD_HP[10] = 2. Total = 32.
      const attrs = createAttrs({ CN: 10, SZ: 30, WL: 10 });
      expect(computeHP(attrs)).toBe(32);
    });

    it("clamps WL correctly for out-of-bounds high values", () => {
      // WL: 50 should clamp to 25 -> WL_MOD_HP[25] = 10
      // CN: 10, SZ: 10
      // CN*2 = 20. SZ_MOD[10] = 3. Total = 33.
      const attrs = createAttrs({ CN: 10, SZ: 10, WL: 50 });
      expect(computeHP(attrs)).toBe(33);
    });
  });
});
