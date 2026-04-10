/** @vitest-environment node */
import { describe, it, expect } from "vitest";
import { processOwnerGrudges, calculateRivalryScore } from "@/engine/ownerGrudges";
import { FightingStyle } from "@/types/game";

describe("ownerGrudges - processOwnerGrudges", () => {
  const mockState: any = {
    week: 10,
    arenaHistory: [
      { id: "f1", week: 9, a: "W1", d: "W2", warriorIdA: "w1", warriorIdD: "w2", styleA: "Brawler", styleD: "Brawler", winner: "A", by: "Kill" }
    ],
    rivals: [
      {
        owner: { id: "o1", personality: "Aggressive", stableName: "Aggro" },
        roster: [{ name: "W1", status: "Active" }]
      },
      {
        owner: { id: "o2", personality: "Tactician", stableName: "Tact" },
        roster: [{ name: "W2", status: "Active" }]
      }
    ]
  };

  it("should create a new grudge when personalities clash and blood is spilled", () => {
    // Aggressive vs Tactician is a known clash in ownerData
    const { grudges, gazetteItems } = processOwnerGrudges(mockState, []);
    
    expect(grudges.length).toBe(1);
    expect(grudges[0].intensity).toBe(2);
    expect(gazetteItems[0]).toContain("NEW RIVALRY");
  });

  it("should escalate existing grudges on further kills", () => {
    const existingGrudge = {
      ownerIdA: "o1",
      ownerIdB: "o2",
      intensity: 2,
      reason: "Old feud",
      startWeek: 1,
      lastEscalation: 1
    };
    
    const { grudges, gazetteItems } = processOwnerGrudges(mockState, [existingGrudge]);
    
    expect(grudges[0].intensity).toBe(3);
    expect(gazetteItems[0]).toContain("GRUDGE DEEPENS");
  });
});

describe("ownerGrudges - calculateRivalryScore", () => {
    it("should calculate score correctly", () => {
        expect(calculateRivalryScore(9, 1, 1)).toBe(5); // 3 (bouts) + 5 (death) + 3 (upset) = 11 -> clamped to 5
        expect(calculateRivalryScore(3, 0, 0)).toBe(1); // 1 + 0 + 0 = 1
    });
});
