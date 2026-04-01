/**
 * Training System Tests — comprehensive coverage of attribute training mechanics
 */
import { describe, it, expect } from "vitest";
import { processTraining, computeGainChance } from "@/engine/training";
import { FightingStyle, type GameState, type Warrior, type TrainingAssignment } from "@/types/game";
import { computeWarriorStats } from "@/engine/skillCalc";

function makeWarrior(attrs: any, overrides?: Partial<Warrior>): Warrior {
  const { baseSkills, derivedStats } = computeWarriorStats(attrs, FightingStyle.StrikingAttack);
  return {
    id: "w1",
    name: "Test",
    style: FightingStyle.StrikingAttack,
    attributes: attrs,
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
    potential: { ST: 18, CN: 18, SZ: 15, WT: 18, WL: 18, SP: 18, DF: 18 },
    ...overrides,
  };
}

function makeState(overrides?: Partial<GameState>): GameState {
  return {
    phase: "planning",
    meta: { gameName: "Test", version: "1.0.0", createdAt: new Date().toISOString() },
    ftueComplete: true,
    ftueStep: 0,
    coachDismissed: [],
    player: { id: "p1", name: "Player", stableName: "Test Stable", fame: 0, renown: 0, titles: 0 },
    fame: 0,
    popularity: 0,
    gold: 500,
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
    playerChallenges: [],
    playerAvoids: [],
    recruitPool: [],
    rosterBonus: 0,
    ownerGrudges: [],
    insightTokens: [],
    moodHistory: [],
    gazettes: [],
    isFTUE: false,
    unacknowledgedDeaths: [],
    settings: { featureFlags: { tournaments: true, scouting: true } },
    ...overrides,
  };
}

describe("Training System", () => {
  describe("computeGainChance", () => {
    it("should return base gain chance with no modifiers", () => {
      const warrior = makeWarrior({ ST: 12, CN: 12, SZ: 12, WT: 10, WL: 12, SP: 12, DF: 12 });
      const chance = computeGainChance(warrior, "ST", []);
      expect(chance).toBeGreaterThan(0.15);
      expect(chance).toBeLessThan(0.85);
    });

    it("should increase chance with high WT", () => {
      const lowWT = makeWarrior({ ST: 12, CN: 12, SZ: 12, WT: 8, WL: 12, SP: 12, DF: 12 });
      const highWT = makeWarrior({ ST: 12, CN: 12, SZ: 12, WT: 16, WL: 12, SP: 12, DF: 12 });
      
      const chanceL = computeGainChance(lowWT, "ST", []);
      const chanceH = computeGainChance(highWT, "ST", []);
      
      expect(chanceH).toBeGreaterThan(chanceL);
    });

    it("should decrease chance with age penalty", () => {
      const young = makeWarrior({ ST: 12, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 12 }, { age: 20 });
      const old = makeWarrior({ ST: 12, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 12 }, { age: 30 });
      
      const chanceY = computeGainChance(young, "ST", []);
      const chanceO = computeGainChance(old, "ST", []);
      
      expect(chanceO).toBeLessThan(chanceY);
    });

    it("should decrease chance when injured", () => {
      const healthy = makeWarrior({ ST: 12, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 12 });
      const injured = makeWarrior({ ST: 12, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 12 }, {
        injuries: [{ id: "i1", name: "Cut", description: "Ouch", severity: "Minor", weeksRemaining: 2, penalties: {} }],
      });
      
      const chanceH = computeGainChance(healthy, "ST", []);
      const chanceI = computeGainChance(injured, "ST", []);
      
      expect(chanceI).toBeLessThan(chanceH);
    });

    it("should apply diminishing returns near potential ceiling", () => {
      const lowAttr = makeWarrior({ ST: 10, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 12 }, {
        potential: { ST: 18, CN: 18, SZ: 15, WT: 18, WL: 18, SP: 18, DF: 18 },
      });
      const highAttr = makeWarrior({ ST: 17, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 12 }, {
        potential: { ST: 18, CN: 18, SZ: 15, WT: 18, WL: 18, SP: 18, DF: 18 },
      });
      
      const chanceL = computeGainChance(lowAttr, "ST", []);
      const chanceH = computeGainChance(highAttr, "ST", []);
      
      expect(chanceH).toBeLessThan(chanceL);
    });
  });

  describe("processTraining", () => {
    it("should return state unchanged if no assignments", () => {
      const state = makeState();
      const result = processTraining(state);
      expect(result).toEqual(state);
    });

    it("should clear assignments after processing", () => {
      const warrior = makeWarrior({ ST: 12, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 12 });
      const state = makeState({
        roster: [warrior],
        trainingAssignments: [{ warriorId: "w1", type: "attribute", attribute: "ST" }],
      });
      
      const result = processTraining(state);
      expect(result.trainingAssignments).toEqual([]);
    });

    it("should block SZ training", () => {
      const warrior = makeWarrior({ ST: 12, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 12 });
      const state = makeState({
        roster: [warrior],
        trainingAssignments: [{ warriorId: "w1", type: "attribute", attribute: "SZ" }],
      });
      
      const result = processTraining(state);
      
      // Should not increase SZ
      expect(result.roster[0].attributes.SZ).toBe(12);
    });

    it("should enforce seasonal cap (3 gains per attribute per season)", () => {
      const warrior = makeWarrior({ ST: 12, CN: 12, SZ: 12, WT: 15, WL: 12, SP: 12, DF: 12 });
      const state = makeState({
        roster: [warrior],
        seasonalGrowth: [{ warriorId: "w1", season: "Spring", gains: { ST: 3 } }],
        trainingAssignments: [{ warriorId: "w1", type: "attribute", attribute: "ST" }],
      });
      
      const result = processTraining(state);
      
      // Should not increase ST (already at cap)
      expect(result.roster[0].attributes.ST).toBe(12);
    });

    it("should enforce total attribute cap (80)", () => {
      const warrior = makeWarrior({ ST: 12, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 10, DF: 10 });
      warrior.attributes = { ST: 12, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 10, DF: 10 }; // sum = 80
      
      const state = makeState({
        roster: [warrior],
        trainingAssignments: [{ warriorId: "w1", type: "attribute", attribute: "SP" }],
      });
      
      const result = processTraining(state);
      
      // Should not increase SP (at total cap)
      expect(result.roster[0].attributes.SP).toBe(10);
    });

    it("should process recovery mode", () => {
      const warrior = makeWarrior({ ST: 12, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 12 }, {
        injuries: [{
          id: "i1",
          name: "Cut",
          description: "Ouch",
          severity: "Minor",
          weeksRemaining: 3,
          penalties: { ST: -1 },
        }],
      });
      
      const state = makeState({
        roster: [warrior],
        trainingAssignments: [{ warriorId: "w1", type: "recovery" }],
      });
      
      const result = processTraining(state);
      
      // Should reduce injury weeks by at least 1
      const injury = result.roster[0].injuries[0];
      if (typeof injury !== "string") {
        expect(injury.weeksRemaining).toBeLessThan(3);
      }
    });

    it("should update seasonal growth tracking on successful gain", () => {
      const warrior = makeWarrior({ ST: 12, CN: 12, SZ: 12, WT: 18, WL: 12, SP: 12, DF: 12 });
      
      const state = makeState({
        roster: [warrior],
        trainingAssignments: [{ warriorId: "w1", type: "attribute", attribute: "ST" }],
      });
      
      // Run multiple times to get at least one success
      let result = state;
      for (let i = 0; i < 50; i++) {
        result = processTraining({ ...result, trainingAssignments: [{ warriorId: "w1", type: "attribute", attribute: "ST" }] });
        if (result.roster[0].attributes.ST > 12) break;
      }
      
      if (result.roster[0].attributes.ST > 12) {
        const growth = result.seasonalGrowth.find(g => g.warriorId === "w1" && g.season === "Spring");
        expect(growth).toBeDefined();
        expect(growth?.gains.ST).toBeGreaterThan(0);
      }
    });

    it("should recalculate stats after attribute gain", () => {
      const warrior = makeWarrior({ ST: 12, CN: 12, SZ: 12, WT: 18, WL: 12, SP: 12, DF: 12 });
      const oldHP = warrior.derivedStats?.hp ?? 100;
      
      const state = makeState({
        roster: [warrior],
        trainingAssignments: [{ warriorId: "w1", type: "attribute", attribute: "CN" }],
      });
      
      // Run multiple times to get at least one success
      let result = state;
      for (let i = 0; i < 50; i++) {
        result = processTraining({ ...result, trainingAssignments: [{ warriorId: "w1", type: "attribute", attribute: "CN" }] });
        if (result.roster[0].attributes.CN > 12) break;
      }
      
      if (result.roster[0].attributes.CN > 12) {
        // HP should increase with CN
        expect(result.roster[0].derivedStats?.hp).toBeGreaterThan(oldHP);
      }
    });

    it("should add newsletter entries for successful training", () => {
      const warrior = makeWarrior({ ST: 12, CN: 12, SZ: 12, WT: 18, WL: 12, SP: 12, DF: 12 });
      
      const state = makeState({
        roster: [warrior],
        trainingAssignments: [{ warriorId: "w1", type: "attribute", attribute: "ST" }],
      });
      
      // Run multiple times to get at least one success
      let result = state;
      for (let i = 0; i < 50; i++) {
        result = processTraining({ ...result, trainingAssignments: [{ warriorId: "w1", type: "attribute", attribute: "ST" }] });
        if (result.newsletter.length > 0) break;
      }
      
      if (result.newsletter.length > 0) {
        expect(result.newsletter[0].title).toBe("Training Report");
      }
    });
  });
});
