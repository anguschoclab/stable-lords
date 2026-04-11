import { describe, it, expect } from "vitest";
import { FightingStyle } from "@/types/shared.types";
import { SeededRNGService } from "@/engine/core/rng/SeededRNGService";
import { generateFreelancer } from "@/engine/matchmaking/tournament/tournamentFreelancerGenerator";
import { makeWarrior } from "@/engine/factories";

describe("TournamentFreelancerGenerator", () => {
  describe("generateFreelancer", () => {
    it("should generate a freelancer warrior", () => {
      const rng = new SeededRNGService(12345);
      const freelancer = generateFreelancer("Gold", 1, rng);

      expect(freelancer).toBeDefined();
      expect(freelancer.id).toBeDefined();
      expect(freelancer.name).toBeDefined();
      expect(freelancer.style).toBeDefined();
    });

    it("should generate freelancer with valid attributes", () => {
      const rng = new SeededRNGService(12345);
      const freelancer = generateFreelancer("Silver", 2, rng);

      expect(freelancer.attributes.ST).toBeGreaterThan(0);
      expect(freelancer.attributes.CN).toBeGreaterThan(0);
      expect(freelancer.attributes.SZ).toBeGreaterThan(0);
      expect(freelancer.attributes.WT).toBeGreaterThan(0);
      expect(freelancer.attributes.WL).toBeGreaterThan(0);
      expect(freelancer.attributes.SP).toBeGreaterThan(0);
      expect(freelancer.attributes.DF).toBeGreaterThan(0);
    });

    it("should generate freelancer with tier-appropriate attributes", () => {
      const rng = new SeededRNGService(12345);
      const goldFreelancer = generateFreelancer("Gold", 1, rng);
      const silverFreelancer = generateFreelancer("Silver", 2, new SeededRNGService(12345));
      const bronzeFreelancer = generateFreelancer("Bronze", 3, new SeededRNGService(12345));
      const ironFreelancer = generateFreelancer("Iron", 4, new SeededRNGService(12345));

      // Gold should have higher average attributes than Iron
      const goldAvg = Object.values(goldFreelancer.attributes).reduce((a, b) => a + b, 0) / 7;
      const ironAvg = Object.values(ironFreelancer.attributes).reduce((a, b) => a + b, 0) / 7;
      expect(goldAvg).toBeGreaterThanOrEqual(ironAvg);
    });

    it("should generate freelancer with valid fighting style", () => {
      const rng = new SeededRNGService(12345);
      const freelancer = generateFreelancer("Gold", 1, rng);

      expect(Object.values(FightingStyle)).toContain(freelancer.style);
    });

    it("should be deterministic with same seed", () => {
      const rng1 = new SeededRNGService(12345);
      const freelancer1 = generateFreelancer("Gold", 1, rng1);

      const rng2 = new SeededRNGService(12345);
      const freelancer2 = generateFreelancer("Gold", 1, rng2);

      expect(freelancer1.name).toBe(freelancer2.name);
      expect(freelancer1.style).toBe(freelancer2.style);
    });

    it("should generate different freelancers with different seeds", () => {
      const freelancer1 = generateFreelancer("Gold", 1, new SeededRNGService(12345));
      const freelancer2 = generateFreelancer("Gold", 1, new SeededRNGService(54321));

      expect(freelancer1.name).not.toBe(freelancer2.name);
    });

    it("should generate freelancer with Active status", () => {
      const rng = new SeededRNGService(12345);
      const freelancer = generateFreelancer("Gold", 1, rng);

      expect(freelancer.status).toBe("Active");
    });

    it("should generate freelancer with zero career stats", () => {
      const rng = new SeededRNGService(12345);
      const freelancer = generateFreelancer("Gold", 1, rng);

      expect(freelancer.career.wins).toBe(0);
      expect(freelancer.career.losses).toBe(0);
      expect(freelancer.career.kills).toBe(0);
    });

    it("should generate freelancer with zero fame and popularity", () => {
      const rng = new SeededRNGService(12345);
      const freelancer = generateFreelancer("Gold", 1, rng);

      expect(freelancer.fame).toBe(0);
      expect(freelancer.popularity).toBe(0);
    });
  });
});
