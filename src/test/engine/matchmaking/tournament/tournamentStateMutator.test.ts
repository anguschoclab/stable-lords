import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createFreshState } from '@/engine/factories';
import { FightingStyle } from '@/types/shared.types';
import {
  findWarriorById,
  modifyWarrior,
} from '@/engine/matchmaking/tournament/tournamentStateMutator';
import { makeWarrior } from '@/engine/factories';
import { resolveImpacts } from '@/engine/impacts';
import type { GameState } from '@/types/state.types';
import type { TournamentEntry } from '@/types/state.types';

describe('TournamentStateMutator', () => {
  let state: GameState;

  beforeEach(() => {
    state = createFreshState('test-seed');
    state.roster = [
      makeWarrior(undefined, 'Player Warrior', FightingStyle.StrikingAttack, {
        ST: 12,
        CN: 12,
        SZ: 12,
        WT: 12,
        WL: 12,
        SP: 12,
        DF: 12,
      }),
      makeWarrior(undefined, 'Player Warrior 2', FightingStyle.ParryRiposte, {
        ST: 10,
        CN: 14,
        SZ: 10,
        WT: 14,
        WL: 14,
        SP: 10,
        DF: 14,
      }),
    ];
    // Initialize rival rosters for tests that need them
    state.rivals = state.rivals.map((rival) => ({
      ...rival,
      roster: [
        makeWarrior(undefined, 'Rival Warrior', FightingStyle.StrikingAttack, {
          ST: 10,
          CN: 10,
          SZ: 10,
          WT: 10,
          WL: 10,
          SP: 10,
          DF: 10,
        }),
      ],
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('findWarriorById', () => {
    it('should find warrior in player roster', () => {
      const warrior = findWarriorById(state, state.roster[0].id);
      expect(warrior).toBeDefined();
      expect(warrior?.id).toBe(state.roster[0].id);
      expect(warrior?.name).toBe('Player Warrior');
    });

    it('should find warrior in rival roster', () => {
      const rivalId = state.rivals[0].roster[0].id;
      const warrior = findWarriorById(state, rivalId);
      expect(warrior).toBeDefined();
      expect(warrior?.id).toBe(rivalId);
    });

    it('should return undefined for non-existent warrior', () => {
      const warrior = findWarriorById(state, 'non-existent-id');
      expect(warrior).toBeUndefined();
    });

    it('should find warrior in tournament participants', () => {
      const tournamentId = 'test-tournament';
      const tournament: TournamentEntry = {
        id: tournamentId,
        season: 'Spring',
        week: 1,
        tierId: 'Gold',
        name: 'Test Cup',
        bracket: [],
        participants: [
          makeWarrior(undefined, 'Tournament Warrior', FightingStyle.StrikingAttack, {
            ST: 12,
            CN: 12,
            SZ: 12,
            WT: 12,
            WL: 12,
            SP: 12,
            DF: 12,
          }),
        ],
        completed: false,
      };

      state.tournaments = [tournament];
      const warrior = findWarriorById(state, tournament.participants[0].id, tournament);
      expect(warrior).toBeDefined();
      expect(warrior?.name).toBe('Tournament Warrior');
    });

    it('should prioritize tournament participants over rosters', () => {
      const warriorId = 'shared-id';
      // Don't add to roster - test should find in tournament only
      state.roster = [];

      const tournament: TournamentEntry = {
        id: 'test-tournament',
        season: 'Spring',
        week: 1,
        tierId: 'Gold',
        name: 'Test Cup',
        bracket: [],
        participants: [
          makeWarrior(undefined, 'Tournament Warrior', FightingStyle.StrikingAttack, {
            ST: 15,
            CN: 15,
            SZ: 15,
            WT: 15,
            WL: 15,
            SP: 15,
            DF: 15,
          }),
        ],
        completed: false,
      };
      tournament.participants[0].id = warriorId;
      state.tournaments = [tournament];

      const warrior = findWarriorById(state, warriorId, tournament);
      expect(warrior).toBeDefined();
      expect(warrior?.name).toBe('Tournament Warrior');
    });
  });

  describe('modifyWarrior', () => {
    it('should modify warrior in player roster', () => {
      const originalFame = state.roster[0].fame;
      const impact = modifyWarrior(state, state.roster[0].id, (w) => {
        w.fame = 100;
      });
      const updatedState = resolveImpacts(state, [impact]);

      const updatedWarrior = updatedState.roster.find((w) => w.id === state.roster[0].id);
      expect(updatedWarrior?.fame).toBe(100);
      expect(updatedWarrior?.fame).not.toBe(originalFame);
    });

    it('should modify warrior in rival roster', () => {
      const rivalId = state.rivals[0].roster[0].id;
      const originalFame = state.rivals[0].roster[0].fame;

      const impact = modifyWarrior(state, rivalId, (w) => {
        w.fame = 50;
      });
      const updatedState = resolveImpacts(state, [impact]);

      const updatedRival = updatedState.rivals[0];
      const updatedWarrior = updatedRival.roster.find((w) => w.id === rivalId);
      expect(updatedWarrior?.fame).toBe(50);
      expect(updatedWarrior?.fame).not.toBe(originalFame);
    });

    it('should return unchanged state for non-existent warrior', () => {
      const impact = modifyWarrior(state, 'non-existent-id', (w) => {
        w.fame = 100;
      });
      const updatedState = resolveImpacts(state, [impact]);

      // StateImpact with empty updates should resolve to same state
      expect(updatedState.roster).toEqual(state.roster);
      expect(updatedState.rivals).toEqual(state.rivals);
    });

    it('should apply complex transform function', () => {
      const impact = modifyWarrior(state, state.roster[0].id, (w) => {
        w.fame = w.fame + 10;
        w.career.wins = w.career.wins + 1;
        w.popularity = w.popularity + 5;
      });
      const updatedState = resolveImpacts(state, [impact]);

      const updatedWarrior = updatedState.roster.find((w) => w.id === state.roster[0].id);
      expect(updatedWarrior?.fame).toBe(10);
      expect(updatedWarrior?.career.wins).toBe(1);
      expect(updatedWarrior?.popularity).toBe(5);
    });

    it('should not mutate original state', () => {
      const originalFame = state.roster[0].fame;
      modifyWarrior(state, state.roster[0].id, (w) => {
        w.fame = 100;
      });

      expect(state.roster[0].fame).toBe(originalFame);
    });
  });
});
