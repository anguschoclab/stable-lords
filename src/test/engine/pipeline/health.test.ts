import { vi } from "vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { computeHealthImpact, applyHealthUpdates } from "@/engine/health";
import { type GameState, type Warrior, type InjuryData } from "@/types/game";
import * as injuriesModule from "@/engine/injuries";
import * as matchmakingModule from "@/engine/matchmaking/historyLogic";



describe("pipeline/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("computeHealthImpact", () => {
    it("should handle warriors with missing, null, or string-only injuries gracefully", () => {
      const mockState = {
        week: 5,
        roster: [
          { id: "w1", name: "Warrior 1" }, // missing injuries
          { id: "w2", name: "Warrior 2", injuries: null }, // null injuries
          { id: "w3", name: "Warrior 3", injuries: ["string_injury"] }, // string-only injuries
        ],
      } as unknown as GameState;

      const impact = computeHealthImpact(mockState);

      expect(injuriesModule.tickInjuries).not.toHaveBeenCalled();
      expect(impact.rosterUpdates?.size).toBe(0);
      expect(impact.newsletterItems).toEqual([]);
    });

    it("should process injuries and return updates", () => {
      const mockInjury = { id: "i1", name: "cut", description: "cut", severity: "Minor", weeksRemaining: 2, penalties: {} } as InjuryData;
      const mockState = {
        week: 5,
        roster: [
          { id: "w1", name: "Warrior 1", injuries: [mockInjury] },
          { id: "w2", name: "Warrior 2", injuries: [] },
          { id: "w3", name: "Warrior 3", injuries: ["old_format"] },
        ],
      } as unknown as GameState;

      vi.spyOn(injuriesModule, "tickInjuries").mockReturnValue({
        active: [{ ...mockInjury, weeksRemaining: 1 }],
        healed: ["sprain"],
      });

      const impact = computeHealthImpact(mockState);

      expect(injuriesModule.tickInjuries).toHaveBeenCalledTimes(1);
      expect(injuriesModule.tickInjuries).toHaveBeenCalledWith([mockInjury]);

      expect(impact.rosterUpdates?.size).toBe(1);
      expect(impact.rosterUpdates?.get("w1")).toEqual({ injuries: [{ ...mockInjury, weeksRemaining: 1 }] });

      expect(impact.newsletterItems?.length).toBe(1);
      expect(impact.newsletterItems?.[0]).toEqual({
        week: 5,
        title: "Medical Report",
        items: ["Warrior 1 recovered from sprain."],
      });
    });

    it("should return empty updates if no injuries to process", () => {
      const mockState = {
        week: 5,
        roster: [
          { id: "w2", name: "Warrior 2", injuries: [] },
        ],
      } as unknown as GameState;

      const impact = computeHealthImpact(mockState);

      expect(injuriesModule.tickInjuries).not.toHaveBeenCalled();
      expect(impact.rosterUpdates?.size).toBe(0);
      expect(impact.newsletterItems).toEqual([]);
    });

    it("should omit newsletter if no injuries healed", () => {
      const mockInjury = { id: "i1", name: "cut", description: "cut", severity: "Minor", weeksRemaining: 2, penalties: {} } as InjuryData;
      const mockState = {
        week: 5,
        roster: [
          { id: "w1", name: "Warrior 1", injuries: [mockInjury] },
        ],
      } as unknown as GameState;

      vi.spyOn(injuriesModule, "tickInjuries").mockReturnValue({
        active: [{ ...mockInjury, weeksRemaining: 1 }],
        healed: [],
      });

      const impact = computeHealthImpact(mockState);

      expect(impact.newsletterItems).toEqual([]);
    });
  });

  describe("applyHealthUpdates", () => {
    it("should apply computed impacts to the state", () => {
      const mockInjury = { id: "i1", name: "cut", description: "cut", severity: "Minor", weeksRemaining: 2, penalties: {} } as InjuryData;
      const mockState = {
        week: 5,
        roster: [
          { id: "w1", name: "Warrior 1", injuries: [mockInjury] },
          { id: "w2", name: "Warrior 2", injuries: [] },
        ],
        restStates: [{ warriorId: "w1", restUntilWeek: 4 }],
        newsletter: [],
      } as unknown as GameState;

      vi.spyOn(injuriesModule, "tickInjuries").mockReturnValue({
        active: [{ ...mockInjury, weeksRemaining: 1 }],
        healed: ["sprain"],
      });

      vi.spyOn(matchmakingModule, "clearExpiredRest").mockReturnValue([]);

      const newState = applyHealthUpdates(mockState);

      expect(matchmakingModule.clearExpiredRest).toHaveBeenCalledWith(mockState.restStates, 5);

      expect(newState.roster.find(w => w.id === "w1")?.injuries).toEqual([{ ...mockInjury, weeksRemaining: 1 }]);
      expect(newState.roster.find(w => w.id === "w2")?.injuries).toEqual([]);
      expect(newState.restStates).toEqual([]);
      expect(newState.newsletter?.length).toBe(1);
    });

    it("should handle state with undefined restStates and newsletter", () => {
      const mockInjury = { id: "i1", name: "cut", description: "cut", severity: "Minor", weeksRemaining: 2, penalties: {} } as InjuryData;
      const mockState = {
        week: 5,
        roster: [
          { id: "w1", name: "Warrior 1", injuries: [mockInjury] },
        ],
      } as unknown as GameState;

      vi.spyOn(injuriesModule, "tickInjuries").mockReturnValue({
        active: [],
        healed: ["sprain"],
      });

      vi.spyOn(matchmakingModule, "clearExpiredRest").mockReturnValue([]);

      const newState = applyHealthUpdates(mockState);

      expect(matchmakingModule.clearExpiredRest).toHaveBeenCalledWith([], 5);
      expect(newState.newsletter?.length).toBe(1);
      expect(newState.restStates).toEqual([]);
    });
  });
});
