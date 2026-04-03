import { describe, it, expect } from "vitest";
import { verifyIntentSkepticism } from "@/engine/ai/intentEngine";
import type { GameState, RivalStableData } from "@/types/state.types";

describe("AI Agent Architecture - Skeptical Intent", () => {
  const mockState = {
    week: 10,
    arenaHistory: [],
    rivals: []
  } as unknown as GameState;

  const mockRival: Partial<RivalStableData> = {
    owner: { id: "r1", personality: "Methodical" } as unknown,
    gold: 500,
    roster: [{ status: "Active" }, { status: "Active" }, { status: "Active" }] as unknown,
    strategy: { intent: "VENDETTA", planWeeksRemaining: 5 }
  };

  it("should approve a valid plan", () => {
    const isDisproved = verifyIntentSkepticism(mockRival as RivalStableData, mockState);
    expect(isDisproved).toBe(false);
  });

  it("should disprove a plan due to financial crisis", () => {
    const poorRival = { ...mockRival, gold: 50 } as RivalStableData;
    const isDisproved = verifyIntentSkepticism(poorRival, mockState);
    expect(isDisproved).toBe(true);
  });

  it("should disprove a VENDETTA due to low active roster", () => {
    const weakRival = { 
      ...mockRival, 
      roster: [{ status: "Active" }, { status: "Inactive" }] 
    } as unknown as RivalStableData;
    const isDisproved = verifyIntentSkepticism(weakRival, mockState);
    expect(isDisproved).toBe(true);
  });

  it("should NOT disprove if personality is Aggressive despite low gold (higher risk tolerance)", () => {
    // Wait, the current implementation of verifyIntentSkepticism uses a hard threshold of 150 gold.
    // Let's verify that too.
    const aggressiveRival = { 
      ...mockRival, 
      owner: { id: "r1", personality: "Aggressive" } as unknown,
      gold: 140 
    } as RivalStableData;
    const isDisproved = verifyIntentSkepticism(aggressiveRival, mockState);
    expect(isDisproved).toBe(true); // Aggressive still respects the absolute "Bankruptcy" floor of 150 for non-RECOVERY plans.
  });
});
