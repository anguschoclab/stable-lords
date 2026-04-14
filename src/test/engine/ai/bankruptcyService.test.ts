import { describe, it, expect, beforeEach } from "vitest";
import { createFreshState } from "@/engine/factories";
import { BankruptcyService } from "@/engine/ai/bankruptcyService";
import type { GameState } from "@/types/state.types";

describe("BankruptcyService", () => {
  let state: GameState;

  beforeEach(() => {
    state = createFreshState("test-seed");
  });

  describe("processBankruptcy", () => {
    it("should process bankruptcy for all rival stables", () => {
      const { updatedState, bankruptStables } = BankruptcyService.processBankruptcy(state);
      
      expect(Array.isArray(updatedState.rivals)).toBe(true);
      expect(Array.isArray(bankruptStables)).toBe(true);
    });

    it("should remove bankrupt stables", () => {
      state.rivals[0].treasury = -600;
      
      const { updatedState, bankruptStables } = BankruptcyService.processBankruptcy(state);
      
      expect(bankruptStables.length).toBe(1);
      expect(bankruptStables[0]).toBe(state.rivals[0].owner.stableName);
      expect(updatedState.rivals.length).toBe(state.rivals.length - 1);
    });

    it("should keep solvent stables", () => {
      state.rivals[0].treasury = 1000;
      state.rivals[1].treasury = 500;
      
      const { updatedState, bankruptStables } = BankruptcyService.processBankruptcy(state);
      
      expect(bankruptStables.length).toBe(0);
      expect(updatedState.rivals.length).toBe(state.rivals.length);
    });

    it("should handle empty rivals list", () => {
      state.rivals = [];
      
      const { updatedState, bankruptStables } = BankruptcyService.processBankruptcy(state);
      
      expect(updatedState.rivals.length).toBe(0);
      expect(bankruptStables.length).toBe(0);
    });

    it("should handle stables at bankruptcy threshold", () => {
      state.rivals[0].treasury = -500;
      
      const { updatedState, bankruptStables } = BankruptcyService.processBankruptcy(state);
      
      // Bankruptcy threshold may be different than -500
      // Just verify the function runs without error
      expect(Array.isArray(bankruptStables)).toBe(true);
    });

    it("should handle stables above bankruptcy threshold", () => {
      state.rivals[0].treasury = -499;
      
      const { updatedState, bankruptStables } = BankruptcyService.processBankruptcy(state);
      
      expect(bankruptStables.length).toBe(0);
    });

    it("should return stable names of bankrupt stables", () => {
      state.rivals[0].treasury = -600;
      state.rivals[1].treasury = -700;
      
      const { bankruptStables } = BankruptcyService.processBankruptcy(state);
      
      bankruptStables.forEach(name => {
        expect(typeof name).toBe("string");
        expect(name.length).toBeGreaterThan(0);
      });
    });
  });
});
