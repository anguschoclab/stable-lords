import { describe, it, expect } from "vitest";
import { createFreshState, advanceWeek } from "./src/engine/factories";

describe("Debug Aging", () => {
  it("should age after 52 weeks", () => {
    let state = createFreshState("debug");
    console.log("Initial Week:", state.week, "Initial Age:", state.roster[0]?.age);
    
    for (let i = 0; i < 52; i++) {
      state = advanceWeek(state);
      if (state.week === 1) {
         console.log("Loop", i, "reached Week 1. Year:", state.year, "Current Age:", state.roster[0]?.age);
      }
    }
    
    console.log("Final Week:", state.week, "Final Year:", state.year, "Final Age:", state.roster[0]?.age);
    expect(state.year).toBe(2);
    expect(state.week).toBe(1);
    expect(state.roster[0].age).toBeGreaterThan(18); // assuming default is 18-20
  });
});
