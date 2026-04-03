import { describe, it, expect } from "vitest";
import { resolveImpacts, type StateImpact } from "@/engine/impacts";
import type { GameState, Warrior } from "@/types/game";
import { FightingStyle } from "@/types/game";

function makeWarrior(id: string, name: string): Warrior {
  return {
    id,
    name,
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
    age: 20
  };
}

function makeInitialState(): GameState {
  return {
    gold: 1000,
    fame: 50,
    week: 1,
    roster: [makeWarrior("w1", "Alice"), makeWarrior("w2", "Bob")],
    newsletter: [],
    ledger: [],
    // ... rest of state fields
  } as unknown;
}

describe("resolveImpacts", () => {
  it("applies gold and fame deltas correctly", () => {
    const state = makeInitialState();
    const impact: StateImpact = {
      goldDelta: 500,
      fameDelta: -10
    };

    const newState = resolveImpacts(state, [impact]);

    expect(newState.gold).toBe(1500);
    expect(newState.fame).toBe(40);
  });

  it("applies roster updates using ID mapping", () => {
    const state = makeInitialState();
    const rosterUpdates = new Map<string, Partial<Warrior>>();
    rosterUpdates.set("w1", { fame: 100, age: 25 });

    const impact: StateImpact = { rosterUpdates };
    const newState = resolveImpacts(state, [impact]);

    const w1 = newState.roster.find(w => w.id === "w1");
    expect(w1?.fame).toBe(100);
    expect(w1?.age).toBe(25);
    
    // w2 should remain unchanged
    const w2 = newState.roster.find(w => w.id === "w2");
    expect(w2?.fame).toBe(0);
  });

  it("merges newsletter items and ledger entries", () => {
    const state = makeInitialState();
    const impact: StateImpact = {
      newsletterItems: [{ week: 1, title: "T1", items: ["i1"] }],
      ledgerEntries: [{ week: 1, category: "upkeep", amount: -50, label: "L1" }]
    };

    const newState = resolveImpacts(state, [impact]);

    expect(newState.newsletter).toHaveLength(1);
    expect(newState.newsletter[0].title).toBe("T1");
    expect(newState.ledger).toHaveLength(1);
    expect(newState.ledger[0].amount).toBe(-50);
  });

  it("handles multiple impacts correctly", () => {
    const state = makeInitialState();
    const impact1: StateImpact = { goldDelta: 100 };
    const impact2: StateImpact = { goldDelta: 200 };

    const newState = resolveImpacts(state, [impact1, impact2]);

    expect(newState.gold).toBe(1300);
  });
});
