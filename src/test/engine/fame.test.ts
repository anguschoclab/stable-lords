import { describe, it, expect } from "vitest";
import { fameFromTags } from "@/engine/fame";

describe("fameFromTags", () => {
  it("returns zero for no tags", () => {
    const result = fameFromTags([]);
    expect(result.fame).toBe(0);
    expect(result.pop).toBe(0);
    expect(result.labels).toEqual([]);
  });

  it("awards fame for Kill", () => {
    const result = fameFromTags(["Kill"]);
    expect(result.fame).toBe(3);
    expect(result.labels).toContainEqual(expect.stringContaining("Kill"));
  });

  it("awards fame and pop for KO", () => {
    const result = fameFromTags(["KO"]);
    expect(result.fame).toBe(2);
    expect(result.pop).toBe(1);
  });

  it("awards pop for Flashy", () => {
    const result = fameFromTags(["Flashy"]);
    expect(result.pop).toBe(2);
  });

  it("stacks multiple tags", () => {
    const result = fameFromTags(["Kill", "Flashy", "Comeback", "Dominance"]);
    // Kill(3) + Comeback(1) + Dominance(1) = 5 fame
    expect(result.fame).toBe(5);
    // Flashy(2) + Comeback(1) = 3 pop
    expect(result.pop).toBe(3);
  });

  it("applies dampener above 5", () => {
    const result = fameFromTags(["Kill", "KO", "Comeback", "RiposteChain", "Dominance"]);
    // Raw: 3+2+1+1+1 = 8, dampened: 5 + floor((8-5)*0.5) = 5+1 = 6
    expect(result.fame).toBe(6);
  });

  it("handles undefined tags gracefully", () => {
    const result = fameFromTags(undefined as unknown);
    expect(result.fame).toBe(0);
    expect(result.pop).toBe(0);
  });

  it("awards pop for bloody", () => {
    const result = fameFromTags(["bloody"]);
    expect(result.pop).toBe(2);
    expect(result.labels).toContain("Popularity +2 (Bloody)");
  });

  it("awards pop for upset", () => {
    const result = fameFromTags(["upset"]);
    expect(result.pop).toBe(5);
    expect(result.labels).toContain("Popularity +5 (Upset)");
  });

  it("decreases pop for quick", () => {
    const result = fameFromTags(["quick"]);
    expect(result.pop).toBe(-1);
    expect(result.labels).toContain("Popularity -1 (Quick)");
  });

  it("awards pop for epic with dampener", () => {
    const result = fameFromTags(["epic"]);
    // Raw: 10, dampened: 5 + floor((10-5)*0.5) = 5+2 = 7
    expect(result.pop).toBe(7);
    expect(result.labels).toContain("Popularity +10 (Epic)");
  });

  it("stacks new tags with existing tags", () => {
    const result = fameFromTags(["Kill", "upset", "bloody"]);
    // Fame: Kill(3) = 3
    // Pop: upset(5) + bloody(2) = 7, dampened: 5 + floor((7-5)*0.5) = 6
    expect(result.fame).toBe(3);
    expect(result.pop).toBe(6);
    expect(result.labels).toHaveLength(3);
  });
});
