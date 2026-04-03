import { describe, it, expect, vi, beforeEach } from "vitest";
import { applyRivalAI, applyRecruitment } from "@/engine/pipeline/rivals";
import { type GameState } from "@/types/game";
import * as matchmakingModule from "@/engine/matchmaking";
import * as ownerRosterModule from "@/engine/ownerRoster";
import * as draftServiceModule from "@/engine/draftService";

vi.mock("@/engine/matchmaking", () => ({
  runAIvsAIBouts: vi.fn(),
}));

vi.mock("@/engine/ownerRoster", () => ({
  processAIRosterManagement: vi.fn(),
}));

vi.mock("@/engine/draftService", () => ({
  aiDraftFromPool: vi.fn(),
}));

describe("applyRivalAI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should process AI bouts and roster management when rivals exist", () => {
    const mockState = {
      week: 10,
      rivals: [{ id: "r1" }],
      newsletter: [],
    } as unknown as GameState;

    const boutResult = {
      updatedRivals: [{ id: "r1", updatedBout: true }],
      gazetteItems: ["Bout result"],
    };

    const rosterResult = {
      updatedRivals: [{ id: "r1", updatedBout: true, updatedRoster: true }],
      gazetteItems: ["Roster change"],
    };

    vi.spyOn(matchmakingModule, "runAIvsAIBouts").mockReturnValue(boutResult as any);
    vi.spyOn(ownerRosterModule, "processAIRosterManagement").mockReturnValue(rosterResult as any);

    const newState = applyRivalAI(mockState);

    expect(matchmakingModule.runAIvsAIBouts).toHaveBeenCalled();
    expect(ownerRosterModule.processAIRosterManagement).toHaveBeenCalledWith(expect.objectContaining({ rivals: boutResult.updatedRivals }));

    expect(newState.rivals).toBe(rosterResult.updatedRivals);
    expect(newState.newsletter?.length).toBe(2);
    expect(newState.newsletter?.[0]).toEqual({
      week: 10,
      title: "Rival Arena Report",
      items: ["Bout result"],
    });
    expect(newState.newsletter?.[1]).toEqual({
      week: 10,
      title: "Stable Management",
      items: ["Roster change"],
    });
  });

  it("should do nothing if there are no rivals", () => {
    const mockState = {
      week: 10,
      rivals: [],
    } as unknown as GameState;

    const newState = applyRivalAI(mockState);

    expect(matchmakingModule.runAIvsAIBouts).not.toHaveBeenCalled();
    expect(ownerRosterModule.processAIRosterManagement).not.toHaveBeenCalled();
    expect(newState).toEqual(mockState);
  });

  it("should handle empty gazette items correctly", () => {
    const mockState = {
      week: 10,
      rivals: [{ id: "r1" }],
    } as unknown as GameState;

    const boutResult = {
      updatedRivals: [{ id: "r1" }],
      gazetteItems: [],
    };

    const rosterResult = {
      updatedRivals: [{ id: "r1" }],
      gazetteItems: [],
    };

    vi.spyOn(matchmakingModule, "runAIvsAIBouts").mockReturnValue(boutResult as any);
    vi.spyOn(ownerRosterModule, "processAIRosterManagement").mockReturnValue(rosterResult as any);

    const newState = applyRivalAI(mockState);

    expect(newState.newsletter).toBeUndefined();
  });

  describe("applyRecruitment", () => {
    it("should run AI draft if rivals and recruit pool exist", () => {
      const mockState = {
        week: 5,
        recruitPool: [{ id: "r1" }],
        rivals: [{ id: "rival1" }],
        newsletter: [],
      } as unknown as GameState;

      const draftResult = {
        updatedPool: [],
        updatedRivals: [{ id: "rival1", roster: [{ id: "r1" }] }],
        gazetteItems: ["Draft occurred"],
      };

      vi.spyOn(draftServiceModule, "aiDraftFromPool").mockReturnValue(draftResult as any);

      const newState = applyRecruitment(mockState);

      expect(draftServiceModule.aiDraftFromPool).toHaveBeenCalledWith(mockState.recruitPool, mockState.rivals, mockState.week);

      expect(newState.recruitPool).toBe(draftResult.updatedPool);
      expect(newState.rivals).toBe(draftResult.updatedRivals);
      expect(newState.newsletter?.length).toBe(1);
      expect(newState.newsletter?.[0]).toEqual({
        week: 5,
        title: "Draft Report",
        items: draftResult.gazetteItems,
      });
    });

    it("should not run AI draft if there are no rivals or recruit pool is empty", () => {
      const mockStateNoRivals = { week: 5, recruitPool: [{ id: "r1" }], rivals: [] } as unknown as GameState;
      const mockStateNoPool = { week: 5, recruitPool: [], rivals: [{ id: "rival1" }] } as unknown as GameState;

      const newState1 = applyRecruitment(mockStateNoRivals);
      const newState2 = applyRecruitment(mockStateNoPool);

      expect(draftServiceModule.aiDraftFromPool).not.toHaveBeenCalled();

      expect(newState1).toEqual(mockStateNoRivals);
      expect(newState2).toEqual(mockStateNoPool);
    });

    it("should not add newsletter item if draft items are empty", () => {
      const mockState = {
        week: 5,
        recruitPool: [{ id: "r1" }],
        rivals: [{ id: "rival1" }],
      } as unknown as GameState;

      const draftResult = {
        updatedPool: [],
        updatedRivals: [{ id: "rival1", roster: [{ id: "r1" }] }],
        gazetteItems: [],
      };

      vi.spyOn(draftServiceModule, "aiDraftFromPool").mockReturnValue(draftResult as any);

      const newState = applyRecruitment(mockState);

      expect(newState.newsletter).toBeUndefined();
    });
  });
});
