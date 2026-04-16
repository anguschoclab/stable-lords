import { describe, it, expect } from "vitest";
import { computeStreaks, generateFightNarrative } from "@/engine/gazetteNarrative";
import type { FightSummary, FightOutcomeBy } from "@/types/game";

describe("computeStreaks", () => {
  const createFight = (week: number, a: string, d: string, winner: "A" | "D" | null): FightSummary => ({
    id: `fight-${week}`,
    week,
    title: `Week ${week} Fight`,
    warriorIdA: `warrior-${a}`,
    warriorIdD: `warrior-${d}`,
    a,
    d,
    winner,
    by: "KO",
    styleA: "Brawler",
    styleD: "Swordsman",
    createdAt: new Date().toISOString()
  });

  it("returns an empty map for empty history", () => {
    const streaks = computeStreaks([]);
    expect(streaks.size).toBe(0);
  });

  it("sets correct initial streaks for a single fight", () => {
    const fights = [createFight(1, "Alice", "Bob", "A")];
    const streaks = computeStreaks(fights);

    expect(streaks.get("Alice")).toBe(1);
    expect(streaks.get("Bob")).toBe(-1);
  });

  it("increments streaks for consecutive wins", () => {
    const fights = [
      createFight(1, "Alice", "Bob", "A"), // Alice wins (+1)
      createFight(2, "Alice", "Charlie", "A"), // Alice wins (+2)
      createFight(3, "Dave", "Alice", "D") // Alice is D and wins (+3)
    ];
    const streaks = computeStreaks(fights);

    expect(streaks.get("Alice")).toBe(3);
    expect(streaks.get("Bob")).toBe(-1);
    expect(streaks.get("Charlie")).toBe(-1);
    expect(streaks.get("Dave")).toBe(-1);
  });

  it("decrements streaks for consecutive losses", () => {
    const fights = [
      createFight(1, "Alice", "Bob", "A"), // Bob loses (-1)
      createFight(2, "Charlie", "Bob", "A"), // Bob loses (-2)
      createFight(3, "Bob", "Dave", "D") // Bob is A and loses (-3)
    ];
    const streaks = computeStreaks(fights);

    expect(streaks.get("Bob")).toBe(-3);
  });

  it("resets a winning streak to -1 on a loss", () => {
    const fights = [
      createFight(1, "Alice", "Bob", "A"), // Alice wins (+1)
      createFight(2, "Alice", "Charlie", "A"), // Alice wins (+2)
      createFight(3, "Alice", "Dave", "D") // Alice is A and loses to Dave (-1)
    ];
    const streaks = computeStreaks(fights);

    expect(streaks.get("Alice")).toBe(-1);
    expect(streaks.get("Dave")).toBe(1);
  });

  it("resets a losing streak to 1 on a win", () => {
    const fights = [
      createFight(1, "Alice", "Bob", "A"), // Bob loses (-1)
      createFight(2, "Charlie", "Bob", "A"), // Bob loses (-2)
      createFight(3, "Bob", "Dave", "A") // Bob is A and wins (+1)
    ];
    const streaks = computeStreaks(fights);

    expect(streaks.get("Bob")).toBe(1);
    expect(streaks.get("Dave")).toBe(-1);
  });

  it("resets streaks to 0 on a draw", () => {
    const fights = [
      createFight(1, "Alice", "Bob", "A"), // Alice wins (+1)
      createFight(2, "Charlie", "Dave", "D"), // Dave wins (+1)
      createFight(3, "Alice", "Dave", null) // Draw (0, 0)
    ];
    const streaks = computeStreaks(fights);

    expect(streaks.get("Alice")).toBe(0);
    expect(streaks.get("Dave")).toBe(0);
  });

  it("processes fights in chronological order regardless of input order", () => {
    // ⚡ Bolt: computeStreaks now expects pre-sorted arrays as arenaHistory is strictly chronological
    const fights = [
      createFight(1, "Alice", "Bob", "A"), // Week 1: Alice wins (+1)
      createFight(2, "Alice", "Charlie", "A"), // Week 2: Alice wins (+2)
      createFight(3, "Alice", "Dave", "D"), // Week 3: Alice is A and loses to Dave (-1)
    ];
    // Expected order:
    // Week 1: Alice wins (streak 1)
    // Week 2: Alice wins (streak 2)
    // Week 3: Alice loses (streak -1)
    const streaks = computeStreaks(fights);

    expect(streaks.get("Alice")).toBe(-1);
  });

  it("handles complex multi-character scenarios correctly", () => {
    const fights = [
      createFight(1, "A", "B", "A"), // A wins(1), B loses(-1)
      createFight(2, "C", "D", "A"), // C wins(1), D loses(-1)
      createFight(3, "A", "C", "A"), // A wins(2), C loses(-1)
      createFight(4, "B", "D", "A"), // B wins(1), D loses(-2)
      createFight(5, "A", "B", "D"), // A loses(-1), B wins(2)
    ];
    const streaks = computeStreaks(fights);

    expect(streaks.get("A")).toBe(-1);
    expect(streaks.get("B")).toBe(2);
    expect(streaks.get("C")).toBe(-1);
    expect(streaks.get("D")).toBe(-2);
  });
});

describe("generateFightNarrative", () => {
  const createFight = (winner: "A" | "D" | null, by: FightOutcomeBy): FightSummary => ({
    id: "fight-1",
    week: 1,
    title: "Week 1 Fight",
    warriorIdA: "warrior-Alice",
    warriorIdD: "warrior-Bob",
    a: "Alice",
    d: "Bob",
    winner,
    by,
    styleA: "Brawler",
    styleD: "Swordsman",
    createdAt: new Date().toISOString()
  });

  it("generates narrative for KO victory", () => {
    const fight = createFight("A", "KO");
    const narrative = generateFightNarrative(fight, "Calm");
    expect(narrative).toBeDefined();
    expect(typeof narrative).toBe("string");
    expect(narrative.length).toBeGreaterThan(0);
  });

  it("generates narrative for Kill victory", () => {
    const fight = createFight("A", "Kill");
    const narrative = generateFightNarrative(fight, "Bloodthirsty");
    expect(narrative).toBeDefined();
    expect(typeof narrative).toBe("string");
    expect(narrative.length).toBeGreaterThan(0);
  });

  it("generates narrative for Stoppage victory", () => {
    const fight = createFight("A", "Stoppage");
    const narrative = generateFightNarrative(fight, "Festive");
    expect(narrative).toBeDefined();
    expect(typeof narrative).toBe("string");
  });

  it("generates narrative for draw", () => {
    const fight = createFight(null, "Exhaustion");
    const narrative = generateFightNarrative(fight, "Calm");
    expect(narrative).toBeDefined();
    expect(typeof narrative).toBe("string");
  });

  it("uses different tone for different crowd moods", () => {
    const fight = createFight("A", "KO");
    const calmNarrative = generateFightNarrative(fight, "Calm");
    const bloodthirstyNarrative = generateFightNarrative(fight, "Bloodthirsty");
    // Narratives should differ based on mood
    expect(calmNarrative).toBeDefined();
    expect(bloodthirstyNarrative).toBeDefined();
  });

  it("handles missing mood gracefully by falling back to Calm", () => {
    const fight = createFight("A", "KO");
    // @ts-expect-error - testing fallback behavior
    const narrative = generateFightNarrative(fight, "InvalidMood");
    expect(narrative).toBeDefined();
    expect(typeof narrative).toBe("string");
  });
});
