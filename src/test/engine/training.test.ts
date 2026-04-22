/**
 * Training System Tests — comprehensive coverage of attribute training mechanics
 */
import { describe, it, expect } from "vitest";
import { processTraining, computeGainChance } from "@/engine/training";
import { FightingStyle, type GameState, type Warrior, type TrainingAssignment } from "@/types/game";
import { computeWarriorStats } from "@/engine/skillCalc";
import { computeTrainingImpact, trainingImpactToStateImpact } from "@/engine/training";
import { vi } from "vitest";
import { SeededRNG } from "@/utils/random";
import * as trainingGains from "@/engine/training/trainingGains";

import { SeededRNGService } from "@/engine/core/rng/SeededRNGService";

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
    treasury: 500,
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


  describe("computeTrainingImpact edge cases", () => {

    it("should process skillDrill assignments correctly and roll for injury", () => {
      const warrior = makeWarrior({ ST: 12, CN: 12, SZ: 12, WT: 18, WL: 12, SP: 12, DF: 12 }, { skillDrills: { Punching: 1 } });
      const state = makeState({
        roster: [warrior],
        trainingAssignments: [{ warriorId: "w1", type: "skillDrill", skill: "Punching" }] as any
      });

      const processSpy = vi.spyOn(trainingGains, 'processSkillDrillTraining').mockReturnValue({
        updatedWarrior: { ...warrior, skillDrills: { Punching: 2 } },
        result: { type: "gain", warriorId: "w1", message: "Sharpened" } as any,
        hardCapped: false
      });

      const injurySpy = vi.spyOn(trainingGains, 'rollForTrainingInjury').mockReturnValue({
        injury: { id: "i1", name: "Sprain", description: "", severity: "Minor", weeksRemaining: 1, penalties: {} } as any,
        result: { type: "injury", warriorId: "w1", message: "Ouch" } as any
      });

      const rng = new SeededRNGService(1);
      const impact = computeTrainingImpact(state as any, rng);

      expect(impact.results.some(r => r.message === "Sharpened")).toBe(true);
      expect(impact.results.some(r => r.message === "Ouch")).toBe(true);
      expect(impact.updatedRoster[0].skillDrills?.["Punching"]).toBe(2);
      expect(impact.updatedRoster[0].injuries.length).toBe(1);

      processSpy.mockRestore();
      injurySpy.mockRestore();
    });

    it("should skip skillDrill injury roll if hard capped", () => {
      const warrior = makeWarrior({ ST: 12, CN: 12, SZ: 12, WT: 18, WL: 12, SP: 12, DF: 12 }, { skillDrills: { Punching: 3 } });
      const state = makeState({
        roster: [warrior],
        trainingAssignments: [{ warriorId: "w1", type: "skillDrill", skill: "Punching" }] as any
      });

      const processSpy = vi.spyOn(trainingGains, 'processSkillDrillTraining').mockReturnValue({
        updatedWarrior: null,
        result: { type: "blocked", warriorId: "w1", message: "Capped" } as any,
        hardCapped: true
      });

      const injurySpy = vi.spyOn(trainingGains, 'rollForTrainingInjury');

      const rng = new SeededRNG(1);
      const impact = computeTrainingImpact(state as any, rng as any);

      expect(injurySpy).not.toHaveBeenCalled();
      expect(impact.results.some(r => r.message === "Capped")).toBe(true);

      processSpy.mockRestore();
      injurySpy.mockRestore();
    });


    it("should handle missing seasonal growth during training assignment loop", () => {
      const warrior = makeWarrior({ ST: 12, CN: 12, SZ: 12, WT: 18, WL: 12, SP: 12, DF: 12 });
      const state = makeState({
        roster: [warrior],
        trainingAssignments: [{ warriorId: "w1", type: "attribute", attribute: "ST" }] as any,
        seasonalGrowth: undefined
      });
      const impact = computeTrainingImpact(state as any, new SeededRNG(1) as any);
      expect(impact.updatedSeasonalGrowth).toEqual(expect.any(Array));
    });


    it("should handle empty training assignments properly", () => {
      const state = makeState({ trainingAssignments: [] });
      const impact = computeTrainingImpact(state as any, new SeededRNG(1) as any);
      expect(impact.results).toHaveLength(0);
    });

    it("should handle missing seasonalGrowth gracefully", () => {
      const state = makeState({ trainingAssignments: [], seasonalGrowth: undefined });
      const impact = computeTrainingImpact(state as any, new SeededRNG(1) as any);
      expect(impact.updatedSeasonalGrowth).toEqual([]);
    });

    it("should return empty seasonal growth when assignments are undefined", () => {
      const state = makeState({ trainingAssignments: undefined, seasonalGrowth: undefined });
      const impact = computeTrainingImpact(state as any, new SeededRNG(1) as any);
      expect(impact.updatedSeasonalGrowth).toEqual([]);
    });

    it("should handle missing trainingAssignments", () => {
      const state = makeState({ trainingAssignments: undefined });
      const impact = computeTrainingImpact(state as any, new SeededRNG(1) as any);
      expect(impact.updatedRoster).toEqual(state.roster);
      expect(impact.results).toEqual([]);
    });

    it("should handle warrior missing from roster", () => {
      const state = makeState({
        trainingAssignments: [{ warriorId: "missing", type: "recovery" }] as any
      });
      const impact = computeTrainingImpact(state, new SeededRNG(1) as any);
      expect(impact.results).toHaveLength(0);
    });

    it("should handle missing attribute for attribute training", () => {
      const warrior = makeWarrior({ ST: 12, CN: 12, SZ: 12, WT: 18, WL: 12, SP: 12, DF: 12 });
      const state = makeState({
        roster: [warrior],
        trainingAssignments: [{ warriorId: "w1", type: "attribute" }] as any
      });
      const impact = computeTrainingImpact(state as any, new SeededRNG(1) as any);
      expect(impact.results).toHaveLength(0);
    });

    it("should handle missing trainers array in state gracefully", () => {
      const warrior = makeWarrior({ ST: 12, CN: 12, SZ: 12, WT: 18, WL: 12, SP: 12, DF: 12 });
      const state = makeState({
        roster: [warrior],
        trainers: undefined,
        trainingAssignments: [{ warriorId: "w1", type: "recovery" }] as any
      });
      const impact = computeTrainingImpact(state as any, new SeededRNG(1) as any);
      expect(impact.results).toHaveLength(1);
    });


    it("should handle injury returned without injuryResult (edge case)", () => {
      const warrior = makeWarrior({ ST: 12, CN: 12, SZ: 12, WT: 18, WL: 12, SP: 12, DF: 12 });
      const state = makeState({
        roster: [warrior],
        trainingAssignments: [{ warriorId: "w1", type: "attribute", attribute: "ST" }] as any
      });

      const spy = vi.spyOn(trainingGains, 'rollForTrainingInjury').mockReturnValue({
        injury: { id: "test", name: "test", description: "test", severity: "Minor", weeksRemaining: 1, penalties: {} } as any,
        result: undefined as any
      });

      const rng = new SeededRNG(1);
      const impact = computeTrainingImpact(state as any, rng as any);

      expect(impact.results.filter(r => r.type === "injury")).toHaveLength(0);
      expect(impact.updatedRoster[0].injuries).toHaveLength(0);
      spy.mockRestore();
    });




    it("should process attribute training message correctly", () => {
      const warrior = makeWarrior({ ST: 12, CN: 12, SZ: 12, WT: 18, WL: 12, SP: 12, DF: 12 });
      const state = makeState({
        roster: [warrior],
        trainingAssignments: [{ warriorId: "w1", type: "attribute", attribute: "ST" }] as any
      });

      const spy = vi.spyOn(trainingGains, 'processAttributeTraining').mockReturnValue({
        updatedWarrior: warrior,
        updatedSeasonalGrowth: [{ warriorId: "w1", season: "Spring", gains: { ST: 1 } }] as any,
        result: { type: "attribute", warriorId: "w1", message: "Success" } as any,
        hardCapped: false
      });

      const rng = new SeededRNG(1);
      const impact = computeTrainingImpact(state as any, rng as any);

      expect(impact.results.filter(r => r.type === "attribute")).toHaveLength(1);
      expect(impact.updatedSeasonalGrowth).toHaveLength(1);
      spy.mockRestore();
    });


    it("should fallback to currentRoster for injury if updatedWarrior is null", () => {
      const warrior = makeWarrior({ ST: 12, CN: 12, SZ: 12, WT: 18, WL: 12, SP: 12, DF: 12 });
      const state = makeState({
        roster: [warrior],
        trainingAssignments: [{ warriorId: "w1", type: "attribute", attribute: "ST" }] as any
      });

      const spy1 = vi.spyOn(trainingGains, 'processAttributeTraining').mockReturnValue({
        updatedWarrior: null,
        updatedSeasonalGrowth: [],
        result: { type: "attribute", warriorId: "w1", message: "" } as any,
        hardCapped: false
      });

      const spy2 = vi.spyOn(trainingGains, 'rollForTrainingInjury').mockReturnValue({
        injury: { id: "test", name: "test", description: "test", severity: "Minor", weeksRemaining: 1, penalties: {} } as any,
        result: { type: "injury", warriorId: "w1", message: "Injured" } as any
      });

      const rng = new SeededRNG(1);
      const impact = computeTrainingImpact(state as any, rng as any);

      expect(impact.results.filter(r => r.type === "injury")).toHaveLength(1);
      spy1.mockRestore();
      spy2.mockRestore();
    });

    it("should process attribute training injury correctly", () => {
      const warrior = makeWarrior({ ST: 12, CN: 12, SZ: 12, WT: 18, WL: 12, SP: 12, DF: 12 });
      const state = makeState({
        roster: [warrior],
        trainingAssignments: [{ warriorId: "w1", type: "attribute", attribute: "ST" }] as any
      });

      const injuryObj = { id: "test", name: "test", description: "test", severity: "Minor", weeksRemaining: 1, penalties: {} } as any;
      const injuryResObj = { type: "injury", warriorId: "w1", message: "Injured" } as any;

      const spy1 = vi.spyOn(trainingGains, 'processAttributeTraining').mockReturnValue({
        updatedWarrior: warrior,
        updatedSeasonalGrowth: [],
        result: { type: "attribute", warriorId: "w1", message: "Success" } as any,
        hardCapped: false
      });

      const spy2 = vi.spyOn(trainingGains, 'rollForTrainingInjury').mockReturnValue({
        injury: injuryObj,
        result: injuryResObj
      });

      const rng = new SeededRNG(1);
      const impact = computeTrainingImpact(state as any, rng as any);

      expect(impact.results.filter(r => r.type === "injury")).toHaveLength(1);
      expect(impact.updatedRoster[0].injuries).toContain(injuryObj);
      spy1.mockRestore();
      spy2.mockRestore();
    });

    it("should handle training injury roll coverage in computeTrainingImpact", () => {
      const warrior = makeWarrior({ ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 });
      const state = makeState({
        week: 1,
        roster: [warrior],
        trainingAssignments: [{ warriorId: "w1", type: "attribute", attribute: "ST" }] as any
      });

      const rng = new SeededRNG(12345);
      const impact = computeTrainingImpact(state as any, rng as any);

      // Just verify the function runs without error
      expect(impact).toBeDefined();
      expect(impact.results).toBeDefined();
    });
  });



  describe("trainingImpactToStateImpact edge cases", () => {
    it("should ignore blocked results for newsletter", () => {
      const state = makeState();
      const impact = {
        updatedRoster: [],
        updatedSeasonalGrowth: [],
        results: [{ type: "blocked", warriorId: "w1", message: "blocked" }]
      } as any;
      const res = trainingImpactToStateImpact(state, impact, new SeededRNG(123) as any);
      expect(res.impact.newsletterItems).toEqual([]);
    });

    it("should populate newsletterItems properly and use rng.uuid", () => {
      const state = makeState({ week: 10 });
      const impact = {
        updatedRoster: [],
        updatedSeasonalGrowth: [],
        results: [{ type: "attribute", warriorId: "w1", message: "Gained ST!" }]
      } as any;
      const rng = new SeededRNG(123) as any;
      rng.uuid = vi.fn().mockReturnValue("newsletter-123");
      const res = trainingImpactToStateImpact(state, impact, rng);
      expect(res.impact.newsletterItems).toBeDefined();
      expect(res.impact.newsletterItems?.length).toBe(1);
      if (res.impact.newsletterItems) {
        expect(res.impact.newsletterItems[0].id).toBe("newsletter-123");
        expect(res.impact.newsletterItems[0].title).toBe("Training Report");
        expect(res.impact.newsletterItems[0].items).toEqual(["Gained ST!"]);
        expect(res.impact.newsletterItems[0].week).toBe(10);
      }
      expect(rng.uuid).toHaveBeenCalledWith("newsletter");
    });

    it("should generate proper roster updates delta", () => {
      const warrior = makeWarrior({ ST: 12, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 12 });
      const state = makeState({ roster: [warrior] });
      const updatedWarrior = { ...warrior, fatigue: 10, injuries: [] };
      const impact = {
        updatedRoster: [updatedWarrior],
        updatedSeasonalGrowth: [],
        results: []
      } as any;

      const rng = new SeededRNG(123) as any;
      const res = trainingImpactToStateImpact(state, impact, rng);

      expect(res.impact.rosterUpdates?.get(warrior.id)).toEqual({
        baseSkills: warrior.baseSkills,
        derivedStats: warrior.derivedStats,
        fatigue: 10,
        injuries: [],
      });
    });
  });


});
