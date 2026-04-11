import { describe, it, expect, beforeEach } from "vitest";
import { createFreshState } from "@/engine/factories";
import { FightingStyle } from "@/types/shared.types";
import { collectEligibleAIWarriors } from "@/engine/matchmaking/aiPoolCollector";
import { makeWarrior } from "@/engine/factories";
import type { GameState } from "@/types/state.types";

describe("AIPoolCollector", () => {
  let state: GameState;

  beforeEach(() => {
    state = createFreshState("test-seed");
    state.week = 5;
  });

  describe("collectEligibleAIWarriors", () => {
    it("should collect warriors from all rival stables", () => {
      const pool = collectEligibleAIWarriors(state, state.rivals);
      
      expect(pool.length).toBeGreaterThan(0);
      expect(pool.every(p => p.warrior)).toBe(true);
      expect(pool.every(p => p.stableId)).toBe(true);
      expect(pool.every(p => p.stableName)).toBe(true);
    });

    it("should exclude warriors with non-Active status", () => {
      // Set one warrior to Retired
      state.rivals[0].roster[0].status = "Retired";
      
      const pool = collectEligibleAIWarriors(state, state.rivals);
      const retiredWarrior = pool.find(p => p.warrior.id === state.rivals[0].roster[0].id);
      
      expect(retiredWarrior).toBeUndefined();
    });

    it("should exclude warriors on rest", () => {
      const warriorId = state.rivals[0].roster[0].id;
      state.restStates = [{ warriorId, restUntilWeek: state.week + 1 }];
      
      const pool = collectEligibleAIWarriors(state, state.rivals);
      const restedWarrior = pool.find(p => p.warrior.id === warriorId);
      
      expect(restedWarrior).toBeUndefined();
    });

    it("should exclude warriors in training", () => {
      const warriorId = state.rivals[0].roster[0].id;
      state.trainingAssignments = [{ warriorId, type: "attribute", attribute: "ST" }];
      
      const pool = collectEligibleAIWarriors(state, state.rivals);
      const trainingWarrior = pool.find(p => p.warrior.id === warriorId);
      
      expect(trainingWarrior).toBeUndefined();
    });

    it("should include stable index in pool entry", () => {
      const pool = collectEligibleAIWarriors(state, state.rivals);
      
      pool.forEach(entry => {
        expect(typeof entry.stableIdx).toBe("number");
        expect(entry.stableIdx).toBeGreaterThanOrEqual(0);
        expect(entry.stableIdx).toBeLessThan(state.rivals.length);
      });
    });

    it("should include correct stable metadata", () => {
      const pool = collectEligibleAIWarriors(state, state.rivals);
      
      pool.forEach(entry => {
        const stable = state.rivals[entry.stableIdx];
        expect(entry.stableId).toBe(stable.owner.id);
        expect(entry.stableName).toBe(stable.owner.stableName);
      });
    });

    it("should return empty pool for empty rivals", () => {
      const emptyRivals: any[] = [];
      const pool = collectEligibleAIWarriors(state, emptyRivals);
      
      expect(pool.length).toBe(0);
    });

    it("should handle rivals with empty rosters", () => {
      const rivalsWithEmptyRosters = state.rivals.map(r => ({ ...r, roster: [] }));
      const pool = collectEligibleAIWarriors(state, rivalsWithEmptyRosters);
      
      expect(pool.length).toBe(0);
    });

    it("should include warriors from multiple stables", () => {
      const pool = collectEligibleAIWarriors(state, state.rivals);
      const stableIds = new Set(pool.map(p => p.stableId));
      
      expect(stableIds.size).toBeGreaterThan(1);
    });
  });
});
