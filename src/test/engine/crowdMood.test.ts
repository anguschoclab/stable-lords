import { describe, it, expect } from "vitest";
import { getMoodModifiers, computeCrowdMood } from "@/engine/crowdMood";
import type { FightSummary } from "@/types/game";

// Helper to easily create a mocked FightSummary
function createMockFight(overrides: Partial<FightSummary> = {}): FightSummary {
  return {
    id: "test-fight",
    week: 1,
    phase: "resolution",
    title: "Test Bout",
    a: "Warrior A",
    d: "Warrior B",
    winner: "A",
    by: "KO",
    styleA: "Brawler",
    styleD: "Fencer",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("crowdMood system", () => {
  describe("getMoodModifiers", () => {
    it("returns correct modifiers for Bloodthirsty", () => {
      expect(getMoodModifiers("Bloodthirsty")).toEqual({
        fameMultiplier: 1.0,
        popMultiplier: 0.8,
        killChanceBonus: 0.1,
      });
    });

    it("returns correct modifiers for Theatrical", () => {
      expect(getMoodModifiers("Theatrical")).toEqual({
        fameMultiplier: 1.0,
        popMultiplier: 1.5,
        killChanceBonus: 0,
      });
    });

    it("returns correct modifiers for Solemn", () => {
      expect(getMoodModifiers("Solemn")).toEqual({
        fameMultiplier: 0.7,
        popMultiplier: 0.7,
        killChanceBonus: -0.05,
      });
    });

    it("returns correct modifiers for Festive", () => {
      expect(getMoodModifiers("Festive")).toEqual({
        fameMultiplier: 1.3,
        popMultiplier: 1.3,
        killChanceBonus: 0,
      });
    });

    it("returns correct modifiers for Calm (and as default)", () => {
      expect(getMoodModifiers("Calm")).toEqual({
        fameMultiplier: 1.0,
        popMultiplier: 1.0,
        killChanceBonus: 0,
      });

      // Assert default fallback is same as Calm
      expect(getMoodModifiers("Unknown" as any)).toEqual({
        fameMultiplier: 1.0,
        popMultiplier: 1.0,
        killChanceBonus: 0,
      });
    });
  });

  describe("computeCrowdMood", () => {
    it("returns Calm if there are no recent fights", () => {
      expect(computeCrowdMood([])).toBe("Calm");
    });

    it("returns Bloodthirsty if there are >= 2 kills in the last 5 fights", () => {
      const fights = [
        createMockFight({ by: "Kill" }),
        createMockFight({ by: "KO" }),
        createMockFight({ by: "Kill" }),
        createMockFight({ by: "Draw", winner: null }), // extra noise
      ];
      expect(computeCrowdMood(fights)).toBe("Bloodthirsty");
    });

    it("returns Solemn if there is >= 1 kill and >= 2 draws in the last 5 fights", () => {
      // It processes top-down, so it shouldn't hit Bloodthirsty if kills < 2
      const fights = [
        createMockFight({ by: "Kill" }),
        createMockFight({ winner: null, by: "Draw" }),
        createMockFight({ winner: null, by: "Draw" }),
        createMockFight({ by: "KO" }),
      ];
      expect(computeCrowdMood(fights)).toBe("Solemn");
    });

    it("returns Theatrical if there are >= 3 flashy fights in the last 5", () => {
      const fights = [
        createMockFight({ flashyTags: ["Flashy"] }),
        createMockFight({ flashyTags: ["Flashy", "Bloody"] }),
        createMockFight({ flashyTags: ["Flashy"] }),
        createMockFight({ by: "KO" }),
      ];
      expect(computeCrowdMood(fights)).toBe("Theatrical");
    });

    it("returns Festive if there are >= 4 fights with 0 kills in the last 5", () => {
      const fights = [
        createMockFight({ by: "KO" }),
        createMockFight({ by: "KO" }),
        createMockFight({ by: "Exhaustion" }),
        createMockFight({ by: "Draw", winner: null }),
      ];
      expect(computeCrowdMood(fights)).toBe("Festive");
    });

    it("only considers the last 5 fights", () => {
      // 6 fights total
      // The first two are kills, but one drops off when slicing the last 5.
      const fights = [
        createMockFight({ by: "Kill" }),
        createMockFight({ by: "Kill" }),
        createMockFight({ by: "KO" }),
        createMockFight({ by: "KO" }),
        createMockFight({ by: "KO" }),
        createMockFight({ by: "KO" }),
      ];
      // Only 1 kill in the last 5, and total length is > 4 so it becomes Festive if kills == 0
      // Actually there's 1 kill in the last 5, so it's not Festive, and not Bloodthirsty
      // Let's check what it evaluates to
      // kills = 1, flashy = 0, draws = 0.
      // Falls through to Calm!
      expect(computeCrowdMood(fights)).toBe("Calm");
    });

    it("prioritizes conditions correctly (Bloodthirsty > Solemn > Theatrical > Festive > Calm)", () => {
      // If there are 2 kills, 2 draws, 3 flashy, and 4 total fights (which contradicts 0 kills for Festive),
      // it should return Bloodthirsty.
      const fights = [
        createMockFight({ by: "Kill", winner: null, flashyTags: ["Flashy"] }),
        createMockFight({ by: "Kill", winner: null, flashyTags: ["Flashy"] }),
        createMockFight({ by: "KO", flashyTags: ["Flashy"] }),
      ];
      expect(computeCrowdMood(fights)).toBe("Bloodthirsty");
    });

    it("returns Calm if no other conditions are met", () => {
      const fights = [
        createMockFight({ by: "KO" }),
        createMockFight({ by: "KO" }),
        createMockFight({ by: "KO" }),
      ];
      // < 4 fights, no kills, no draws, no flashy -> Calm
      expect(computeCrowdMood(fights)).toBe("Calm");
    });
  });
});
