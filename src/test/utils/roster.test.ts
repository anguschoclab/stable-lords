import { describe, it, expect } from "vitest";
import { buildWarriorMap, updateRoster, removeFromRoster, filterActive, filterByStatus } from "@/utils/roster";
import type { GameState, Warrior } from "@/types/state.types";
import { FightingStyle } from "@/types/shared.types";

// Helper to create minimal warrior for testing
function createTestWarrior(id: string, name: string, status: string): Warrior {
  return {
    id,
    name,
    style: FightingStyle.StrikingAttack,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    baseSkills: { ATT: 10, DEF: 10, PAR: 10, INI: 10, RIP: 10, DEC: 10 },
    derivedStats: { hp: 100, endurance: 100, damage: 0, encumbrance: 0 },
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: status as any,
    age: 20,
  };
}

describe("buildWarriorMap", () => {
  it("builds map from player roster", () => {
    const state: Partial<GameState> = {
      roster: [
        createTestWarrior("w1", "Warrior 1", "Active"),
        createTestWarrior("w2", "Warrior 2", "Active"),
      ],
      rivals: [],
    };
    const map = buildWarriorMap(state as GameState);
    expect(map.size).toBe(2);
    expect(map.get("w1")).toBeDefined();
    expect(map.get("w2")).toBeDefined();
  });

  it("builds map from rival rosters", () => {
    const state: Partial<GameState> = {
      roster: [],
      rivals: [
        {
          owner: { id: "r1", name: "Rival 1", stableName: "Rival Stable", fame: 0, renown: 0, titles: 0 },
          roster: [createTestWarrior("w1", "Warrior 1", "Active")],
          treasury: 100,
          fame: 0,
        } as any,
      ]!,
    };
    const map = buildWarriorMap(state as GameState);
    expect(map.size).toBe(1);
    expect(map.get("w1")).toBeDefined();
  });

  it("builds map from both player and rival rosters", () => {
    const state: Partial<GameState> = {
      roster: [createTestWarrior("w1", "Warrior 1", "Active")],
      rivals: [
        {
          owner: { id: "r1", name: "Rival 1", stableName: "Rival Stable", fame: 0, renown: 0, titles: 0 },
          roster: [createTestWarrior("w2", "Warrior 2", "Active")],
          treasury: 100,
          fame: 0,
        } as any,
      ]!,
    };
    const map = buildWarriorMap(state as GameState);
    expect(map.size).toBe(2);
    expect(map.get("w1")).toBeDefined();
    expect(map.get("w2")).toBeDefined();
  });
});

describe("updateRoster", () => {
  it("applies updates from map to roster", () => {
    const roster = [
      createTestWarrior("w1", "Warrior 1", "Active"),
      createTestWarrior("w2", "Warrior 2", "Active"),
    ];
    roster[0]!.fame = 10;
    roster[1]!.fame = 20;
    const updates = new Map([["w1", { fame: 15 } as Partial<Warrior>]]);
    const updated = updateRoster(roster, updates);
    expect(updated[0]!.fame).toBe(15);
    expect(updated[1]!.fame).toBe(20);
  });

  it("returns original roster if no updates", () => {
    const roster = [createTestWarrior("w1", "Warrior 1", "Active")];
    const updates = new Map();
    const updated = updateRoster(roster, updates);
    expect(updated).toEqual(roster);
  });
});

describe("removeFromRoster", () => {
  it("removes warriors by IDs", () => {
    const roster = [
      createTestWarrior("w1", "Warrior 1", "Active"),
      createTestWarrior("w2", "Warrior 2", "Active"),
      createTestWarrior("w3", "Warrior 3", "Active"),
    ];
    const updated = removeFromRoster(roster, ["w2"]);
    expect(updated.length).toBe(2);
    expect(updated.find(w => w.id === "w2")).toBeUndefined();
  });

  it("handles empty ID list", () => {
    const roster = [createTestWarrior("w1", "Warrior 1", "Active")];
    const updated = removeFromRoster(roster, []);
    expect(updated).toEqual(roster);
  });
});

describe("filterActive", () => {
  it("filters to only active warriors", () => {
    const roster = [
      createTestWarrior("w1", "Warrior 1", "Active"),
      createTestWarrior("w2", "Warrior 2", "Retired"),
      createTestWarrior("w3", "Warrior 3", "Active"),
    ];
    const active = filterActive(roster);
    expect(active.length).toBe(2);
    expect(active.every(w => w.status === "Active")).toBe(true);
  });
});

describe("filterByStatus", () => {
  it("filters by specific status", () => {
    const roster = [
      createTestWarrior("w1", "Warrior 1", "Active"),
      createTestWarrior("w2", "Warrior 2", "Retired"),
      createTestWarrior("w3", "Warrior 3", "Injured"),
    ];
    const retired = filterByStatus(roster, "Retired");
    expect(retired.length).toBe(1);
    expect(retired[0]!.status).toBe("Retired");
  });
});
