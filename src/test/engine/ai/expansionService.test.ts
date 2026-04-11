import { describe, it, expect, beforeEach } from "vitest";
import { ExpansionService } from "@/engine/ai/expansionService";
import { createFreshState } from "@/engine/factories";
import { SeededRNGService } from "@/engine/core/rng/SeededRNGService";
import type { GameState } from "@/types/state.types";

describe("ExpansionService", () => {
  let state: GameState;

  beforeEach(() => {
    state = createFreshState("test-seed");
    state.rivals = state.rivals.slice(0, 5); // Reduce to 5 stables
  });

  describe("processExpansion", () => {
    it("should process expansion for rival stables", () => {
      const { updatedState, newStables } = ExpansionService.processExpansion(state, new SeededRNGService(12345), 8);
      
      expect(Array.isArray(updatedState.rivals)).toBe(true);
      expect(Array.isArray(newStables)).toBe(true);
    });

    it("should add new stables when below target count", () => {
      // Use a seed that will pass the 0.3 threshold check
      const { updatedState, newStables } = ExpansionService.processExpansion(state, new SeededRNGService(1), 8);
      
      expect(newStables.length).toBeGreaterThan(0);
      expect(updatedState.rivals.length).toBeGreaterThan(state.rivals.length);
    });

    it("should not add stables when at target count", () => {
      const { updatedState, newStables } = ExpansionService.processExpansion(state, new SeededRNGService(12345), 5);
      
      expect(newStables.length).toBe(0);
      expect(updatedState.rivals.length).toBe(state.rivals.length);
    });

    it("should not add stables when above target count", () => {
      const { updatedState, newStables } = ExpansionService.processExpansion(state, new SeededRNGService(12345), 3);
      
      expect(newStables.length).toBe(0);
      expect(updatedState.rivals.length).toBe(state.rivals.length);
    });

    it("should integrate legacy founders when provided", () => {
      const legacyCandidates = [
        { name: "Legend", stableName: "Legend's Academy" }
      ];

      const { updatedState, newStables } = ExpansionService.processExpansion(state, new SeededRNGService(12345), 8, legacyCandidates);
      
      if (newStables.length > 0) {
        const hasLegacy = newStables.some(s => s.owner.name === "Legend");
        expect(hasLegacy).toBe(true);
      }
    });

    it("should set personality to Aggressive for legacy founders", () => {
      const legacyCandidates = [
        { name: "Legend", stableName: "Legend's Academy" }
      ];

      const { newStables } = ExpansionService.processExpansion(state, new SeededRNGService(12345), 8, legacyCandidates);
      
      if (newStables.length > 0) {
        const legacyStable = newStables.find(s => s.owner.name === "Legend");
        if (legacyStable) {
          expect(legacyStable.owner.personality).toBe("Aggressive");
        }
      }
    });

    it("should generate new stables with valid structure", () => {
      const { newStables } = ExpansionService.processExpansion(state, new SeededRNGService(12345), 8);
      
      newStables.forEach(stable => {
        expect(stable.id).toBeDefined();
        expect(stable.owner).toBeDefined();
        expect(stable.owner.name).toBeDefined();
        expect(stable.owner.stableName).toBeDefined();
        expect(stable.roster).toBeDefined();
        expect(Array.isArray(stable.roster)).toBe(true);
      });
    });

    it("should be deterministic with same seed", () => {
      const { newStables: stables1 } = ExpansionService.processExpansion(state, new SeededRNGService(12345), 8);
      const { newStables: stables2 } = ExpansionService.processExpansion(state, new SeededRNGService(12345), 8);
      
      expect(stables1.length).toBe(stables2.length);
      if (stables1.length > 0 && stables2.length > 0) {
        expect(stables1[0].owner.name).toBe(stables2[0].owner.name);
      }
    });

    it("should handle empty rivals list", () => {
      state.rivals = [];
      
      const { updatedState, newStables } = ExpansionService.processExpansion(state, new SeededRNGService(12345), 5);
      
      expect(updatedState.rivals.length).toBe(newStables.length);
    });

    it("should not exceed target count", () => {
      const { updatedState } = ExpansionService.processExpansion(state, new SeededRNGService(12345), 10);
      
      expect(updatedState.rivals.length).toBeLessThanOrEqual(10);
    });
  });
});
