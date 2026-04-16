import { describe, it, expect } from "vitest";
import { mergeImpacts, type StateImpact } from "@/engine/impacts";

describe("mergeImpacts", () => {
  it("merges numeric values by accumulation", () => {
    const impacts: StateImpact[] = [
      { treasuryDelta: 100, fameDelta: 50 },
      { treasuryDelta: 50, fameDelta: 25 },
    ];
    const result = mergeImpacts(impacts);
    expect(result.treasuryDelta).toBe(150);
    expect(result.fameDelta).toBe(75);
  });

  it("merges arrays by appending", () => {
    const impacts: StateImpact[] = [
      { newsletterItems: [{ id: "1", week: 1, title: "Test", items: [] }] },
      { newsletterItems: [{ id: "2", week: 2, title: "Test2", items: [] }] },
    ];
    const result = mergeImpacts(impacts);
    expect(result.newsletterItems).toHaveLength(2);
    expect(result.newsletterItems[0].id).toBe("1");
    expect(result.newsletterItems[1].id).toBe("2");
  });

  it("merges Maps by merging values", () => {
    const map1 = new Map([["warrior1", { fame: 100 }]]);
    const map2 = new Map([["warrior2", { fame: 50 }]]);
    const impacts: StateImpact[] = [
      { rosterUpdates: map1 },
      { rosterUpdates: map2 },
    ];
    const result = mergeImpacts(impacts);
    expect(result.rosterUpdates?.size).toBe(2);
    expect(result.rosterUpdates?.get("warrior1")).toEqual({ fame: 100 });
    expect(result.rosterUpdates?.get("warrior2")).toEqual({ fame: 50 });
  });

  it("merges Maps by combining values for same key", () => {
    const map1 = new Map([["warrior1", { fame: 100 }]]);
    const map2 = new Map([["warrior1", { popularity: 50 }]]);
    const impacts: StateImpact[] = [
      { rosterUpdates: map1 },
      { rosterUpdates: map2 },
    ];
    const result = mergeImpacts(impacts);
    expect(result.rosterUpdates?.size).toBe(1);
    expect(result.rosterUpdates?.get("warrior1")).toEqual({ fame: 100, popularity: 50 });
  });

  it("replaces values for replace strategy properties", () => {
    const impacts: StateImpact[] = [
      { weather: "Rainy" },
      { weather: "Sunny" },
    ];
    const result = mergeImpacts(impacts);
    expect(result.weather).toBe("Sunny");
  });

  it("handles empty impacts array", () => {
    const result = mergeImpacts([]);
    expect(result.treasuryDelta).toBe(0);
    expect(result.fameDelta).toBe(0);
    expect(result.newsletterItems).toEqual([]);
  });

  it("handles single impact", () => {
    const impacts: StateImpact[] = [{ treasuryDelta: 100 }];
    const result = mergeImpacts(impacts);
    expect(result.treasuryDelta).toBe(100);
  });

  it("skips undefined values", () => {
    const impacts: StateImpact[] = [
      { treasuryDelta: 100 },
      { treasuryDelta: undefined, fameDelta: 50 },
    ];
    const result = mergeImpacts(impacts);
    expect(result.treasuryDelta).toBe(100);
    expect(result.fameDelta).toBe(50);
  });

  it("merges all numeric delta properties", () => {
    const impacts: StateImpact[] = [
      { treasuryDelta: 100, fameDelta: 50, popularityDelta: 25 },
      { treasuryDelta: 50, fameDelta: 25, popularityDelta: 10 },
    ];
    const result = mergeImpacts(impacts);
    expect(result.treasuryDelta).toBe(150);
    expect(result.fameDelta).toBe(75);
    expect(result.popularityDelta).toBe(35);
  });

  it("merges all array properties", () => {
    const impacts: StateImpact[] = [
      { insightTokens: [{ id: "token1", type: "Weapon", warriorId: "w1", warriorName: "Warrior1", detail: "Test", discoveredWeek: 1 }] },
      { insightTokens: [{ id: "token2", type: "Rhythm", warriorId: "w2", warriorName: "Warrior2", detail: "Test2", discoveredWeek: 1 }] },
    ];
    const result = mergeImpacts(impacts);
    expect(result.insightTokens).toHaveLength(2);
  });
});
