/** @vitest-environment node */
import { describe, it, expect, vi } from "vitest";

// Ensure crypto is mocked for the test environment
if (typeof crypto === 'undefined' || !crypto.randomUUID) {
  Object.defineProperty(global, 'crypto', {
    value: { randomUUID: () => "mock-uuid-" + Math.random() },
    configurable: true
  });
}

import { processAIRosterManagement } from "@/engine/ownerRoster";
import { FightingStyle } from "@/types/game";
import type { GameState, RivalStableData } from "@/types/game";

describe("ownerRoster - processAIRosterManagement", () => {

  const mockState: any = {
    week: 1,
    season: "Spring",
    arenaHistory: [],
    rivals: [
      {
        owner: { id: "r1", name: "Rival 1", stableName: "Stable 1", personality: "Aggressive" },
        gold: 1000,
        strategy: { intent: "EXPANSION", planWeeksRemaining: 4 },
        philosophy: "Brute Force",
        roster: [
          { 
            id: "w1", 
            name: "Warrior 1", 
            status: "Active", 
            age: 25, 
            career: { wins: 0, losses: 0, kills: 0 }, 
            style: FightingStyle.BashingAttack, 
            attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 }
          }
        ]
      }
    ],
    player: { id: "p1", stableName: "Player Stable" }
  };

  it("should attempt recruitment when roster is low and funds are sufficient", () => {
    // Mock only the first random call (the recruit chance)
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.01);
    
    const { updatedRivals, gazetteItems } = processAIRosterManagement(mockState as GameState);
    
    expect(updatedRivals[0].roster.length).toBe(2);
    expect(updatedRivals[0].gold).toBe(900); 
    expect(gazetteItems.some(i => i.includes("recruits"))).toBe(true);
    
    vi.restoreAllMocks();
  });

  it("should retire underperforming warriors for Methodical owners", () => {
    const poorPerformer: any = {
      ...mockState,
      rivals: [
        {
          owner: { id: "r1", name: "M", stableName: "S", personality: "Methodical" },
          gold: 500,
          strategy: { intent: "CONSOLIDATION", planWeeksRemaining: 4 },
          philosophy: "Iron Defense",
          roster: [
            { 
              id: "w1", 
              name: "Loser",
              status: "Active", 
              age: 26, 
              career: { wins: 0, losses: 10, kills: 0 }, 
              attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 } 
            }
          ]
        }
      ]
    };
    
    vi.spyOn(Math, 'random').mockReturnValue(0.5); 

    const { updatedRivals, gazetteItems } = processAIRosterManagement(poorPerformer);
    
    expect(updatedRivals[0].roster.filter(w => w.status === "Active").length).toBe(1);
    expect(gazetteItems.some(i => i.includes("retires"))).toBe(true);
    
    vi.restoreAllMocks();
  });

  it("should NOT recruit if in RECOVERY intent", () => {
    const recoveryState: any = {
      ...mockState,
      rivals: [
        {
          ...mockState.rivals[0],
          strategy: { intent: "RECOVERY", planWeeksRemaining: 4 },
          gold: 500
        }
      ]
    };
    
    vi.spyOn(Math, 'random').mockReturnValue(0.01);
    
    const { updatedRivals } = processAIRosterManagement(recoveryState);
    
    expect(updatedRivals[0].roster.length).toBe(1); // No recruitment
    expect(updatedRivals[0].gold).toBe(500);
    
    vi.restoreAllMocks();
  });
});
