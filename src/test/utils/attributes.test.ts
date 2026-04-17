import { describe, it, expect } from "vitest";
import { sumAttributes, sumAttributesByKey } from "@/utils/attributes";
import type { Attributes } from "@/types/shared.types";

describe("sumAttributes", () => {
  it("sums all attribute values", () => {
    const attrs: Attributes = { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };
    const sum = sumAttributes(attrs);
    expect(sum).toBe(70);
  });

  it("handles different attribute values", () => {
    const attrs: Attributes = { ST: 15, CN: 12, SZ: 8, WT: 14, WL: 11, SP: 9, DF: 13 };
    const sum = sumAttributes(attrs);
    expect(sum).toBe(82);
  });

  it("handles zero values", () => {
    const attrs: Attributes = { ST: 0, CN: 0, SZ: 0, WT: 0, WL: 0, SP: 0, DF: 0 };
    const sum = sumAttributes(attrs);
    expect(sum).toBe(0);
  });
});

describe("sumAttributesByKey", () => {
  it("sums specific attribute keys", () => {
    const attrs: Attributes = { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };
    const sum = sumAttributesByKey(attrs, ["ST", "CN"]);
    expect(sum).toBe(20);
  });

  it("handles empty key array", () => {
    const attrs: Attributes = { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };
    const sum = sumAttributesByKey(attrs, []);
    expect(sum).toBe(0);
  });

  it("handles all keys", () => {
    const attrs: Attributes = { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };
    const sum = sumAttributesByKey(attrs, ["ST", "CN", "SZ", "WT", "WL", "SP", "DF"]);
    expect(sum).toBe(70);
  });

  it("handles non-existent keys gracefully", () => {
    const attrs: Attributes = { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };
    const sum = sumAttributesByKey(attrs, ["ST", "INVALID"]);
    expect(sum).toBe(10);
  });
});
