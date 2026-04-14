/**
 * advanceWeek pipeline tests — verifies orchestration of the weekly pipeline
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { advanceWeek } from "@/engine/pipeline/services/weekPipelineService";
import { createFreshState } from "@/engine/factories";
import * as Training from "@/engine/training";
import * as Economy from "@/engine/economy";
import * as Aging from "@/engine/aging";
import * as Health from "@/engine/health";
import * as Impacts from "@/engine/impacts";

// Mock engine modules
vi.mock("@/engine/training", () => ({
  computeTrainingImpact: vi.fn(() => ({ updatedRoster: [], updatedSeasonalGrowth: [], results: [] })),
  trainingImpactToStateImpact: vi.fn(() => ({ impact: {}, seasonalGrowth: [], results: [] }))
}));

vi.mock("@/engine/economy", () => ({ 
  computeEconomyImpact: vi.fn(() => ({})) 
}));

vi.mock("@/engine/aging", () => ({ 
  computeAgingImpact: vi.fn(() => ({})) 
}));

vi.mock("@/engine/health", () => ({ 
  computeHealthImpact: vi.fn(() => ({})),
  applyHealthUpdates: vi.fn((state) => state)
}));

vi.mock("@/engine/impacts", () => ({
  resolveImpacts: vi.fn((state) => ({ ...state })),
  mergeImpacts: vi.fn((impacts) => impacts)
}));

// Mock procedural steps
vi.mock("@/engine/recruitment", () => ({
  partialRefreshPool: vi.fn(pool => pool),
  aiDraftFromPool: vi.fn(() => ({ updatedPool: [], updatedRivals: [], gazetteItems: [] }))
}));

vi.mock("@/engine/gazetteNarrative", () => ({
  generateWeeklyGazette: vi.fn(() => ({ title: "Test", regions: [] }))
}));

describe("advanceWeek pipeline orchestration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls all impact computation functions", () => {
    const state = createFreshState("test-seed-week");
    advanceWeek(state);

    expect(Training.computeTrainingImpact).toHaveBeenCalled();
    expect(Economy.computeEconomyImpact).toHaveBeenCalled();
    expect(Aging.computeAgingImpact).toHaveBeenCalled();
    expect(Health.computeHealthImpact).toHaveBeenCalled();
  });

  it("resolves collected impacts using resolveImpacts", () => {
    const state = createFreshState("test-seed-week");
    advanceWeek(state);

    expect(Impacts.resolveImpacts).toHaveBeenCalled();
  });

  it("advances the week counter and returns a new state", () => {
    const state = createFreshState("test-seed");
    const originalWeek = state.week;
    
    // We mock resolveImpacts to return the state it received
    vi.mocked(Impacts.resolveImpacts).mockImplementation((s) => ({ ...s }));

    const next = advanceWeek(state);
    
    expect(next.week).toBe(originalWeek + 1);
    expect(next).not.toBe(state);
  });
});
