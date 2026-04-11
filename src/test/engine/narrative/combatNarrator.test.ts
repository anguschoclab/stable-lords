import { describe, it, expect } from "vitest";
import { CombatNarrator } from "@/engine/narrative/combatNarrator";
import { FightingStyle } from "@/types/shared.types";
import { SeededRNG } from "@/utils/random";

describe("CombatNarrator", () => {
  const rng = () => new SeededRNG(12345).next();

  describe("generateWarriorIntro", () => {
    it("should generate warrior introduction lines", () => {
      const data = {
        name: "Test Warrior",
        style: FightingStyle.StrikingAttack,
        weaponId: "gladius",
        armorId: "chainmail",
        helmId: "iron_helm",
        height: 72
      };

      const lines = CombatNarrator.generateWarriorIntro(rng, data, 72);
      
      expect(Array.isArray(lines)).toBe(true);
      expect(lines.length).toBeGreaterThan(0);
      lines.forEach(line => {
        expect(typeof line).toBe("string");
        expect(line.length).toBeGreaterThan(0);
      });
    });

    it("should include warrior name in intro", () => {
      const data = {
        name: "Thor",
        style: FightingStyle.StrikingAttack,
        weaponId: "hammer",
        armorId: "plate",
        helmId: "helm"
      };

      const lines = CombatNarrator.generateWarriorIntro(rng, data);
      const hasName = lines.some(line => line.includes("Thor"));
      expect(hasName).toBe(true);
    });

    it("should mention fighting style", () => {
      const data = {
        name: "Warrior",
        style: FightingStyle.BashingAttack,
        weaponId: "mace",
        armorId: "chainmail",
        helmId: "helm"
      };

      const lines = CombatNarrator.generateWarriorIntro(rng, data);
      const hasStyle = lines.some(line => line.includes("Striking") || line.includes("Bashing"));
      expect(hasStyle).toBe(true);
    });

    it("should handle no armor", () => {
      const data = {
        name: "Warrior",
        style: FightingStyle.StrikingAttack,
        weaponId: "sword",
        armorId: "none_armor",
        helmId: "none_helm"
      };

      const lines = CombatNarrator.generateWarriorIntro(rng, data);
      const hasNoArmor = lines.some(line => line.includes("without body armor"));
      expect(hasNoArmor).toBe(true);
    });
  });

  describe("battleOpener", () => {
    it("should generate battle opener text", () => {
      const opener = CombatNarrator.battleOpener(rng);
      
      expect(typeof opener).toBe("string");
      expect(opener.length).toBeGreaterThan(0);
    });
  });

  describe("narrateAttack", () => {
    it("should narrate an attack", () => {
      const narration = CombatNarrator.narrateAttack(rng, "Thor", "hammer");
      
      expect(typeof narration).toBe("string");
      expect(narration.length).toBeGreaterThan(0);
      expect(narration).toContain("Thor");
    });

    it("should include weapon in attack narration", () => {
      const narration = CombatNarrator.narrateAttack(rng, "Thor", "gladius");
      
      expect(narration).toContain("gladius");
    });
  });

  describe("narratePassive", () => {
    it("should narrate passive style activation", () => {
      const narration = CombatNarrator.narratePassive(rng, FightingStyle.TotalParry, "Warrior");
      
      expect(typeof narration).toBe("string");
      expect(narration.length).toBeGreaterThan(0);
    });
  });

  describe("narrateParry", () => {
    it("should narrate a successful parry", () => {
      const narration = CombatNarrator.narrateParry(rng, "Defender", "shield");
      
      expect(typeof narration).toBe("string");
      expect(narration.length).toBeGreaterThan(0);
      expect(narration).toContain("Defender");
    });
  });

  describe("narrateDodge", () => {
    it("should narrate a successful dodge", () => {
      const narration = CombatNarrator.narrateDodge(rng, "Defender");
      
      expect(typeof narration).toBe("string");
      expect(narration.length).toBeGreaterThan(0);
      expect(narration).toContain("Defender");
    });
  });

  describe("narrateCounterstrike", () => {
    it("should narrate a counterstrike", () => {
      const narration = CombatNarrator.narrateCounterstrike(rng, "Warrior");
      
      expect(typeof narration).toBe("string");
      expect(narration.length).toBeGreaterThan(0);
      expect(narration).toContain("Warrior");
    });
  });

  describe("narrateHit", () => {
    it("should narrate a hit", () => {
      const narration = CombatNarrator.narrateHit(
        rng,
        "Defender",
        "CHEST",
        false,
        false,
        "Attacker",
        "sword",
        10,
        100,
        false,
        50,
        false
      );
      
      expect(typeof narration).toBe("string");
      expect(narration.length).toBeGreaterThan(0);
      expect(narration).toContain("Defender");
    });

    it("should include body part in hit narration", () => {
      const narration = CombatNarrator.narrateHit(
        rng,
        "Defender",
        "HEAD",
        false,
        false,
        "Attacker",
        "sword",
        10,
        100
      );
      
      expect(narration).toContain("HEAD");
    });

    it("should handle fatal hits", () => {
      const narration = CombatNarrator.narrateHit(
        rng,
        "Defender",
        "CHEST",
        false,
        false,
        "Attacker",
        "sword",
        50,
        100,
        true,
        50
      );
      
      expect(typeof narration).toBe("string");
    });
  });

  describe("narrateParryBreak", () => {
    it("should narrate a parry break", () => {
      const narration = CombatNarrator.narrateParryBreak(rng, "Attacker", "mace");
      
      expect(typeof narration).toBe("string");
      expect(narration.length).toBeGreaterThan(0);
      expect(narration).toContain("Attacker");
    });
  });

  describe("narrateInitiative", () => {
    it("should narrate initiative winner", () => {
      const narration = CombatNarrator.narrateInitiative(rng, "Warrior", false);
      
      expect(typeof narration).toBe("string");
      expect(narration.length).toBeGreaterThan(0);
      expect(narration).toContain("Warrior");
    });

    it("should handle feint initiative", () => {
      const narration = CombatNarrator.narrateInitiative(rng, "Warrior", true);
      
      expect(typeof narration).toBe("string");
      expect(narration.length).toBeGreaterThan(0);
    });
  });

  describe("narrateBoutEnd", () => {
    it("should narrate bout conclusion for KO", () => {
      const narration = CombatNarrator.narrateBoutEnd(rng, "KO", "Winner", "Loser", "sword");
      
      expect(Array.isArray(narration)).toBe(true);
      expect(narration.length).toBe(1);
      expect(narration[0]).toContain("Winner");
      expect(narration[0]).toContain("Loser");
    });

    it("should narrate bout conclusion for Kill", () => {
      const narration = CombatNarrator.narrateBoutEnd(rng, "Kill", "Winner", "Loser", "sword");
      
      expect(Array.isArray(narration)).toBe(true);
      expect(narration.length).toBe(2); // Fatal blow + conclusion
      narration.forEach(line => {
        expect(line).toContain("Winner");
        expect(line).toContain("Loser");
      });
    });
  });
});
