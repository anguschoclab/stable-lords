import { describe, it, expect } from 'vitest';
import { FightingStyle } from '@/types/shared.types';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { buildTournament } from '@/engine/matchmaking/tournament/tournamentBracketBuilder';
import { makeWarrior } from '@/engine/factories';

describe('TournamentBracketBuilder', () => {
  describe('buildTournament', () => {
    it('should create a 64-warrior bracket', () => {
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
      });

      expect(tournament.bracket.length).toBe(32); // 64 warriors = 32 matches
    });

    it('should have correct tournament metadata', () => {
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
        tierId: 'Silver',
        tierName: 'Silver Plate',
        warriors,
        week: 5,
        season: 'Summer',
        rng,
      });

      expect(tournament.tierId).toBe('Silver');
      expect(tournament.name).toBe('Silver Plate');
      expect(tournament.week).toBe(5);
      expect(tournament.season).toBe('Summer');
      expect(tournament.completed).toBe(false);
    });

    it('should include all warriors as participants', () => {
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
      });

      expect(tournament.participants.length).toBe(64);
      expect(tournament.participants).toEqual(warriors);
    });

    it('should create round 1 matches with correct structure', () => {
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
      });

      const round1Matches = tournament.bracket.filter((b) => b.round === 1);
      expect(round1Matches.length).toBe(32);

      round1Matches.forEach((match) => {
        expect(match.round).toBe(1);
        expect(match.a).toBeDefined();
        expect(match.d).toBeDefined();
        expect(match.warriorIdA).toBeDefined();
        expect(match.warriorIdD).toBeDefined();
        expect(match.winner).toBeUndefined();
      });
    });

    it('should shuffle warriors before creating bracket', () => {
      const rng1 = new SeededRNGService(12345);
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
          rng1
        )
      );

      const tournament1 = buildTournament({
        tierId: 'Gold',
        tierName: 'Test Cup',
        warriors,
        week: 1,
        season: 'Spring',
        rng: new SeededRNGService(12345),
      });

      const tournament2 = buildTournament({
        tierId: 'Gold',
        tierName: 'Test Cup',
        warriors,
        week: 1,
        season: 'Spring',
        rng: new SeededRNGService(12345),
      });

      // Same seed should produce same bracket
      expect(tournament1.bracket[0].a).toBe(tournament2.bracket[0].a);
    });

    it('should generate unique tournament ID', () => {
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
        rng,
      });

      const tournament2 = buildTournament({
        tierId: 'Gold',
        tierName: 'Test Cup',
        warriors,
        week: 2,
        season: 'Spring',
        rng,
      });

      expect(tournament1.id).not.toBe(tournament2.id);
    });
  });
});
