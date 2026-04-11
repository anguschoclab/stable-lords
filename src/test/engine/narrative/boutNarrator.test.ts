import { describe, it, expect } from "vitest";
import { BoutNarrator } from "@/engine/narrative/boutNarrator";
import { FightingStyle } from "@/types/shared.types";
import { SeededRNG } from "@/utils/random";

describe("BoutNarrator", () => {
  const rng = () => new SeededRNG(12345).next();

  describe("generateWarriorIntro", () => {
    it("should delegate to CombatNarrator", () => {
      const data = {
        name: "Test Warrior",
        style: FightingStyle.StrikingAttack,
        weaponId: "sword",
        armorId: "chainmail",
        helmId: "helm",
        height: 72
      };

      const lines = BoutNarrator.generateWarriorIntro(rng, data, 72);
      
      expect(Array.isArray(lines)).toBe(true);
      expect(lines.length).toBeGreaterThan(0);
    });
  });

  describe("battleOpener", () => {
    it("should delegate to CombatNarrator", () => {
      const opener = BoutNarrator.battleOpener(rng);
      
      expect(typeof opener).toBe("string");
      expect(opener.length).toBeGreaterThan(0);
    });
  });

  describe("narrateBoutEnd", () => {
    it("should delegate to CombatNarrator for KO", () => {
      const narration = BoutNarrator.narrateBoutEnd(rng, "KO", "Winner", "Loser", "sword");
      
      expect(Array.isArray(narration)).toBe(true);
      expect(narration.length).toBe(1);
    });

    it("should delegate to CombatNarrator for Kill", () => {
      const narration = BoutNarrator.narrateBoutEnd(rng, "Kill", "Winner", "Loser", "sword");
      
      expect(Array.isArray(narration)).toBe(true);
      expect(narration.length).toBe(2);
    });
  });
});
