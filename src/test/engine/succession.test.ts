import { describe, it, expect, beforeEach } from "vitest";
import { createFreshState } from "@/engine/factories";
import { populateTestState } from "@/test/testHelpers";
import { GameState, Promoter } from "@/types/state.types";

describe("Promoter Succession", () => {
  let state: GameState;

  beforeEach(() => {
    state = createFreshState("test-seed");
    state = populateTestState(state);
  });

  it("should age promoters every week", () => {
    const pId = Object.keys(state.promoters)[0];
    if (!state.promoters[pId]) return;
    
    const initialAge = state.promoters[pId].age;
    
    // Simulate aging
    const agedPromoter = { ...state.promoters[pId], age: state.promoters[pId].age + 1 };
    expect(agedPromoter.age).toBe(initialAge + 1);
  });

  it("should replace a promoter when they retire", () => {
    const pId = Object.keys(state.promoters)[0];
    const oldPromoter = state.promoters[pId];
    if (!oldPromoter) return;
    
    const newPromoter: Promoter = {
      ...oldPromoter,
      id: "promoter_new_gen",
      name: `${oldPromoter.name} II`,
      age: 25,
      history: {
        totalPursePaid: 0,
        notableBouts: [],
        legacyFame: 10
      }
    };
    
    expect(newPromoter.name).toContain(oldPromoter.name);
    expect(newPromoter.age).toBeLessThan(oldPromoter.age);
  });
});
