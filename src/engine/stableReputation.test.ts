import { describe, it, expect } from "vitest";
import { computeStableReputation, computeRivalReputation } from "./stableReputation";
import { FightingStyle, type GameState, type Warrior, type FightSummary, type Owner } from "@/types/game";

// ─── Test Helpers ─────────────────────────────────────────────────────────

function createMockWarrior(
  id: string,
  style: FightingStyle,
  kills: number = 0,
  fame: number = 0,
  status: "Active" | "Dead" | "Retired" = "Active"
): Warrior {
  return {
    id,
    name: `Test Warrior ${id}`,
    style,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    fame,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills },
    champion: false,
    status,
    age: 20,
  };
}

function createMockFightSummary(
  id: string,
  winner: "A" | "D" | null,
  by: "Kill" | "KO" | "Exhaustion" | "Stoppage" | "Draw" | null
): FightSummary {
  return {
    id,
    week: 1,
    title: "Test Bout",
    a: "w1",
    d: "w2",
    winner,
    by,
    styleA: FightingStyle.BashingAttack,
    styleD: FightingStyle.ParryRiposte,
    createdAt: "2023-01-01T00:00:00Z",
  };
}

function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  const defaultPlayer: Owner = {
    id: "player_owner",
    name: "Player Owner",
    stableName: "Test Stable",
    fame: 0,
    renown: 0,
    titles: 0,
  };

  return {
    meta: { gameName: "Test Game", version: "1.0", createdAt: "2023-01-01T00:00:00Z" },
    ftueComplete: true,
    coachDismissed: [],
    player: defaultPlayer,
    fame: 0,
    popularity: 0,
    gold: 0,
    ledger: [],
    week: 1,
    season: "Spring",
    roster: [],
    graveyard: [],
    retired: [],
    arenaHistory: [],
    newsletter: [],
    hallOfFame: [],
    crowdMood: "Calm",
    tournaments: [],
    trainers: [],
    hiringPool: [],
    trainingAssignments: [],
    seasonalGrowth: [],
    rivals: [],
    scoutReports: [],
    restStates: [],
    rivalries: [],
    matchHistory: [],
    recruitPool: [],
    rosterBonus: 0,
    ownerGrudges: [],
    insightTokens: [],
    moodHistory: [],
    settings: {
      featureFlags: {
        tournaments: true,
        scouting: true,
      },
    },
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe("computeStableReputation", () => {
  describe("Notoriety Calculation", () => {
    it("should calculate 0 notoriety for a stable with no kills and no kill bouts", () => {
      const state = createMockGameState({
        roster: [
          createMockWarrior("w1", FightingStyle.BashingAttack, 0, 0, "Active"),
        ],
        graveyard: [],
        arenaHistory: [
          createMockFightSummary("f1", "A", "KO"),
          createMockFightSummary("f2", "D", "Exhaustion"),
        ]
      });

      const rep = computeStableReputation(state);
      expect(rep.notoriety).toBe(0);
    });

    it("should calculate notoriety correctly from active roster kills", () => {
      // 1 kill * 2 = 2 raw. 2 raw * 2 = 4 notoriety
      const state = createMockGameState({
        roster: [
          createMockWarrior("w1", FightingStyle.BashingAttack, 1, 0, "Active"),
        ]
      });

      const rep = computeStableReputation(state);
      expect(rep.notoriety).toBe(4);
    });

    it("should calculate notoriety correctly from graveyard kills", () => {
      // 2 graveyard kills * 2 = 4 raw. 4 raw * 2 = 8 notoriety
      const state = createMockGameState({
        graveyard: [
          createMockWarrior("w2", FightingStyle.StrikingAttack, 2, 0, "Dead"),
        ]
      });

      const rep = computeStableReputation(state);
      expect(rep.notoriety).toBe(8);
    });

    it("should calculate notoriety correctly from kill bouts in arena history", () => {
      // 3 kill bouts * 1 = 3 raw. 3 raw * 2 = 6 notoriety
      const state = createMockGameState({
        arenaHistory: [
          createMockFightSummary("f1", "A", "Kill"),
          createMockFightSummary("f2", "D", "Kill"),
          createMockFightSummary("f3", "A", "Kill"),
          createMockFightSummary("f4", "D", "KO"),
        ]
      });

      const rep = computeStableReputation(state);
      expect(rep.notoriety).toBe(6);
    });

    it("should calculate notoriety correctly combining all factors", () => {
      // Roster kills: 2 (2 * 2 = 4 raw)
      // Graveyard kills: 3 (3 * 2 = 6 raw)
      // Kill bouts: 2 (2 * 1 = 2 raw)
      // Total raw = 12. Notoriety = 12 * 2 = 24
      const state = createMockGameState({
        roster: [
          createMockWarrior("w1", FightingStyle.BashingAttack, 2, 0, "Active"),
        ],
        graveyard: [
          createMockWarrior("w2", FightingStyle.StrikingAttack, 3, 0, "Dead"),
        ],
        arenaHistory: [
          createMockFightSummary("f1", "A", "Kill"),
          createMockFightSummary("f2", "D", "Kill"),
        ]
      });

      const rep = computeStableReputation(state);
      expect(rep.notoriety).toBe(24);
    });

    it("should cap notoriety at 100", () => {
      // Roster kills: 50 (50 * 2 = 100 raw)
      // Total raw = 100. Notoriety = 100 * 2 = 200 -> capped at 100
      const state = createMockGameState({
        roster: [
          createMockWarrior("w1", FightingStyle.BashingAttack, 50, 0, "Active"),
        ]
      });

      const rep = computeStableReputation(state);
      expect(rep.notoriety).toBe(100);
    });
  });

  describe("Fame Calculation", () => {
    it("should calculate fame based on top 5 roster fame and gazette mentions", () => {
      // Top fame: 10, 20, 30. Avg = 20.
      // Gazette mentions: 2
      // State fame: 5
      // Expected = 20 * 3 + 2 * 0.5 + 5 = 60 + 1 + 5 = 66
      const state = createMockGameState({
        fame: 5,
        roster: [
          createMockWarrior("w1", FightingStyle.BashingAttack, 0, 10, "Active"),
          createMockWarrior("w2", FightingStyle.StrikingAttack, 0, 20, "Active"),
          createMockWarrior("w3", FightingStyle.ParryRiposte, 0, 30, "Active"),
        ],
        newsletter: [
          { week: 1, title: "News 1", items: ["Test Stable won a big match!"] },
          { week: 2, title: "News 2", items: ["Test Stable loses a match.", "Other stuff"] },
          { week: 3, title: "News 3", items: ["Irrelevant news"] },
        ]
      });

      const rep = computeStableReputation(state);
      expect(rep.fame).toBe(66);
    });
  });

  describe("Honor Calculation", () => {
    it("should calculate honor with clean bouts increasing and kills decreasing", () => {
      // 2 clean bouts: +1
      // 1 roster kill: -3
      // Base: 50 + 1 - 3 = 48
      const state = createMockGameState({
        roster: [
          createMockWarrior("w1", FightingStyle.BashingAttack, 1, 0, "Active"),
        ],
        arenaHistory: [
          createMockFightSummary("f1", "A", "KO"),
          createMockFightSummary("f2", "A", "Draw"),
          createMockFightSummary("f3", null, null), // not counted
          createMockFightSummary("f4", "D", "Kill"), // not clean
        ]
      });

      const rep = computeStableReputation(state);
      expect(rep.honor).toBe(48);
    });
  });

  describe("Adaptability Calculation", () => {
    it("should calculate adaptability based on unique styles, training assignments, and trainers", () => {
      // 3 unique styles: 3 * 8 = 24
      // 2 training assignments: 2 * 3 = 6
      // 1 trainer: 1 * 2 = 2
      // Total: 32
      const state = createMockGameState({
        roster: [
          createMockWarrior("w1", FightingStyle.BashingAttack, 0, 0, "Active"),
          createMockWarrior("w2", FightingStyle.StrikingAttack, 0, 0, "Active"),
          createMockWarrior("w3", FightingStyle.ParryRiposte, 0, 0, "Active"),
          createMockWarrior("w4", FightingStyle.ParryRiposte, 0, 0, "Active"), // Duplicate style
        ],
        trainingAssignments: [
          { warriorId: "w1", type: "attribute", attribute: "ST" },
          { warriorId: "w2", type: "recovery" },
        ],
        trainers: [
          { id: "t1", name: "Trainer", tier: "Basic", focus: "ST", fame: 0, contractWeeksLeft: 10 }
        ]
      });

      const rep = computeStableReputation(state);
      expect(rep.adaptability).toBe(32);
    });
  });

  describe("computeRivalReputation", () => {
    it("should correctly calculate rival reputation based on active roster and history", () => {
      // Roster: 2 active (kills 1, 2 = 3 total)
      // Top fame: 10, 20. Avg = 15.
      // Fame: 15 * 3 = 45
      // Notoriety: 3 total kills * 4 = 12
      // Clean bouts: total wins (2+4=6) + total losses (1+1=2) - kills (3) = 5
      // Honor: 50 + 5 * 0.3 - 3 * 3 = 50 + 1.5 - 9 = 42.5 -> 43
      // Adaptability: 2 unique styles * 10 = 20

      const w1 = createMockWarrior("rw1", FightingStyle.BashingAttack, 1, 10, "Active");
      w1.career.wins = 2; w1.career.losses = 1;

      const w2 = createMockWarrior("rw2", FightingStyle.StrikingAttack, 2, 20, "Active");
      w2.career.wins = 4; w2.career.losses = 1;

      const roster = [w1, w2];

      const history = [
        createMockFightSummary("f1", "A", "KO"),
      ];

      const rep = computeRivalReputation(roster, history, "Rival Stable");
      expect(rep.fame).toBe(45);
      expect(rep.notoriety).toBe(12);
      expect(rep.honor).toBe(43);
      expect(rep.adaptability).toBe(20);
    });
});
});
