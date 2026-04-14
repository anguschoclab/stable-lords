import { describe, it, expect } from "vitest";
import { getTagDescription } from "@/data/tagDescriptions";
import narrativeContent from "@/data/narrativeContent.json";

describe("getTagDescription", () => {
  it("should return the correct description for flair tags", () => {
    const tag = "Flashy";
    const expected = narrativeContent.meta.flair.Flashy;
    expect(getTagDescription(tag)).toBe(expected);
  });

  it("should return the correct description for title tags", () => {
    const tag = "Champion";
    const expected = narrativeContent.meta.title.Champion;
    expect(getTagDescription(tag)).toBe(expected);
  });

  it("should return the correct description for injury tags", () => {
    const tag = "Broken Arm";
    const expected = narrativeContent.meta.injury["Broken Arm"];
    expect(getTagDescription(tag)).toBe(expected);
  });

  it("should return the correct description for status tags", () => {
    const activeExpected = (narrativeContent.meta as any).status.Active;
    const deadExpected = (narrativeContent.meta as any).status.Dead;
    const retiredExpected = (narrativeContent.meta as any).status.Retired;

    expect(getTagDescription("Active")).toBe(activeExpected);
    expect(getTagDescription("Dead")).toBe(deadExpected);
    expect(getTagDescription("Retired")).toBe(retiredExpected);
  });

  it("should return a fallback message for unknown tags", () => {
    const unknownTag = "SuperLegendary";
    const expectedFallback = `${unknownTag} — a notable trait earned through arena combat.`;
    expect(getTagDescription(unknownTag)).toBe(expectedFallback);
  });

  it("should handle empty strings by returning the fallback message", () => {
    const emptyTag = "";
    const expectedFallback = `${emptyTag} — a notable trait earned through arena combat.`;
    expect(getTagDescription(emptyTag)).toBe(expectedFallback);
  });
});
