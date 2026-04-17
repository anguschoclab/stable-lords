import { describe, it, expect } from "vitest";
import { getOutcomeStyles } from "@/utils/combat";
import type { FightOutcomeBy } from "@/types/combat.types";

describe("getOutcomeStyles", () => {
  it("returns blood variant for Kill", () => {
    const style = getOutcomeStyles("Kill");
    expect(style.variant).toBe("blood");
    expect(style.icon).toBe("Skull");
    expect(style.label).toBe("FATALITY");
  });

  it("returns gold variant for KO", () => {
    const style = getOutcomeStyles("KO");
    expect(style.variant).toBe("gold");
    expect(style.icon).toBe("Zap");
    expect(style.label).toBe("KNOCKOUT");
  });

  it("returns gold variant for Stoppage", () => {
    const style = getOutcomeStyles("Stoppage");
    expect(style.variant).toBe("gold");
    expect(style.icon).toBe("Shield");
    expect(style.label).toBe("STOPPAGE");
  });

  it("returns parchment variant for Exhaustion", () => {
    const style = getOutcomeStyles("Exhaustion");
    expect(style.variant).toBe("parchment");
    expect(style.icon).toBe("Activity");
    expect(style.label).toBe("EXHAUSTION");
  });

  it("returns parchment variant for Draw", () => {
    const style = getOutcomeStyles("Draw");
    expect(style.variant).toBe("parchment");
    expect(style.icon).toBeUndefined();
    expect(style.label).toBe("DRAW");
  });

  it("returns parchment variant for unknown outcomes", () => {
    const style = getOutcomeStyles("Unknown" as FightOutcomeBy);
    expect(style.variant).toBe("parchment");
    expect(style.label).toBe("UNKNOWN");
  });
});
