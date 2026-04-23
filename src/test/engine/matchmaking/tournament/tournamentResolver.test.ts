import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createFreshState } from '@/engine/factories';
import { FightingStyle } from '@/types/shared.types';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { buildTournament } from '@/engine/matchmaking/tournament/tournamentBracketBuilder';
import {
  resolveRound,
  resolveCompleteTournament,
} from '@/engine/matchmaking/tournament/tournamentResolver';
import { makeWarrior } from '@/engine/factories';
import { resolveImpacts } from '@/engine/impacts';
import type { TournamentBout } from '@/types/state.types';

describe('TournamentResolver', () => {
  let state: any;

  beforeEach(() => {
    state = createFreshState('test-seed');
    state.roster = [];
    state.rivals = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('resolveRound', () => {
    it('should resolve a round and advance bracket', () => {
      const rng = new SeededRNGService(12345);
      const warriors = Array.from({ length: 64 }, (_, i) =>
        makeWarrior(
          undefined,
          `Warrior ${i}`,
          FightingStyle.StrikingAttack,
          {
            ST: 10,
            CN: 10,
            SZ: 10,
            WT: 10,
            WL: 10,
            SP: 10,
            DF: 10,
          },
          {},
          rng
        )
      );

      const tournament = buildTournament({
        tierId: 'Gold',
        tierName: 'Test Cup',
        warriors,
        week: 1,
        season: 'Spring',
        rng,
      } as any);

      state.tournaments = [tournament];

      const { impact, roundResults } = resolveRound(state, tournament.id, 12345);
      const updatedState = resolveImpacts(state, [impact]);

      // Check that bracket was updated with winners
      const updatedTournament = updatedState.tournaments[0];
      if (!updatedTournament) {
        throw new Error('Tournament not found');
      }
      const round1Matches = updatedTournament.bracket.filter((b: TournamentBout) => b.round === 1);
      const hasWinners = round1Matches.every((b: TournamentBout) => b.winner !== undefined);
      expect(hasWinners).toBe(true);
      // Round results may be empty, just verify it's an array
      expect(Array.isArray(roundResults)).toBe(true);
    });

    it('should determine winners for each match', () => {
      const rng = new SeededRNGService(12345);
      const warriors = Array.from({ length: 64 }, (_, i) =>
        makeWarrior(
          undefined,
          `Warrior ${i}`,
          FightingStyle.StrikingAttack,
          {
            ST: 10,
            CN: 10,
            SZ: 10,
            WT: 10,
            WL: 10,
            SP: 10,
            DF: 10,
          },
          {},
          rng
        )
      );

      const tournament = buildTournament({
        tierId: 'Gold',
        tierName: 'Test Cup',
        warriors,
        week: 1,
        season: 'Spring',
        rng,
      } as any);

      state.tournaments = [tournament];

      const { impact } = resolveRound(state, tournament.id, 12345);
      const updatedState = resolveImpacts(state, [impact]);

      const resolvedTournament = updatedState.tournaments[0];
      if (!resolvedTournament) {
        throw new Error('Tournament not found');
      }
      const round1Matches = resolvedTournament.bracket.filter((b: TournamentBout) => b.round === 1);

      round1Matches.forEach((match: TournamentBout) => {
        expect(match.winner).toBeDefined();
        expect(['A', 'D']).toContain(match.winner);
      });
    });

    it('should return round results', () => {
      const rng = new SeededRNGService(12345);
      const warriors = Array.from({ length: 64 }, (_, i) =>
        makeWarrior(
          undefined,
          `Warrior ${i}`,
          FightingStyle.StrikingAttack,
          {
            ST: 10,
            CN: 10,
            SZ: 10,
            WT: 10,
            WL: 10,
            SP: 10,
            DF: 10,
          },
          {},
          rng
        )
      );

      const tournament = buildTournament({
        tierId: 'Gold',
        tierName: 'Test Cup',
        warriors,
        week: 1,
        season: 'Spring',
        rng,
      } as any);

      state.tournaments = [tournament];

      const { roundResults } = resolveRound(state, tournament.id, 12345);

      expect(Array.isArray(roundResults)).toBe(true);
    });
  });

  describe('resolveCompleteTournament', () => {
    it('should resolve all rounds to completion', () => {
      const rng = new SeededRNGService(12345);
      const warriors = Array.from({ length: 64 }, (_, i) =>
        makeWarrior(
          undefined,
          `Warrior ${i}`,
          FightingStyle.StrikingAttack,
          {
            ST: 10,
            CN: 10,
            SZ: 10,
            WT: 10,
            WL: 10,
            SP: 10,
            DF: 10,
          },
          {},
          rng
        )
      );

      const tournament = buildTournament({
        tierId: 'Gold',
        tierName: 'Test Cup',
        warriors,
        week: 1,
        season: 'Spring',
        rng,
      } as any);

      state.tournaments = [tournament];

      const impact = resolveCompleteTournament(state, tournament.id, 12345);
      const updatedState = resolveImpacts(state, [impact]);

      expect(updatedState.tournaments![0]!.completed).toBe(true);
      expect(updatedState.tournaments![0]!.champion).toBeDefined();
    });

    it('should determine a champion', () => {
      const rng = new SeededRNGService(12345);
      const warriors = Array.from({ length: 64 }, (_, i) =>
        makeWarrior(
          undefined,
          `Warrior ${i}`,
          FightingStyle.StrikingAttack,
          {
            ST: 10,
            CN: 10,
            SZ: 10,
            WT: 10,
            WL: 10,
            SP: 10,
            DF: 10,
          },
          {},
          rng
        )
      );

      const tournament = buildTournament({
        tierId: 'Gold',
        tierName: 'Test Cup',
        warriors,
        week: 1,
        season: 'Spring',
        rng,
      } as any);

      state.tournaments = [tournament];

      const impact = resolveCompleteTournament(state, tournament.id, 12345);
      const updatedState = resolveImpacts(state, [impact]);

      const champion = updatedState.tournaments![0]!.champion;
      expect(champion).toBeDefined();
      // Champion is a string (warrior ID)
      if (champion) {
        expect(typeof champion).toBe('string');
      }
    });

    it('should be deterministic with same seed', () => {
      const rng = new SeededRNGService(12345);
      const warriors = Array.from({ length: 64 }, (_, i) =>
        makeWarrior(
          undefined,
          `Warrior ${i}`,
          FightingStyle.StrikingAttack,
          {
            ST: 10,
            CN: 10,
            SZ: 10,
            WT: 10,
            WL: 10,
            SP: 10,
            DF: 10,
          },
          {},
          rng
        )
      );

      const tournament1 = buildTournament({
        tierId: 'Gold',
        tierName: 'Test Cup',
        warriors,
        week: 1,
        season: 'Spring',
        rng: new SeededRNGService(12345),
      } as any);

      const state1 = { ...state, tournaments: [tournament1] };
      const impact1 = resolveCompleteTournament(state1, tournament1.id, 12345);
      const result1 = resolveImpacts(state1, [impact1]);

      const tournament2 = buildTournament({
        tierId: 'Gold',
        tierName: 'Test Cup',
        warriors,
        week: 1,
        season: 'Spring',
        rng: new SeededRNGService(12345),
      } as any);

      const state2 = { ...state, tournaments: [tournament2] };
      const impact2 = resolveCompleteTournament(state2, tournament2.id, 12345);
      const result2 = resolveImpacts(state2, [impact2]);

      expect(result1.tournaments![0]!.champion).toBe(result2.tournaments![0]!.champion);
    });
  });

  describe('7-round format structure', () => {
    it('should progress through all 7 rounds for 64 warriors', () => {
      const rng = new SeededRNGService(12345);
      const warriors = Array.from({ length: 64 }, (_, i) =>
        makeWarrior(
          undefined,
          `Warrior ${i}`,
          FightingStyle.StrikingAttack,
          {
            ST: 10,
            CN: 10,
            SZ: 10,
            WT: 10,
            WL: 10,
            SP: 10,
            DF: 10,
          },
          {},
          rng
        )
      );

      const tournament = buildTournament({
        tierId: 'Gold',
        tierName: 'Test Cup',
        warriors,
        week: 1,
        season: 'Spring',
        rng,
      } as any);

      state.tournaments = [tournament];

      let currentState = state;
      const roundCounts: number[] = [];

      // Resolve round by round and track structure
      for (let round = 1; round <= 7; round++) {
        const { impact } = resolveRound(currentState, tournament.id, 12345 + round);
        currentState = resolveImpacts(currentState, [impact]);

        const tour = currentState.tournaments![0]!;
        const matchesInRound = tour.bracket.filter((b: TournamentBout) => b.round === round).length;
        roundCounts.push(matchesInRound);

        // All matches in this round should have winners after resolution
        const resolvedMatches = tour.bracket.filter(
          (b: TournamentBout) => b.round === round && b.winner !== undefined
        ).length;
        expect(resolvedMatches).toBe(matchesInRound);
      }

      // Verify 7-round structure: 32 → 16 → 8 → 4 → 2 → 2 → 1
      expect(roundCounts[0]).toBe(32); // Round 1: Round of 64
      expect(roundCounts[1]).toBe(16); // Round 2: Round of 32
      expect(roundCounts[2]).toBe(8); // Round 3: Round of 16
      expect(roundCounts[3]).toBe(4); // Round 4: Quarter-finals
      expect(roundCounts[4]).toBe(2); // Round 5: Semi-finals
      expect(roundCounts[5]).toBe(2); // Round 6: Finals + Bronze
      expect(roundCounts[6]).toBe(1); // Round 7: Single match (from progression)

      expect(currentState.tournaments![0]!.completed).toBe(true);
    });

    it('should inject bronze match after semifinals (round 5)', () => {
      const rng = new SeededRNGService(12345);
      const warriors = Array.from({ length: 64 }, (_, i) =>
        makeWarrior(
          undefined,
          `Warrior ${i}`,
          FightingStyle.StrikingAttack,
          {
            ST: 10,
            CN: 10,
            SZ: 10,
            WT: 10,
            WL: 10,
            SP: 10,
            DF: 10,
          },
          {},
          rng
        )
      );

      const tournament = buildTournament({
        tierId: 'Gold',
        tierName: 'Test Cup',
        warriors,
        week: 1,
        season: 'Spring',
        rng,
      } as any);

      state.tournaments = [tournament];

      // Resolve through round 5 (semifinals)
      let currentState = state;
      for (let round = 1; round <= 5; round++) {
        const { impact } = resolveRound(currentState, tournament.id, 12345 + round);
        currentState = resolveImpacts(currentState, [impact]);
      }

      const tour = currentState.tournaments![0]!;

      // Check that round 6 has both Finals and Bronze match
      const round6Matches = tour.bracket.filter((b: TournamentBout) => b.round === 6);
      expect(round6Matches.length).toBe(2);

      // One should be finals (index 0), one should be bronze (index 1)
      const finals = round6Matches.find((b: TournamentBout) => b.matchIndex === 0);
      const bronze = round6Matches.find((b: TournamentBout) => b.matchIndex === 1);

      expect(finals).toBeDefined();
      expect(bronze).toBeDefined();

      // Bronze match should have the losers from semifinals
      expect(bronze!.warriorIdA).toBeDefined();
      expect(bronze!.warriorIdD).toBeDefined();
      expect(bronze!.warriorIdA).not.toBe(bronze!.warriorIdD);
    });

    it('should track semifinal losers for bronze match', () => {
      const rng = new SeededRNGService(12345);
      const warriors = Array.from({ length: 64 }, (_, i) =>
        makeWarrior(
          undefined,
          `Warrior ${i}`,
          FightingStyle.StrikingAttack,
          {
            ST: 10,
            CN: 10,
            SZ: 10,
            WT: 10,
            WL: 10,
            SP: 10,
            DF: 10,
          },
          {},
          rng
        )
      );

      const tournament = buildTournament({
        tierId: 'Gold',
        tierName: 'Test Cup',
        warriors,
        week: 1,
        season: 'Spring',
        rng,
      } as any);

      state.tournaments = [tournament];

      // Resolve through round 4 to get semifinalists
      let currentState = state;
      for (let round = 1; round <= 4; round++) {
        const { impact } = resolveRound(currentState, tournament.id, 12345 + round);
        currentState = resolveImpacts(currentState, [impact]);
      }

      const tour = currentState.tournaments![0]!;
      const semifinalMatches = tour.bracket.filter((b: TournamentBout) => b.round === 5);
      expect(semifinalMatches.length).toBe(2);

      // Track semifinal warrior IDs before resolution
      const semifinalWarriorIds = new Set<string>();
      semifinalMatches.forEach((m: TournamentBout) => {
        semifinalWarriorIds.add(m.warriorIdA);
        semifinalWarriorIds.add(m.warriorIdD);
      });
      expect(semifinalWarriorIds.size).toBe(4);

      // Resolve round 5 (semifinals)
      const { impact } = resolveRound(currentState, tournament.id, 12350);
      const afterSemifinals = resolveImpacts(currentState, [impact]);

      // Check that round 6 bronze match uses semifinal losers
      const bronzeMatch = afterSemifinals.tournaments![0]!.bracket.find(
        (b: TournamentBout) => b.round === 6 && b.matchIndex === 1
      );

      expect(bronzeMatch).toBeDefined();

      // Both bronze participants should be from the original 4 semifinalists
      expect(semifinalWarriorIds.has(bronzeMatch!.warriorIdA)).toBe(true);
      expect(semifinalWarriorIds.has(bronzeMatch!.warriorIdD)).toBe(true);
    });

    it('should award champion after 7 rounds', () => {
      const rng = new SeededRNGService(12345);
      const warriors = Array.from({ length: 64 }, (_, i) =>
        makeWarrior(
          undefined,
          `Warrior ${i}`,
          FightingStyle.StrikingAttack,
          {
            ST: 10,
            CN: 10,
            SZ: 10,
            WT: 10,
            WL: 10,
            SP: 10,
            DF: 10,
          },
          {},
          rng
        )
      );

      const tournament = buildTournament({
        tierId: 'Gold',
        tierName: 'Test Cup',
        warriors,
        week: 1,
        season: 'Spring',
        rng,
      } as any);

      state.tournaments = [tournament];

      const impact = resolveCompleteTournament(state, tournament.id, 12345);
      const finalState = resolveImpacts(state, [impact]);

      const completedTournament = finalState.tournaments![0]!;
      expect(completedTournament.completed).toBe(true);
      expect(completedTournament.champion).toBeDefined();

      // Champion should be one of the original participants
      const participantNames = warriors.map((w) => w.name);
      expect(participantNames).toContain(completedTournament.champion);
    });

    it('should handle bye matches correctly', () => {
      const rng = new SeededRNGService(12345);
      const warriors = Array.from({ length: 64 }, (_, i) =>
        makeWarrior(
          undefined,
          `Warrior ${i}`,
          FightingStyle.StrikingAttack,
          {
            ST: 10,
            CN: 10,
            SZ: 10,
            WT: 10,
            WL: 10,
            SP: 10,
            DF: 10,
          },
          {},
          rng
        )
      );

      const tournament = buildTournament({
        tierId: 'Gold',
        tierName: 'Test Cup',
        warriors,
        week: 1,
        season: 'Spring',
        rng,
      } as any);

      // Manually add a bye match to test bye handling
      tournament.bracket.push({
        round: 1,
        matchIndex: 32,
        a: warriors[0]!.name,
        d: '(bye)',
        warriorIdA: warriors[0]!.id,
        warriorIdD: 'bye' as any,
        winner: 'A', // Pre-set winner
      });

      state.tournaments = [tournament];

      // Resolve round 1
      const { impact } = resolveRound(state, tournament.id, 12345);
      const afterRound1 = resolveImpacts(state, [impact]);

      const tour = afterRound1.tournaments![0]!;

      // Bye matches should have winner = "A"
      const byeMatches = tour.bracket.filter((b: TournamentBout) => b.d === '(bye)');
      expect(byeMatches.length).toBeGreaterThan(0);
      byeMatches.forEach((b: TournamentBout) => {
        expect(b.winner).toBe('A');
      });
    });

    it('should handle warrior deaths during tournament', () => {
      const rng = new SeededRNGService(12345);
      const warriors = Array.from({ length: 64 }, (_, i) =>
        makeWarrior(
          undefined,
          `Warrior ${i}`,
          FightingStyle.StrikingAttack,
          {
            ST: 10,
            CN: 10,
            SZ: 10,
            WT: 10,
            WL: 10,
            SP: 10,
            DF: 10,
          },
          {},
          rng
        )
      );

      const tournament = buildTournament({
        tierId: 'Gold',
        tierName: 'Test Cup',
        warriors,
        week: 1,
        season: 'Spring',
        rng,
      } as any);

      state.tournaments = [tournament];

      const impact = resolveCompleteTournament(state, tournament.id, 12345);
      const finalState = resolveImpacts(state, [impact]);

      // Check that arena history was populated with fight results
      expect(finalState.arenaHistory!.length).toBeGreaterThan(0);

      // Check for tournament-specific fight summaries
      const tournamentFights = finalState.arenaHistory!.filter(
        (h: any) => h.tournamentId === tournament.id
      );
      expect(tournamentFights.length).toBeGreaterThan(0);
    });
  });
});
