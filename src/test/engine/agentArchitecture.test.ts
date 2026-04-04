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
    const aggressiveRival = { 
      ...mockRival, 
      owner: { id: "r1", personality: "Aggressive" } as unknown,
      gold: 140 
    } as RivalStableData;
    const isDisproved = verifyIntentSkepticism(aggressiveRival, mockState);
    expect(isDisproved).toBe(true); 
  });
});

import { verifyBoutAcceptance } from "@/engine/ai/workers/competitionWorker";
import { type Warrior, type WeatherType } from "@/types/game";

describe("AI Agent Architecture - Weather Skepticism", () => {
  const lungeWarrior = { 
    id: "w1", 
    name: "Lunge Buster", 
    style: "LungingAttack", 
    attributes: { CN: 10 }
  } as unknown as Warrior;
  
  const tankWarrior = { 
    id: "w2", 
    name: "Iron Wall", 
    style: "Guard", 
    attributes: { CN: 60 }
  } as unknown as Warrior;

  const mockRival = { gold: 500, owner: { personality: "Aggressive" } } as unknown as RivalStableData;

  it("should decline a bout for LungingAttack in Rainy weather", () => {
    const mockCalculated = { gold: 500, owner: { personality: "Calculated" } } as unknown as RivalStableData;
    const decision = verifyBoutAcceptance(mockCalculated, lungeWarrior, tankWarrior, mockRival, "Rainy");
    expect(decision.accepted).toBe(false);
    expect(decision.reason).toContain("Precision penalty");
  });

  it("should accept a bout for LungingAttack in Clear weather", () => {
    const mockCalculated = { gold: 500, owner: { personality: "Calculated" } } as unknown as RivalStableData;
    const decision = verifyBoutAcceptance(mockCalculated, lungeWarrior, tankWarrior, mockRival, "Clear");
    expect(decision.accepted).toBe(true);
  });

  it("should decline a bout for low CON warrior in Scalding weather", () => {
    const mockCalculated = { gold: 500, owner: { personality: "Calculated" } } as unknown as RivalStableData;
    const decision = verifyBoutAcceptance(mockCalculated, lungeWarrior, tankWarrior, mockRival, "Scalding");
    expect(decision.accepted).toBe(false);
    expect(decision.reason).toContain("Heatstroke");
  });

  it("should accept a bout for high CON warrior in Scalding weather", () => {
    const mockCalculated = { gold: 500, owner: { personality: "Calculated" } } as unknown as RivalStableData;
    const decision = verifyBoutAcceptance(mockCalculated, tankWarrior, lungeWarrior, mockRival, "Scalding");
    expect(decision.accepted).toBe(true);
  });
});
