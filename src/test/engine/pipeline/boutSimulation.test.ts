import { describe, it, expect } from 'vitest';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { GameState, BoutOffer, Promoter } from '@/types/state.types';
import { FightingStyle } from '@/types/shared.types';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { makeWarrior } from '@/engine/factories/warriorFactory';

describe('Bout Simulation Integration - getFromArchive function issue', () => {
  it('should simulate a signed bout and update state accordingly', async () => {
    const rng = new SeededRNGService(1);

    // 1. Setup a minimal state with a signed bout
    const warriorA = makeWarrior(
      'warrior-a',
      'Fighter A',
      FightingStyle.StrikingAttack,
      { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
      { fame: 10 },
      rng
    );

    const warriorD = makeWarrior(
      'warrior-d',
      'Fighter D',
      FightingStyle.BashingAttack,
      { ST: 12, CN: 12, SZ: 10, WT: 10, WL: 10, SP: 8, DF: 10 },
      { fame: 5 },
      rng
    );

    const promoter: Promoter = {
      id: 'promoter-1',
      name: 'Test Promoter',
      age: 40,
      personality: 'Honorable',
      tier: 'Local',
      capacity: 5,
      biases: [],
      history: { totalPursePaid: 0, notableBouts: [], legacyFame: 0 },
    };

    const offer: BoutOffer = {
      id: 'offer-1',
      promoterId: 'promoter-1',
      warriorIds: ['warrior-a', 'warrior-d'],
      boutWeek: 1,
      expirationWeek: 2,
      purse: 500,
      hype: 100,
      status: 'Signed',
      responses: { 'warrior-a': 'Accepted', 'warrior-d': 'Accepted' },
    };

    const initialState: Partial<GameState> = {
      meta: { gameName: 'Stable Lords', version: '1.0', createdAt: '' },
      week: 1,
      year: 1,
      treasury: 1000,
      fame: 10,
      roster: [warriorA],
      rivals: [
        {
          id: 'rival-1',
          owner: {
            id: 'owner-d',
            name: 'Rival D',
            stableName: 'Rival Stable',
            fame: 0,
            renown: 0,
            titles: 0,
          },
          roster: [warriorD],
          treasury: 100,
          fame: 0,
        } as any,
      ],
      boutOffers: { 'offer-1': offer },
      promoters: { 'promoter-1': promoter },
      arenaHistory: [],
      newsletter: [],
      gazettes: [],
      graveyard: [],
      trainers: [],
      hiringPool: [],
      recruitPool: [],
      scoutReports: [],
      hallOfFame: [],
      player: {
        id: 'player-1',
        name: 'Player',
        stableName: 'Player Stable',
        fame: 10,
        renown: 0,
        titles: 0,
      } as any,
    };

    // 2. Advance the week (which should trigger the simulation)
    const nextState = advanceWeek(initialState as GameState);

    // 3. Verifications
    // - Should have 1 fight in history (if bout was processed)
    expect(nextState.arenaHistory.length).toBe(1);

    // - The offer should be removed from boutOffers (assuming processWeekBouts prunes it)
    expect(nextState.boutOffers['offer-1']).toBeUndefined();

    // - Treasury should have changed (purse or show fee)
    expect(nextState.treasury).not.toBe(1000);
  });
});
