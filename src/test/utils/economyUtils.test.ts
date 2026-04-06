import { describe, it, expect } from "vitest";
import { canTransact } from "@/utils/economyUtils";

describe("Economy Utility - canTransact", () => {
  it("returns true if treasury exceeds cost", () => {
    expect(canTransact(500, 100)).toBe(true);
  });

  it("returns true if treasury equals cost", () => {
    expect(canTransact(100, 100)).toBe(true);
  });

  it("returns false if treasury is insufficient", () => {
    expect(canTransact(50, 100)).toBe(false);
  });

  it("throws Error on negative cost inputs", () => {
    expect(() => canTransact(100, -50)).toThrow(/negative cost/i);
  });

  it("returns true for zero cost even with zero treasury", () => {
    expect(canTransact(0, 0)).toBe(true);
  });
});
