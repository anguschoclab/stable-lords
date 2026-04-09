import { describe, it, expect } from "bun:test";
import { runEventPass } from "@/engine/pipeline/passes/EventPass";
import { SeededRNG } from "@/utils/random";
import type { GameState } from "@/types/state.types";
import type { Warrior } from "@/types/warrior.types";

describe("EventPass", () => {
  it("should rarely trigger the Lost Relic Discovery event and correctly modify stats", () => {
    // To hit `brawlRng.next() < 0.04`, we need RNG next to return something small.
    // However, brawlRng = rootRng?.clone() ?? new SeededRNG(nextWeek * 999 + 1);
    const rng = new SeededRNG(42);
    // Mock the rng so the first call to .next() (brawl event) is > 0.05,
    // the second call (blessing event) is > 0.03,
    // and the third call (lost relic event) is < 0.04.
    rng.next = () => {
      if (!(rng as any)._callCount) (rng as any)._callCount = 0;
      (rng as any)._callCount++;
      if ((rng as any)._callCount === 1) return 0.5; // fail Tavern Brawl
      if ((rng as any)._callCount === 2) return 0.5; // fail Star-crossed Blessing
      if ((rng as any)._callCount === 3) return 0.01; // succeed Lost Relic
      return 0.5;
    };
    rng.clone = () => rng;
    rng.pick = (arr: any[]) => arr[0];

    const w: Partial<Warrior> = { id: "w-1", name: "Gladiator", status: "Active", fame: 0, xp: 0 };
    const state: Partial<GameState> = {
      roster: [w as Warrior],
      newsletter: []
    };

    const nextState = runEventPass(state as GameState, 2, rng);
    const warrior = nextState.roster.find(r => r.id === "w-1");
    expect(warrior?.fame).toBe(10);
    expect(warrior?.xp).toBe(5);

    const newsletter = nextState.newsletter?.[0];
    expect(newsletter?.title).toBe("Lost Relic Discovery");
    expect(newsletter?.items[0]).toContain("discovered an ancient artifact!");
  });
});
