import { describe, it, expect } from "vitest";
import { getMoodModifiers, computeCrowdMood, type CrowdMood } from "./crowdMood";
import type { FightSummary } from "@/types/game";

describe("Crowd Mood System", () => {
  describe("getMoodModifiers", () => {
    it("should return Bloodthirsty modifiers", () => {
      const mods = getMoodModifiers("Bloodthirsty");
      expect(mods).toEqual({ fameMultiplier: 1.0, popMultiplier: 0.8, killChanceBonus: 0.1 });
    });

    it("should return Theatrical modifiers", () => {
      const mods = getMoodModifiers("Theatrical");
      expect(mods).toEqual({ fameMultiplier: 1.0, popMultiplier: 1.5, killChanceBonus: 0 });
    });

    it("should return Solemn modifiers", () => {
      const mods = getMoodModifiers("Solemn");
      expect(mods).toEqual({ fameMultiplier: 0.7, popMultiplier: 0.7, killChanceBonus: -0.05 });
    });

    it("should return Festive modifiers", () => {
      const mods = getMoodModifiers("Festive");
      expect(mods).toEqual({ fameMultiplier: 1.3, popMultiplier: 1.3, killChanceBonus: 0 });
    });

    it("should return default modifiers for Calm", () => {
      const mods = getMoodModifiers("Calm");
      expect(mods).toEqual({ fameMultiplier: 1.0, popMultiplier: 1.0, killChanceBonus: 0 });
    });
  });

  describe("computeCrowdMood", () => {
    it("should return Calm for empty history", () => {
      expect(computeCrowdMood([])).toBe("Calm");
    });

    it("should return Bloodthirsty when there are >= 2 kills in last 5 fights", () => {
      const fights: FightSummary[] = [
        { id: "1", week: 1, warriorId: "w1", opponentId: "o1", winner: "w1", by: "Kill" },
        { id: "2", week: 2, warriorId: "w1", opponentId: "o2", winner: "w1", by: "Kill" },
      ] as FightSummary[];
      expect(computeCrowdMood(fights)).toBe("Bloodthirsty");
    });

    it("should return Solemn when there are >= 1 kills and >= 2 draws", () => {
      const fights: FightSummary[] = [
        { id: "1", week: 1, warriorId: "w1", opponentId: "o1", winner: "w1", by: "Kill" },
        { id: "2", week: 2, warriorId: "w1", opponentId: "o2", winner: null, by: "Decision" },
        { id: "3", week: 3, warriorId: "w1", opponentId: "o3", winner: null, by: "Decision" },
      ] as FightSummary[];
      expect(computeCrowdMood(fights)).toBe("Solemn");
    });

    it("should return Theatrical when there are >= 3 flashy fights", () => {
      const fights: FightSummary[] = [
        { id: "1", week: 1, warriorId: "w1", opponentId: "o1", winner: "w1", by: "Decision", flashyTags: ["Flashy"] },
        { id: "2", week: 2, warriorId: "w1", opponentId: "o2", winner: "w1", by: "Decision", flashyTags: ["Flashy"] },
        { id: "3", week: 3, warriorId: "w1", opponentId: "o3", winner: "w1", by: "Decision", flashyTags: ["Flashy"] },
      ] as FightSummary[];
      expect(computeCrowdMood(fights)).toBe("Theatrical");
    });

    it("should return Festive when there are >= 4 fights and 0 kills", () => {
      const fights: FightSummary[] = [
        { id: "1", week: 1, warriorId: "w1", opponentId: "o1", winner: "w1", by: "Decision" },
        { id: "2", week: 2, warriorId: "w1", opponentId: "o2", winner: "w1", by: "Decision" },
        { id: "3", week: 3, warriorId: "w1", opponentId: "o3", winner: "w1", by: "Decision" },
        { id: "4", week: 4, warriorId: "w1", opponentId: "o4", winner: "w1", by: "Decision" },
      ] as FightSummary[];
      expect(computeCrowdMood(fights)).toBe("Festive");
    });

    it("should return Calm when no other conditions are met", () => {
      const fights: FightSummary[] = [
        { id: "1", week: 1, warriorId: "w1", opponentId: "o1", winner: "w1", by: "Decision" },
      ] as FightSummary[];
      expect(computeCrowdMood(fights)).toBe("Calm");
    });
  });
});
