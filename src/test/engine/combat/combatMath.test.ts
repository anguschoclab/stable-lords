import { describe, it, expect } from "vitest";
import { getPhase } from "../../../engine/combat/combatMath";

describe("getPhase", () => {
  it("returns 'opening' when ratio is exactly the threshold (0.25)", () => {
    // 2.5 / 10 = 0.25
    expect(getPhase(2.5, 10)).toBe("opening");
  });

  it("returns 'opening' when ratio is below the threshold (< 0.25)", () => {
    // 2 / 10 = 0.2
    expect(getPhase(2, 10)).toBe("opening");
    expect(getPhase(0, 10)).toBe("opening");
  });

  it("returns 'mid' when ratio is exactly the mid threshold (0.65)", () => {
    // 6.5 / 10 = 0.65
    expect(getPhase(6.5, 10)).toBe("mid");
  });

  it("returns 'mid' when ratio is between opening and mid thresholds", () => {
    // 3 / 10 = 0.3
    expect(getPhase(3, 10)).toBe("mid");
    // 5 / 10 = 0.5
    expect(getPhase(5, 10)).toBe("mid");
  });

  it("returns 'late' when ratio is above the mid threshold (> 0.65)", () => {
    // 7 / 10 = 0.7
    expect(getPhase(7, 10)).toBe("late");
    expect(getPhase(10, 10)).toBe("late");
  });
});
