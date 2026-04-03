import { describe, it, expect, vi, beforeEach } from "vitest";
import { applyRecruitPoolRefresh } from "@/engine/pipeline/recruitment";
import { type GameState } from "@/types/game";
import * as recruitmentModule from "@/engine/recruitment";

vi.mock("@/engine/recruitment", () => ({
  partialRefreshPool: vi.fn(),
}));

describe("pipeline/recruitment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("applyRecruitPoolRefresh", () => {
    it("should extract used names and refresh the recruit pool", () => {
      const mockState = {
        week: 5,
        roster: [{ name: "RosterWarrior" }],
        graveyard: [{ name: "DeadWarrior" }],
        rivals: [
          { roster: [{ name: "RivalWarrior1" }, { name: "RivalWarrior2" }] }
        ],
        recruitPool: [],
      } as unknown as GameState;

      const mockNewPool = [{ name: "NewRecruit" }];
      vi.spyOn(recruitmentModule, "partialRefreshPool").mockReturnValue(mockNewPool as any);

      const newState = applyRecruitPoolRefresh(mockState);

      const expectedUsedNames = new Set(["RosterWarrior", "DeadWarrior", "RivalWarrior1", "RivalWarrior2"]);
      expect(recruitmentModule.partialRefreshPool).toHaveBeenCalledWith(mockState.recruitPool, mockState.week, expectedUsedNames);
      expect(newState.recruitPool).toBe(mockNewPool);
    });

    it("should handle missing optional arrays gracefully", () => {
      const mockState = {
        week: 5,
        roster: [],
        graveyard: [],
      } as unknown as GameState;

      const mockNewPool = [{ name: "NewRecruit" }];
      vi.spyOn(recruitmentModule, "partialRefreshPool").mockReturnValue(mockNewPool as any);

      const newState = applyRecruitPoolRefresh(mockState);

      expect(recruitmentModule.partialRefreshPool).toHaveBeenCalledWith([], mockState.week, new Set());
      expect(newState.recruitPool).toBe(mockNewPool);
    });
  });
});
