import { describe, it, expect } from "vitest";
import { rollForInjury } from "@/engine/injuries";
import { FightingStyle, type Warrior, type FightOutcome } from "@/types/game";

describe("rollForInjury", () => {
  const mockWarrior: Warrior = {
    id: "test-warrior",
    name: "Test Warrior",
    style: FightingStyle.StrikingAttack,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    baseSkills: {} as unknown,
    derivedStats: {} as unknown,
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: "Active",
    age: 20,
  };

  const mockOutcome: FightOutcome = {
    winner: "D",
    by: "KO",
    minutes: 5,
    log: [],
    post: {
      hitsA: 10,
      hitsD: 5,
      xpA: 10,
      xpD: 10,
      gotKillA: false,
      gotKillD: false,
    },
  };

  it("should generate an ID for an injury", () => {
    // Force an injury by mocking Math.random if possible,
    // or just run it enough times.
    // In this case, with 10 hits and a loss (KO), chance is high.
    // chance = 10 * 0.05 + 0.15 + 0.10 = 0.5 + 0.15 + 0.10 = 0.75

    let injury = null;
    for(let i=0; i<100; i++) {
        injury = rollForInjury(mockWarrior, mockOutcome, "A");
        if (injury) break;
    }

    expect(injury).not.toBeNull();
    // UUID regex
    expect(injury?.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

  });
});
