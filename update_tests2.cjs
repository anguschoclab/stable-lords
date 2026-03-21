const fs = require('fs');

const path = 'src/test/engine/combatDamage.test.ts';
let code = fs.readFileSync(path, 'utf8');

// I need to replace the incorrectly formatted replace from previous attempt
// I'll grab everything from describe("applyProtectMod" down to describe("computeHitDamage"

const startIdx = code.indexOf('describe("applyProtectMod"');
const endIdx = code.indexOf('describe("computeHitDamage"');

const firstPart = code.substring(0, startIdx);
const lastPart = code.substring(endIdx);

const newApplyProtectMod = `describe("applyProtectMod", () => {
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

  `;

fs.writeFileSync(path, firstPart + newApplyProtectMod + lastPart);
