import { describe, it, expect } from "vitest";
import { processTierProgression } from "../../engine/weekPipeline";
import { GameState, RivalStableData } from "../../types/game";

describe("processTierProgression", () => {
  const mockState = {
    season: "Spring",
    week: 1,
    rivals: [
      {
        owner: { stableName: "Rival 1" },
        tier: "Minor",
        roster: Array(5).fill({
          status: "Active",
          career: { wins: 20, kills: 5, losses: 0 }
        })
      }
    ],
    newsletter: [],
    recruitPool: [{ id: 'old' }] as any
  } as GameState;

  it("should promote a stable and clear recruit pool", () => {
    const newState = processTierProgression(mockState, "Summer", 14);

    expect(newState.rivals[0].tier).toBe("Established");
    expect(newState.recruitPool).toEqual([]);
    expect(newState.newsletter.length).toBeGreaterThan(0);
    expect(newState.newsletter[0].title).toBe("Stable Rankings Update");
  });

  it("should return original state if season hasn't changed", () => {
    const newState = processTierProgression(mockState, "Spring", 2);
    expect(newState).toBe(mockState);
  });
});
