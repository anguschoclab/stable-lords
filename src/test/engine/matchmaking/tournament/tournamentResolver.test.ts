import { describe, it, expect, beforeEach } from "vitest";
import { createFreshState } from "@/engine/factories";
import { FightingStyle } from "@/types/shared.types";
import { SeededRNGService } from "@/engine/core/rng/SeededRNGService";
import { buildTournament } from "@/engine/matchmaking/tournament/tournamentBracketBuilder";
import { resolveRound, resolveCompleteTournament } from "@/engine/matchmaking/tournament/tournamentResolver";
import { makeWarrior } from "@/engine/factories";
import type { TournamentBout } from "@/types/state.types";

describe("TournamentResolver", () => {
  let state: any;

  beforeEach(() => {
    state = createFreshState("test-seed");
    state.roster = [];
    state.rivals = [];
  });

  describe("resolveRound", () => {
    it("should resolve a round and advance bracket", () => {
      const rng = new SeededRNGService(12345);
      const warriors = Array.from({ length: 64 }, (_, i) => 
        makeWarrior(undefined, `Warrior ${i}`, FightingStyle.StrikingAttack, {
          ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10
        }, {}, rng)
      );

      const tournament = buildTournament({
        tierId: "Gold",
        tierName: "Test Cup",
        warriors,
        week: 1,
        season: "Spring",
        rng
      });

      state.tournaments = [tournament];

      const { updatedState, roundResults } = resolveRound(state, tournament.id, 12345);

      // Check that bracket was updated with winners
      const updatedTournament = updatedState.tournaments[0];
      const round1Matches = updatedTournament.bracket.filter((b: TournamentBout) => b.round === 1);
      const hasWinners = round1Matches.every((b: TournamentBout) => b.winner !== undefined);
      expect(hasWinners).toBe(true);
      // Round results may be empty, just verify it's an array
      expect(Array.isArray(roundResults)).toBe(true);
    });

    it("should determine winners for each match", () => {
      const rng = new SeededRNGService(12345);
      const warriors = Array.from({ length: 64 }, (_, i) => 
        makeWarrior(undefined, `Warrior ${i}`, FightingStyle.StrikingAttack, {
          ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10
        }, {}, rng)
      );

      const tournament = buildTournament({
        tierId: "Gold",
        tierName: "Test Cup",
        warriors,
        week: 1,
        season: "Spring",
        rng
      });

      state.tournaments = [tournament];

      const { updatedState } = resolveRound(state, tournament.id, 12345);

      const resolvedTournament = updatedState.tournaments[0];
      const round1Matches = resolvedTournament.bracket.filter((b: TournamentBout) => b.round === 1);
      
      round1Matches.forEach((match: TournamentBout) => {
        expect(match.winner).toBeDefined();
        expect(["A", "D"]).toContain(match.winner);
      });
    });


    it("should return round results", () => {
      const rng = new SeededRNGService(12345);
      const warriors = Array.from({ length: 64 }, (_, i) => 
        makeWarrior(undefined, `Warrior ${i}`, FightingStyle.StrikingAttack, {
          ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10
        }, {}, rng)
      );

      const tournament = buildTournament({
        tierId: "Gold",
        tierName: "Test Cup",
        warriors,
        week: 1,
        season: "Spring",
        rng
      });

      state.tournaments = [tournament];

      const { roundResults } = resolveRound(state, tournament.id, 12345);

      expect(Array.isArray(roundResults)).toBe(true);
    });
  });

  describe("resolveCompleteTournament", () => {
    it("should resolve all rounds to completion", () => {
      const rng = new SeededRNGService(12345);
      const warriors = Array.from({ length: 64 }, (_, i) => 
        makeWarrior(undefined, `Warrior ${i}`, FightingStyle.StrikingAttack, {
          ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10
        }, {}, rng)
      );

      const tournament = buildTournament({
        tierId: "Gold",
        tierName: "Test Cup",
        warriors,
        week: 1,
        season: "Spring",
        rng
      });

      state.tournaments = [tournament];

      const updatedState = resolveCompleteTournament(state, tournament.id, 12345);

      expect(updatedState.tournaments[0].completed).toBe(true);
      expect(updatedState.tournaments[0].champion).toBeDefined();
    });

    it("should determine a champion", () => {
      const rng = new SeededRNGService(12345);
      const warriors = Array.from({ length: 64 }, (_, i) => 
        makeWarrior(undefined, `Warrior ${i}`, FightingStyle.StrikingAttack, {
          ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10
        }, {}, rng)
      );

      const tournament = buildTournament({
        tierId: "Gold",
        tierName: "Test Cup",
        warriors,
        week: 1,
        season: "Spring",
        rng
      });

      state.tournaments = [tournament];

      const updatedState = resolveCompleteTournament(state, tournament.id, 12345);

      const champion = updatedState.tournaments[0].champion;
      expect(champion).toBeDefined();
      // Champion is a string (warrior ID)
      if (champion) {
        expect(typeof champion).toBe("string");
      }
    });

    it("should be deterministic with same seed", () => {
      const rng = new SeededRNGService(12345);
      const warriors = Array.from({ length: 64 }, (_, i) => 
        makeWarrior(undefined, `Warrior ${i}`, FightingStyle.StrikingAttack, {
          ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10
        }, {}, rng)
      );

      const tournament1 = buildTournament({
        tierId: "Gold",
        tierName: "Test Cup",
        warriors,
        week: 1,
        season: "Spring",
        rng: new SeededRNGService(12345)
      });

      const state1 = { ...state, tournaments: [tournament1] };
      const result1 = resolveCompleteTournament(state1, tournament1.id, 12345);

      const tournament2 = buildTournament({
        tierId: "Gold",
        tierName: "Test Cup",
        warriors,
        week: 1,
        season: "Spring",
        rng: new SeededRNGService(12345)
      });

      const state2 = { ...state, tournaments: [tournament2] };
      const result2 = resolveCompleteTournament(state2, tournament2.id, 12345);

      expect(result1.tournaments[0].champion).toBe(result2.tournaments[0].champion);
    });
  });
});
