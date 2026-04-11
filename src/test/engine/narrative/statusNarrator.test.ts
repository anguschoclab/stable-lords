import { describe, it, expect } from "vitest";
import { StatusNarrator } from "@/engine/narrative/statusNarrator";

describe("StatusNarrator", () => {
  const rng = () => Math.random();

  describe("damageSeverityLine", () => {
    it("should return null for moderate damage", () => {
      const line = StatusNarrator.damageSeverityLine(rng, 10, 100);
      expect(line).toBeNull();
    });

    it("should return line for deadly damage", () => {
      const line = StatusNarrator.damageSeverityLine(rng, 40, 100);
      expect(line).toBeDefined();
      expect(typeof line).toBe("string");
    });

    it("should return line for terrific damage", () => {
      const line = StatusNarrator.damageSeverityLine(rng, 30, 100);
      expect(line).toBeDefined();
      expect(typeof line).toBe("string");
    });

    it("should return line for powerful damage", () => {
      const line = StatusNarrator.damageSeverityLine(rng, 20, 100);
      expect(line).toBeDefined();
      expect(typeof line).toBe("string");
    });

    it("should return line for glancing damage", () => {
      const line = StatusNarrator.damageSeverityLine(rng, 3, 100);
      expect(line).toBeDefined();
      expect(typeof line).toBe("string");
    });
  });

  describe("stateChangeLine", () => {
    it("should return null when no threshold crossed", () => {
      const line = StatusNarrator.stateChangeLine(rng, "Warrior", 0.9, 0.85);
      expect(line).toBeNull();
    });

    it("should return line for severe threshold", () => {
      const line = StatusNarrator.stateChangeLine(rng, "Warrior", 0.15, 0.25);
      expect(line).toBeDefined();
      expect(typeof line).toBe("string");
      expect(line).toContain("Warrior");
    });

    it("should return line for desperate threshold", () => {
      const line = StatusNarrator.stateChangeLine(rng, "Warrior", 0.35, 0.45);
      expect(line).toBeDefined();
      expect(typeof line).toBe("string");
    });

    it("should return line for serious threshold", () => {
      const line = StatusNarrator.stateChangeLine(rng, "Warrior", 0.55, 0.65);
      expect(line).toBeDefined();
      expect(typeof line).toBe("string");
    });
  });

  describe("fatigueLine", () => {
    it("should return null for healthy endurance", () => {
      const line = StatusNarrator.fatigueLine(rng, "Warrior", 0.8);
      expect(line).toBeNull();
    });

    it("should return line for low endurance", () => {
      const line = StatusNarrator.fatigueLine(rng, "Warrior", 0.2);
      expect(line).toBeDefined();
      expect(typeof line).toBe("string");
      expect(line).toContain("Warrior");
    });

    it("should return line for very low endurance", () => {
      const line = StatusNarrator.fatigueLine(rng, "Warrior", 0.1);
      expect(line).toBeDefined();
      expect(typeof line).toBe("string");
      expect(line).toContain("Warrior");
    });
  });

  describe("crowdReaction", () => {
    it("should return null when RNG doesn't trigger", () => {
      const line = StatusNarrator.crowdReaction(() => 1, "Loser", "Winner", 0.5);
      expect(line).toBeNull();
    });

    it("should return reaction when RNG triggers", () => {
      const line = StatusNarrator.crowdReaction(() => 0, "Loser", "Winner", 0.5);
      expect(line).toBeDefined();
      expect(typeof line).toBe("string");
    });
  });

  describe("minuteStatusLine", () => {
    it("should return beating status when one warrior leads by 3+ hits", () => {
      const line = StatusNarrator.minuteStatusLine(rng, 1, "WarriorA", "WarriorB", 10, 5);
      expect(line).toContain("WarriorA");
      expect(line).toContain("beating");
    });

    it("should return beating status for defender lead", () => {
      const line = StatusNarrator.minuteStatusLine(rng, 1, "WarriorA", "WarriorB", 5, 10);
      expect(line).toContain("WarriorB");
      expect(line).toContain("beating");
    });

    it("should return stalemate when hits are close", () => {
      const line = StatusNarrator.minuteStatusLine(rng, 1, "WarriorA", "WarriorB", 5, 5);
      expect(typeof line).toBe("string");
    });
  });

  describe("popularityLine", () => {
    it("should return null for no popularity change", () => {
      const line = StatusNarrator.popularityLine(rng, "Warrior", 0);
      expect(line).toBeNull();
    });

    it("should return line for great popularity gain", () => {
      const line = StatusNarrator.popularityLine(rng, "Warrior", 5);
      expect(line).toBeDefined();
      expect(typeof line).toBe("string");
      expect(line).toContain("Warrior");
    });

    it("should return line for normal popularity gain", () => {
      const line = StatusNarrator.popularityLine(rng, "Warrior", 2);
      expect(line).toBeDefined();
      expect(typeof line).toBe("string");
    });
  });

  describe("skillLearnLine", () => {
    it("should generate skill learn narration", () => {
      const line = StatusNarrator.skillLearnLine(rng, "Warrior");
      
      expect(typeof line).toBe("string");
      expect(line.length).toBeGreaterThan(0);
      expect(line).toContain("Warrior");
    });
  });

  describe("tradingBlowsLine", () => {
    it("should generate trading blows narration", () => {
      const line = StatusNarrator.tradingBlowsLine(rng);
      
      expect(typeof line).toBe("string");
      expect(line.length).toBeGreaterThan(0);
    });
  });

  describe("stalemateLine", () => {
    it("should generate stalemate narration", () => {
      const line = StatusNarrator.stalemateLine(rng);
      
      expect(typeof line).toBe("string");
      expect(line.length).toBeGreaterThan(0);
    });
  });

  describe("tauntLine", () => {
    it("should return null when RNG doesn't trigger", () => {
      const line = StatusNarrator.tauntLine(() => 1, "Warrior", true);
      expect(line).toBeNull();
    });

    it("should return taunt for winner", () => {
      const line = StatusNarrator.tauntLine(() => 0, "Winner", true);
      expect(line).toBeDefined();
      expect(typeof line).toBe("string");
    });

    it("should return taunt for loser", () => {
      const line = StatusNarrator.tauntLine(() => 0, "Loser", false);
      expect(line).toBeDefined();
      expect(typeof line).toBe("string");
    });
  });

  describe("conservingLine", () => {
    it("should generate conserving energy narration", () => {
      const line = StatusNarrator.conservingLine("Warrior");
      
      expect(typeof line).toBe("string");
      expect(line).toContain("Warrior");
      expect(line).toContain("conserving");
    });
  });

  describe("pressingLine", () => {
    it("should generate pressing attack narration", () => {
      const line = StatusNarrator.pressingLine(rng, "Warrior");
      
      expect(typeof line).toBe("string");
      expect(line).toContain("Warrior");
    });
  });

  describe("narrateInsightHint", () => {
    it("should return null for non-existent attribute", () => {
      const line = StatusNarrator.narrateInsightHint(rng, "nonexistent");
      expect(line).toBeNull();
    });

    it("should return null for fallback template", () => {
      const line = StatusNarrator.narrateInsightHint(rng, "ST");
      expect(line).toBeNull();
    });
  });
});
