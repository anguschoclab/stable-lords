import { describe, it, expect } from "vitest";
import { computeCrowdMood } from "./crowdMood";
import type { FightSummary, FightOutcomeBy } from "@/types/game";

function makeFight(overrides?: Partial<FightSummary>): FightSummary {
  return {
    id: "test-fight",
    week: 1,
    title: "Test Fight",
    a: "w1",
    d: "w2",
    winner: "A",
    by: "KO" as FightOutcomeBy,
    styleA: "Striker",
    styleD: "Grappler",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("computeCrowdMood", () => {
  it("should return Calm when there are no recent fights", () => {
    expect(computeCrowdMood([])).toBe("Calm");
  });

  it("should return Bloodthirsty when there are 2 or more kills in the last 5 fights", () => {
    const fights = [
      makeFight({ by: "KO" }),
      makeFight({ by: "Kill" }),
      makeFight({ by: "KO" }),
      makeFight({ by: "Kill" }),
      makeFight({ by: "KO" }),
    ];
    expect(computeCrowdMood(fights)).toBe("Bloodthirsty");
  });

  it("should return Bloodthirsty when there are more than 2 kills in the last 5 fights", () => {
    const fights = [
      makeFight({ by: "Kill" }),
      makeFight({ by: "Kill" }),
      makeFight({ by: "Kill" }),
    ];
    expect(computeCrowdMood(fights)).toBe("Bloodthirsty");
  });

  it("should ignore fights beyond the last 5", () => {
    const fights = [
      makeFight({ by: "Kill" }), // 6th oldest, should be ignored
      makeFight({ by: "Kill" }), // 5th oldest, ignored for bloodthirsty threshold since only 1 in last 5
      makeFight({ by: "KO" }),
      makeFight({ by: "KO" }),
      makeFight({ by: "KO" }),
      makeFight({ by: "KO" }),
    ];
    expect(computeCrowdMood(fights)).not.toBe("Bloodthirsty");
  });

  it("should return Solemn when there is at least 1 kill and 2 or more draws in the last 5 fights", () => {
    const fights = [
      makeFight({ by: "Kill" }),
      makeFight({ by: "Draw", winner: null }),
      makeFight({ by: "Draw", winner: null }),
    ];
    expect(computeCrowdMood(fights)).toBe("Solemn");
  });

  it("should return Theatrical when there are 3 or more flashy tags in the last 5 fights", () => {
    const fights = [
      makeFight({ flashyTags: ["Flashy", "Comeback"] }),
      makeFight({ flashyTags: ["Flashy"] }),
      makeFight({ flashyTags: ["Flashy"] }),
    ];
    expect(computeCrowdMood(fights)).toBe("Theatrical");
  });

  it("should return Festive when there are 4 or more fights and 0 kills in the last 5 fights", () => {
    const fights = [
      makeFight({ by: "KO" }),
      makeFight({ by: "Stoppage" }),
      makeFight({ by: "Exhaustion" }),
      makeFight({ by: "KO" }),
    ];
    expect(computeCrowdMood(fights)).toBe("Festive");
  });

  it("should prioritize Bloodthirsty over Solemn and Theatrical when multiple conditions are met", () => {
    const fights = [
      makeFight({ by: "Kill", flashyTags: ["Flashy"] }),
      makeFight({ by: "Kill", flashyTags: ["Flashy"] }),
      makeFight({ by: "Draw", winner: null, flashyTags: ["Flashy"] }),
      makeFight({ by: "Draw", winner: null }),
    ];
    expect(computeCrowdMood(fights)).toBe("Bloodthirsty");
  });

  it("should prioritize Solemn over Theatrical when conditions for both are met", () => {
    const fights = [
      makeFight({ by: "Kill", flashyTags: ["Flashy"] }),
      makeFight({ by: "Draw", winner: null, flashyTags: ["Flashy"] }),
      makeFight({ by: "Draw", winner: null, flashyTags: ["Flashy"] }),
    ];
    expect(computeCrowdMood(fights)).toBe("Solemn");
  });

  it("should return Calm when no specific conditions are met", () => {
    const fights = [
      makeFight({ by: "KO" }),
      makeFight({ by: "KO" }),
      makeFight({ by: "KO" }),
    ];
    // Not 4 fights, so not Festive. Not enough kills or draws or flashy tags.
    expect(computeCrowdMood(fights)).toBe("Calm");
  });
});
