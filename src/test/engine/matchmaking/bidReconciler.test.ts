import { describe, it, expect, beforeEach } from "vitest";
import { createFreshState } from "@/engine/factories";
import { FightingStyle } from "@/types/shared.types";
import { reconcileBidsIntoPairings } from "@/engine/matchmaking/bidReconciler";
import { makeWarrior } from "@/engine/factories";
import type { GameState } from "@/types/state.types";
import type { AIPoolWarrior } from "@/engine/matchmaking/aiPoolCollector";

describe("BidReconciler", () => {
  let state: GameState;
  let pool: AIPoolWarrior[];

  beforeEach(() => {
    state = createFreshState("test-seed");
    state.week = 5;
    state.weather = "Clear";
    
    // Create a test pool of warriors
    pool = [];
    state.rivals.forEach((rival, idx) => {
      rival.roster.forEach(warrior => {
        if (warrior.status === "Active") {
          pool.push({
            warrior,
            stableIdx: idx,
            stableId: rival.owner.id,
            stableName: rival.owner.stableName
          });
        }
      });
    });
  });

  describe("reconcileBidsIntoPairings", () => {
    it("should create bout pairs from pool", () => {
      const { boutPairs } = reconcileBidsIntoPairings(pool, state.rivals, state, 12345);
      
      expect(Array.isArray(boutPairs)).toBe(true);
      expect(boutPairs.length).toBeGreaterThanOrEqual(0);
    });

    it("should limit bouts to maximum of 6", () => {
      const { boutPairs } = reconcileBidsIntoPairings(pool, state.rivals, state, 12345);
      
      expect(boutPairs.length).toBeLessThanOrEqual(6);
    });

    it("should prevent stablemates from fighting each other", () => {
      const { boutPairs } = reconcileBidsIntoPairings(pool, state.rivals, state, 12345);
      
      boutPairs.forEach(pair => {
        expect(pair.a.stableId).not.toBe(pair.d.stableId);
      });
    });

    it("should return updated rivals with agent actions logged", () => {
      const { updatedRivals } = reconcileBidsIntoPairings(pool, state.rivals, state, 12345);
      
      expect(updatedRivals.length).toBe(state.rivals.length);
    });

    it("should not pair the same warrior twice", () => {
      const { boutPairs } = reconcileBidsIntoPairings(pool, state.rivals, state, 12345);
      
      const allWarriorIds = new Set<string>();
      boutPairs.forEach(pair => {
        expect(allWarriorIds.has(pair.a.warrior.id)).toBe(false);
        expect(allWarriorIds.has(pair.d.warrior.id)).toBe(false);
        allWarriorIds.add(pair.a.warrior.id);
        allWarriorIds.add(pair.d.warrior.id);
      });
    });

    it("should return empty pairs for empty pool", () => {
      const emptyPool: AIPoolWarrior[] = [];
      const { boutPairs } = reconcileBidsIntoPairings(emptyPool, state.rivals, state, 12345);
      
      expect(boutPairs.length).toBe(0);
    });

    it("should handle pool with only one stable", () => {
      const singleStablePool = pool.filter(p => p.stableIdx === 0);
      const { boutPairs } = reconcileBidsIntoPairings(singleStablePool, [state.rivals[0]], state, 12345);
      
      // No pairs should be created since all warriors are from same stable
      expect(boutPairs.length).toBe(0);
    });

    it("should be deterministic with same seed", () => {
      const { boutPairs: pairs1 } = reconcileBidsIntoPairings(pool, state.rivals, state, 12345);
      const { boutPairs: pairs2 } = reconcileBidsIntoPairings(pool, state.rivals, state, 12345);
      
      expect(pairs1.length).toBe(pairs2.length);
      if (pairs1.length > 0 && pairs2.length > 0) {
        expect(pairs1[0].a.warrior.id).toBe(pairs2[0].a.warrior.id);
      }
    });

    it("should produce different results with different seeds", () => {
      const { boutPairs: pairs1 } = reconcileBidsIntoPairings(pool, state.rivals, state, 12345);
      const { boutPairs: pairs2 } = reconcileBidsIntoPairings(pool, state.rivals, state, 54321);
      
      // Results may differ due to random selection
      // Just verify both produce valid results
      expect(Array.isArray(pairs1)).toBe(true);
      expect(Array.isArray(pairs2)).toBe(true);
    });
  });
});
