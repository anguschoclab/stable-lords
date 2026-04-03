import { describe, it, expect, vi, beforeEach } from "vitest";
import { applyNarrative } from "@/engine/pipeline/narrative";
import { type GameState } from "@/types/game";
import * as historyUtilsModule from "@/engine/core/historyUtils";
import * as gazetteModule from "@/engine/gazetteNarrative";

vi.mock("@/engine/core/historyUtils", () => ({
  getFightsForWeek: vi.fn(),
}));

vi.mock("@/engine/gazetteNarrative", () => ({
  generateWeeklyGazette: vi.fn(),
}));

describe("applyNarrative", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate a gazette and add it to the state", () => {
    const mockState = {
      week: 10,
      arenaHistory: [],
      crowdMood: 50,
      graveyard: [],
      gazettes: [{ week: 9, headline: "Old news", content: "..." }],
    } as unknown as GameState;

    const mockFights = [{ id: "fight1" }];
    const mockGazette = { headline: "New news", content: "..." };

    vi.spyOn(historyUtilsModule, "getFightsForWeek").mockReturnValue(mockFights as any);
    vi.spyOn(gazetteModule, "generateWeeklyGazette").mockReturnValue(mockGazette as any);

    const newState = applyNarrative(mockState);

    expect(historyUtilsModule.getFightsForWeek).toHaveBeenCalledWith(mockState.arenaHistory, mockState.week);
    expect(gazetteModule.generateWeeklyGazette).toHaveBeenCalledWith(
      mockFights,
      mockState.crowdMood,
      mockState.week,
      mockState.graveyard,
      mockState.arenaHistory
    );

    expect(newState.gazettes?.length).toBe(2);
    expect(newState.gazettes?.[1]).toEqual({ ...mockGazette, week: 10 });
  });

  it("should handle undefined gazettes and slice to 50 issues", () => {
    const mockState = {
      week: 10,
      arenaHistory: [],
      crowdMood: 50,
      graveyard: [],
    } as unknown as GameState;

    const mockGazette = { headline: "New news", content: "..." };

    vi.spyOn(historyUtilsModule, "getFightsForWeek").mockReturnValue([]);
    vi.spyOn(gazetteModule, "generateWeeklyGazette").mockReturnValue(mockGazette as any);

    // Give it 50 existing issues manually
    const mockStateWith50 = {
      ...mockState,
      gazettes: Array.from({ length: 50 }).map((_, i) => ({ week: i, headline: `News ${i}`, content: "..." })),
    } as unknown as GameState;

    const newState = applyNarrative(mockStateWith50);

    expect(newState.gazettes?.length).toBe(50);
    // The oldest issue (week: 0) should be removed, the new one (week: 10) added at the end
    expect(newState.gazettes?.[49]).toEqual({ ...mockGazette, week: 10 });
    expect(newState.gazettes?.[0].week).toBe(1);
  });
});
