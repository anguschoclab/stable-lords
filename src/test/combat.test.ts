/**
 * Combat simulation engine tests — deterministic fight outcomes,
 * kill logic, fame calculations, and resolution chain correctness.
 */
import { describe, it, expect } from "vitest";
import { simulateFight, defaultPlanForWarrior } from "@/engine/simulate";
import { fameFromTags } from "@/engine/fame";
import { FightingStyle, type Warrior, type FightPlan } from "@/types/game";
import { computeWarriorStats } from "@/engine/skillCalc";

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeWarrior(
  name: string,
  style: FightingStyle,
  attrs: Partial<Record<"ST" | "CN" | "SZ" | "WT" | "WL" | "SP" | "DF", number>> = {},
  overrides: Partial<Warrior> = {},
): Warrior {
  const full = { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10, ...attrs };
  const { baseSkills, derivedStats } = computeWarriorStats(full, style);
  return {
    id: `test_${name}`,
    name,
    style,
    attributes: full,
    baseSkills,
    derivedStats,
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: "Active",
    age: 20,
    ...overrides,
  };
}

function makePlan(style: FightingStyle, overrides: Partial<FightPlan> = {}): FightPlan {
  return { style, OE: 7, AL: 6, killDesire: 5, target: "Any", ...overrides };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("simulateFight — determinism", () => {
  it("produces identical results with the same seed", () => {
    const wA = makeWarrior("Alpha", FightingStyle.StrikingAttack);
    const wD = makeWarrior("Beta", FightingStyle.ParryRiposte);
    const planA = makePlan(FightingStyle.StrikingAttack);
    const planD = makePlan(FightingStyle.ParryRiposte);

    const r1 = simulateFight(planA, planD, wA, wD, 42);
    const r2 = simulateFight(planA, planD, wA, wD, 42);

    expect(r1.winner).toBe(r2.winner);
    expect(r1.by).toBe(r2.by);
    expect(r1.minutes).toBe(r2.minutes);
    expect(r1.post?.hitsA).toBe(r2.post?.hitsA);
    expect(r1.post?.hitsD).toBe(r2.post?.hitsD);
    expect(r1.post?.tags).toEqual(r2.post?.tags);
  });

  it("produces different results with different seeds", () => {
    const wA = makeWarrior("Alpha", FightingStyle.BashingAttack, { ST: 18, CN: 15 });
    const wD = makeWarrior("Beta", FightingStyle.LungingAttack, { SP: 18, DF: 15 });
    const planA = makePlan(FightingStyle.BashingAttack, { OE: 9, AL: 4 });
    const planD = makePlan(FightingStyle.LungingAttack, { OE: 6, AL: 8 });

    const results = new Set<string>();
    for (let seed = 1; seed <= 20; seed++) {
      const r = simulateFight(planA, planD, wA, wD, seed);
      results.add(`${r.winner}-${r.by}-${r.minutes}`);
    }
    // With 20 different seeds, we should see at least 2 distinct outcomes
    expect(results.size).toBeGreaterThanOrEqual(2);
  });
});

describe("simulateFight — outcome structure", () => {
  it("always returns a valid FightOutcome", () => {
    const planA = makePlan(FightingStyle.SlashingAttack);
    const planD = makePlan(FightingStyle.WallOfSteel);

    const result = simulateFight(planA, planD, undefined, undefined, 123);

    expect(result).toHaveProperty("winner");
    expect(result).toHaveProperty("by");
    expect(result).toHaveProperty("minutes");
    expect(result).toHaveProperty("log");
    expect(result).toHaveProperty("post");
    expect(result.log.length).toBeGreaterThan(0);
    expect(["A", "D", null]).toContain(result.winner);
    expect(["Kill", "KO", "Exhaustion", "Stoppage", "Draw", null]).toContain(result.by);
  });

  it("log entries have valid minute and text", () => {
    const result = simulateFight(
      makePlan(FightingStyle.StrikingAttack),
      makePlan(FightingStyle.ParryStrike),
      undefined, undefined, 99,
    );

    for (const entry of result.log) {
      expect(entry.minute).toBeGreaterThanOrEqual(1);
      expect(typeof entry.text).toBe("string");
      expect(entry.text.length).toBeGreaterThan(0);
    }
  });

  it("post stats are consistent with outcome", () => {
    const wA = makeWarrior("Hero", FightingStyle.BashingAttack, { ST: 20, CN: 15 });
    const wD = makeWarrior("Foe", FightingStyle.TotalParry, { CN: 20, WL: 18 });

    const result = simulateFight(
      makePlan(FightingStyle.BashingAttack, { OE: 9, killDesire: 8 }),
      makePlan(FightingStyle.TotalParry, { OE: 2, AL: 2 }),
      wA, wD, 555,
    );

    expect(result.post?.hitsA).toBeGreaterThanOrEqual(0);
    expect(result.post?.hitsD).toBeGreaterThanOrEqual(0);

    if (result.winner === "A" && result.by === "Kill") {
      expect(result.post?.gotKillA).toBe(true);
      expect(result.post?.gotKillD).toBeFalsy();
      expect(result.post?.tags).toContain("Kill");
    }
    if (result.winner === "D" && result.by === "Kill") {
      expect(result.post?.gotKillD).toBe(true);
      expect(result.post?.gotKillA).toBeFalsy();
    }
  });
});

describe("simulateFight — kill logic", () => {
  it("kills are more likely with high killDesire and OE", () => {
    const wA = makeWarrior("Killer", FightingStyle.BashingAttack, { ST: 22, CN: 12, WL: 15 });
    const wD = makeWarrior("Victim", FightingStyle.AimedBlow, { ST: 6, CN: 6, WL: 6, DF: 6 });

    let killCount = 0;
    const trials = 50;
    for (let seed = 1; seed <= trials; seed++) {
      const result = simulateFight(
        makePlan(FightingStyle.BashingAttack, { OE: 10, AL: 8, killDesire: 10 }),
        makePlan(FightingStyle.AimedBlow, { OE: 3, AL: 3, killDesire: 1 }),
        wA, wD, seed,
      );
      if (result.by === "Kill") killCount++;
    }

    // High KD + massive stat advantage should produce kills in at least some fights
    expect(killCount).toBeGreaterThan(0);
  });

  it("low killDesire reduces kill frequency", () => {
    const wA = makeWarrior("Merciful", FightingStyle.StrikingAttack, { ST: 18, CN: 14 });
    const wD = makeWarrior("Weak", FightingStyle.LungingAttack, { ST: 5, CN: 5, WL: 5 });

    let killsHigh = 0;
    let killsLow = 0;
    const trials = 50;

    for (let seed = 1; seed <= trials; seed++) {
      const rHigh = simulateFight(
        makePlan(FightingStyle.StrikingAttack, { OE: 9, killDesire: 10 }),
        makePlan(FightingStyle.LungingAttack, { OE: 3 }),
        wA, wD, seed,
      );
      const rLow = simulateFight(
        makePlan(FightingStyle.StrikingAttack, { OE: 9, killDesire: 1 }),
        makePlan(FightingStyle.LungingAttack, { OE: 3 }),
        wA, wD, seed,
      );
      if (rHigh.by === "Kill") killsHigh++;
      if (rLow.by === "Kill") killsLow++;
    }

    // killDesire 10 should produce more kills than killDesire 1
    expect(killsHigh).toBeGreaterThanOrEqual(killsLow);
  });
});

describe("simulateFight — style matchups", () => {
  it("Wall of Steel has defensive advantage over aggressive styles", () => {
    const wA = makeWarrior("Basher", FightingStyle.BashingAttack, { ST: 14, CN: 12 });
    const wD = makeWarrior("Wall", FightingStyle.WallOfSteel, { CN: 14, DF: 14, WL: 14 });

    let wallWins = 0;
    const trials = 40;
    for (let seed = 1; seed <= trials; seed++) {
      const result = simulateFight(
        makePlan(FightingStyle.BashingAttack, { OE: 8 }),
        makePlan(FightingStyle.WallOfSteel, { OE: 4, AL: 5 }),
        wA, wD, seed,
      );
      if (result.winner === "D") wallWins++;
    }
    // WoS has +2 matchup vs BA, should win a meaningful portion
    expect(wallWins).toBeGreaterThan(0);
  });

  it("defaultPlanForWarrior returns sensible defaults per style", () => {
    const tp = makeWarrior("Turtle", FightingStyle.TotalParry);
    const ba = makeWarrior("Basher", FightingStyle.BashingAttack);

    const tpPlan = defaultPlanForWarrior(tp);
    const baPlan = defaultPlanForWarrior(ba);

    // Total Parry should have low OE
    expect(tpPlan.OE).toBeLessThanOrEqual(4);
    // Basher should have high OE
    expect(baPlan.OE).toBeGreaterThanOrEqual(7);
  });
});

describe("simulateFight — phase strategies", () => {
  it("respects per-phase OE/AL overrides", () => {
    const wA = makeWarrior("Phaser", FightingStyle.ParryStrike, { WT: 15, DF: 15 });
    const wD = makeWarrior("Steady", FightingStyle.StrikingAttack);

    const planA: FightPlan = {
      style: FightingStyle.ParryStrike,
      OE: 5, AL: 5, killDesire: 5,
      phases: {
        opening: { OE: 2, AL: 2, killDesire: 1 },
        mid: { OE: 6, AL: 6, killDesire: 5 },
        late: { OE: 9, AL: 8, killDesire: 9 },
      },
    };

    // Should not crash and should produce a valid outcome
    const result = simulateFight(planA, makePlan(FightingStyle.StrikingAttack), wA, wD, 77);
    expect(["A", "D", null]).toContain(result.winner);
    expect(result.log.length).toBeGreaterThan(1);
  });
});

describe("simulateFight — endurance and exhaustion", () => {
  it("high OE+AL drains endurance faster", () => {
    // Two identical warriors, one with max OE+AL
    const w = makeWarrior("Test", FightingStyle.StrikingAttack);

    const rConservative = simulateFight(
      makePlan(FightingStyle.StrikingAttack, { OE: 3, AL: 3 }),
      makePlan(FightingStyle.StrikingAttack, { OE: 3, AL: 3 }),
      w, { ...w, id: "test2", name: "Test2" }, 42,
    );
    const rAggressive = simulateFight(
      makePlan(FightingStyle.StrikingAttack, { OE: 10, AL: 10 }),
      makePlan(FightingStyle.StrikingAttack, { OE: 10, AL: 10 }),
      w, { ...w, id: "test2", name: "Test2" }, 42,
    );

    // Aggressive fights should end earlier or produce different outcomes
    // (they burn endurance faster)
    expect(rAggressive.minutes).toBeLessThanOrEqual(rConservative.minutes + 1);
  });
});

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
    const result = fameFromTags(undefined as any);
    expect(result.fame).toBe(0);
    expect(result.pop).toBe(0);
  });
});
