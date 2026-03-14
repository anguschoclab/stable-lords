import { describe, it, expect } from "vitest";
import { computeMetaDrift, createDefaultMeta, getMetaLabel, getMetaColor } from "@/engine/metaDrift";
import { FightingStyle, type FightSummary } from "@/types/game";

function makeFight(overrides: Partial<FightSummary>): FightSummary {
  return {
    id: "f1",
    week: 1,
    title: "Test Fight",
    a: "Warrior A",
    d: "Warrior D",
    winner: "A",
    by: "KO",
    styleA: FightingStyle.SlashingAttack,
    styleD: FightingStyle.AimedBlow,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("Meta Drift", () => {
  describe("createDefaultMeta", () => {
    it("should initialize all styles with 0 drift", () => {
      const meta = createDefaultMeta();
      Object.values(FightingStyle).forEach((style) => {
        expect(meta[style]).toBe(0);
      });
    });
  });

  describe("computeMetaDrift", () => {
    it("should return default meta for empty history", () => {
      const meta = computeMetaDrift([]);
      Object.values(FightingStyle).forEach((style) => {
        expect(meta[style]).toBe(0);
      });
    });

    it("should calculate +10 drift for 100% win rate", () => {
      const history = [
        makeFight({ winner: "A", styleA: FightingStyle.SlashingAttack, styleD: FightingStyle.AimedBlow }),
        makeFight({ winner: "A", styleA: FightingStyle.SlashingAttack, styleD: FightingStyle.AimedBlow }),
      ];
      const meta = computeMetaDrift(history);
      expect(meta[FightingStyle.SlashingAttack]).toBe(10);
    });

    it("should calculate -10 drift for 0% win rate", () => {
      const history = [
        makeFight({ winner: "D", styleA: FightingStyle.SlashingAttack, styleD: FightingStyle.AimedBlow }),
        makeFight({ winner: "D", styleA: FightingStyle.SlashingAttack, styleD: FightingStyle.AimedBlow }),
      ];
      const meta = computeMetaDrift(history);
      expect(meta[FightingStyle.SlashingAttack]).toBe(-10);
    });

    it("should calculate 0 drift for 50% win rate", () => {
      const history = [
        makeFight({ winner: "A", styleA: FightingStyle.SlashingAttack, styleD: FightingStyle.AimedBlow }),
        makeFight({ winner: "D", styleA: FightingStyle.SlashingAttack, styleD: FightingStyle.AimedBlow }),
      ];
      const meta = computeMetaDrift(history);
      expect(meta[FightingStyle.SlashingAttack]).toBe(0);
    });

    it("should calculate +5 drift for 75% win rate", () => {
      const history = [
        makeFight({ winner: "A", styleA: FightingStyle.SlashingAttack, styleD: FightingStyle.AimedBlow }),
        makeFight({ winner: "A", styleA: FightingStyle.SlashingAttack, styleD: FightingStyle.AimedBlow }),
        makeFight({ winner: "A", styleA: FightingStyle.SlashingAttack, styleD: FightingStyle.AimedBlow }),
        makeFight({ winner: "D", styleA: FightingStyle.SlashingAttack, styleD: FightingStyle.AimedBlow }),
      ];
      const meta = computeMetaDrift(history);
      expect(meta[FightingStyle.SlashingAttack]).toBe(5);
    });

    it("should respect the window parameter", () => {
      // 10 wins for AimedBlow in the past (out of window)
      // 10 losses for AimedBlow recently (in window)
      const history: FightSummary[] = [];
      for (let i = 0; i < 10; i++) {
        history.push(makeFight({ winner: "A", styleA: FightingStyle.AimedBlow, styleD: FightingStyle.SlashingAttack }));
      }
      for (let i = 0; i < 10; i++) {
        history.push(makeFight({ winner: "D", styleA: FightingStyle.AimedBlow, styleD: FightingStyle.SlashingAttack }));
      }

      const meta = computeMetaDrift(history, 10);
      // Only the last 10 (all losses) should be counted
      expect(meta[FightingStyle.AimedBlow]).toBe(-10);
    });
  });

  describe("getMetaLabel", () => {
    it("should return correct labels for various drift values", () => {
      expect(getMetaLabel(6)).toBe("Dominant");
      expect(getMetaLabel(5)).toBe("Dominant");
      expect(getMetaLabel(3)).toBe("Rising");
      expect(getMetaLabel(2)).toBe("Rising");
      expect(getMetaLabel(1)).toBe("Stable");
      expect(getMetaLabel(0)).toBe("Stable");
      expect(getMetaLabel(-1)).toBe("Stable");
      expect(getMetaLabel(-2)).toBe("Struggling");
      expect(getMetaLabel(-3)).toBe("Struggling");
      expect(getMetaLabel(-5)).toBe("Declining");
      expect(getMetaLabel(-6)).toBe("Declining");
    });
  });

  describe("getMetaColor", () => {
    it("should return correct color classes for various drift values", () => {
      expect(getMetaColor(5)).toBe("text-arena-gold");
      expect(getMetaColor(2)).toBe("text-arena-pop");
      expect(getMetaColor(0)).toBe("text-muted-foreground");
      expect(getMetaColor(-2)).toBe("text-arena-fame");
      expect(getMetaColor(-5)).toBe("text-destructive");
    });
  });
});
