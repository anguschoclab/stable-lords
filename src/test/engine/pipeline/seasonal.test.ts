import { describe, it, expect, vi, beforeEach } from "vitest";
import { applySeasonalUpdates } from "@/engine/pipeline/seasonal";
import { type GameState } from "@/types/game";
import * as weekPipelineModule from "@/engine/weekPipeline";
import * as ownerNarrativeModule from "@/engine/ownerNarrative";
import * as ownerPhilosophyModule from "@/engine/ownerPhilosophy";
import * as ownerGrudgesModule from "@/engine/ownerGrudges";

vi.mock("@/engine/weekPipeline", () => ({
  processHallOfFame: vi.fn(),
  processTierProgression: vi.fn(),
  computeNextSeason: vi.fn(),
}));

vi.mock("@/engine/ownerNarrative", () => ({
  generateOwnerNarratives: vi.fn(),
}));

vi.mock("@/engine/ownerPhilosophy", () => ({
  evolvePhilosophies: vi.fn(),
}));

vi.mock("@/engine/ownerGrudges", () => ({
  processOwnerGrudges: vi.fn(),
}));

describe("applySeasonalUpdates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should process all seasonal updates and increment week", () => {
    const mockState = {
      week: 10,
      season: 1,
      ownerGrudges: [],
      newsletter: [],
    } as unknown as GameState;

    vi.spyOn(weekPipelineModule, "computeNextSeason").mockReturnValue(1);
    vi.spyOn(weekPipelineModule, "processHallOfFame").mockReturnValue({ ...mockState, hallOfFameProcessed: true } as any);
    vi.spyOn(weekPipelineModule, "processTierProgression").mockReturnValue({ ...mockState, hallOfFameProcessed: true, tierProcessed: true } as any);

    const grudgeResult = { grudges: [{ id: "g1" }], gazetteItems: ["Grudge formed"] };
    vi.spyOn(ownerGrudgesModule, "processOwnerGrudges").mockReturnValue(grudgeResult as any);

    const narrativeResult = ["Owner narrative"];
    vi.spyOn(ownerNarrativeModule, "generateOwnerNarratives").mockReturnValue(narrativeResult);

    const philosophyResult = { updatedRivals: [{ id: "r1" }], gazetteItems: ["Philosophy changed"] };
    vi.spyOn(ownerPhilosophyModule, "evolvePhilosophies").mockReturnValue(philosophyResult as any);

    const newState = applySeasonalUpdates(mockState);

    expect(weekPipelineModule.computeNextSeason).toHaveBeenCalledWith(11);
    expect(weekPipelineModule.processHallOfFame).toHaveBeenCalledWith(mockState, 11);

    // Using whatever processHallOfFame returned
    expect(weekPipelineModule.processTierProgression).toHaveBeenCalledWith(expect.objectContaining({ hallOfFameProcessed: true }), 1, 11);

    expect(ownerGrudgesModule.processOwnerGrudges).toHaveBeenCalledWith(expect.objectContaining({ tierProcessed: true }), []);
    expect(ownerNarrativeModule.generateOwnerNarratives).toHaveBeenCalledWith(expect.objectContaining({ tierProcessed: true }), 1);
    expect(ownerPhilosophyModule.evolvePhilosophies).toHaveBeenCalledWith(expect.objectContaining({ tierProcessed: true }), 1);

    expect(newState.week).toBe(11);
    expect(newState.season).toBe(1);
    expect(newState.ownerGrudges).toBe(grudgeResult.grudges);
    expect(newState.rivals).toBe(philosophyResult.updatedRivals);

    expect(newState.newsletter?.length).toBe(3);
    expect(newState.newsletter?.[0]).toEqual({ week: 10, title: "Owner Feuds", items: grudgeResult.gazetteItems });
    expect(newState.newsletter?.[1]).toEqual({ week: 10, title: "1 Season Review", items: narrativeResult });
    expect(newState.newsletter?.[2]).toEqual({ week: 10, title: "Strategy Shifts", items: philosophyResult.gazetteItems });
  });

  it("should handle empty gazette items correctly", () => {
    const mockState = {
      week: 10,
      season: 1,
    } as unknown as GameState;

    vi.spyOn(weekPipelineModule, "computeNextSeason").mockReturnValue(1);
    vi.spyOn(weekPipelineModule, "processHallOfFame").mockReturnValue(mockState);
    vi.spyOn(weekPipelineModule, "processTierProgression").mockReturnValue(mockState);

    const grudgeResult = { grudges: [], gazetteItems: [] };
    vi.spyOn(ownerGrudgesModule, "processOwnerGrudges").mockReturnValue(grudgeResult as any);

    const narrativeResult: string[] = [];
    vi.spyOn(ownerNarrativeModule, "generateOwnerNarratives").mockReturnValue(narrativeResult);

    const philosophyResult = { updatedRivals: [], gazetteItems: [] };
    vi.spyOn(ownerPhilosophyModule, "evolvePhilosophies").mockReturnValue(philosophyResult as any);

    const newState = applySeasonalUpdates(mockState);

    expect(newState.newsletter).toBeUndefined();
  });
});
