import { describe, it, expect, beforeEach } from 'vitest';
import { createFreshState } from '@/engine/factories';
import { populateTestState } from '@/test/testHelpers';
import { runRankingsPass } from '@/engine/pipeline/passes/RankingsPass';
import { TournamentSelectionService } from '@/engine/matchmaking/tournamentSelection';
import { GameState } from '@/types/state.types';

describe('NCAA-style Tournament Selection Committee', () => {
  let state: GameState;

  beforeEach(() => {
    state = createFreshState('test-seed');
    state = populateTestState(state);
    // Committee depends on rankings cache
    state = runRankingsPass(state);
    // Ensure roster and rivals exist
    if (!state.roster) state.roster = [];
    if (!state.rivals) state.rivals = [];
    // Ensure season is set
    if (!state.season) state.season = 'Spring';
  });

  it('should select 64 warriors for the Gold Tier', () => {
    const { warriors } = TournamentSelectionService.committeeSelection(state, 'Gold', 1, new Set());
    expect(warriors.length).toBe(64);
  });

  it('should prevent double-booking across tiers', () => {
    const { warriors: goldWarriors, updatedLockedIds: goldLocks } =
      TournamentSelectionService.committeeSelection(state, 'Gold', 1, new Set());
    const goldIds = goldWarriors.map((w) => w.id);

    // Select silver tier, excluding goldIds
    const { warriors: silverWarriors } = TournamentSelectionService.committeeSelection(
      state,
      'Silver',
      2,
      goldLocks
    );
    const overlapping = silverWarriors.filter((w) => goldIds.includes(w.id));

    expect(overlapping.length).toBe(0);
  });

  it('should generate all 4 seasonal tournaments', () => {
    const tournaments = TournamentSelectionService.generateSeasonalTiers(
      state,
      state.week,
      state.season,
      1
    );
    expect(tournaments.length).toBe(4); // Gold, Silver, Bronze, Iron
    expect(tournaments[0].name).toBe('Imperial Gold Cup');
    expect(tournaments[0].participants.length).toBe(64);
  });
});
