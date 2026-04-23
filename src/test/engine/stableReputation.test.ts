import { describe, it, expect } from 'vitest';
import { computeStableReputation, computeRivalReputation } from '@/engine/stableReputation';
import type { GameState, Warrior, FightSummary } from '@/types/game';

function createMockWarrior(overrides: Partial<Warrior> = {}): Warrior {
  return {
    id: 'w1',
    name: 'Test Warrior',
    status: 'Active',
    style: 'Gladiator',
    fame: 0,
    career: { wins: 0, losses: 0, kills: 0 },
    ...overrides,
  } as unknown as Warrior;
}

function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    player: { stableName: 'Player Stable' },
    roster: [],
    graveyard: [],
    newsletter: [],
    arenaHistory: [],
    fame: 0,
    trainingAssignments: [],
    trainers: [],
    ...overrides,
  } as unknown as GameState;
}

function createMockFightSummary(overrides: Partial<FightSummary> = {}): FightSummary {
  return {
    id: 'f1',
    by: 'KO',
    winner: 'A',
    ...overrides,
  } as unknown as FightSummary;
}

describe('computeStableReputation', () => {
  it('returns base reputation for an empty state', () => {
    const state = createMockGameState();
    const rep = computeStableReputation(state);

    expect(rep.fame).toBe(0);
    expect(rep.notoriety).toBe(0);
    expect(rep.honor).toBe(50); // Base honor is 50
    expect(rep.adaptability).toBe(0);
  });

  it('calculates fame correctly', () => {
    const state = createMockGameState({
      roster: [
        createMockWarrior({ fame: 10 }),
        createMockWarrior({ fame: 20 }),
        createMockWarrior({ fame: 30 }),
      ],
      newsletter: [
        { items: ['Player Stable won the match!'] } as unknown,
        { items: ['Another stable won.'] } as unknown,
        { items: ['Player Stable is looking strong.'] } as unknown,
      ],
      fame: 5,
    });

    const rep = computeStableReputation(state);

    // avgFame of top 5 = (10 + 20 + 30) / 3 = 20
    // gazetteMentions = 2
    // baseFame = 5
    // fameRaw = 20 * 2.0 + 2 * 1.0 + 5 * 0.85 = 40 + 2 + 4.25 = 46.25 -> 46
    expect(rep.fame).toBe(46);
  });

  it('caps fame at 100', () => {
    const state = createMockGameState({
      roster: [createMockWarrior({ fame: 100 })],
    });

    const rep = computeStableReputation(state);
    expect(rep.fame).toBe(100);
  });

  it('calculates notoriety correctly', () => {
    const state = createMockGameState({
      roster: [createMockWarrior({ career: { wins: 0, losses: 0, kills: 2 } as unknown })],
      graveyard: [createMockWarrior({ career: { wins: 0, losses: 0, kills: 3 } as unknown })],
      arenaHistory: [
        createMockFightSummary({ by: 'Kill' }),
        createMockFightSummary({ by: 'Kill' }),
        createMockFightSummary({ by: 'KO' }),
      ],
    });

    const rep = computeStableReputation(state);

    // totalKills = 2
    // graveyardKills = 3
    // killBouts = 2
    // notorietyRaw = (2 * 3) + (3 * 4) + (2 * 3) = 6 + 12 + 6 = 24
    // notoriety = 24 * 2 = 48
    expect(rep.notoriety).toBe(48);
  });

  it('calculates honor correctly', () => {
    const state = createMockGameState({
      roster: [createMockWarrior({ career: { wins: 0, losses: 0, kills: 1 } as unknown })],
      arenaHistory: [
        createMockFightSummary({ by: 'KO', winner: 'A' }),
        createMockFightSummary({ by: 'KO', winner: 'D' }),
        createMockFightSummary({ by: 'Kill', winner: 'A' }),
        createMockFightSummary({ by: 'KO', winner: null }), // Draw/No winner
      ],
    });

    const rep = computeStableReputation(state);

    // cleanBouts (not Kill, winner != null) = 2
    // totalKills = 1
    // honorRaw = 50 + 2 * 0.5 - 1 * 5 = 50 + 1 - 5 = 46
    expect(rep.honor).toBe(46);
  });

  it('calculates adaptability correctly', () => {
    const state = createMockGameState({
      roster: [
        createMockWarrior({ style: 'Gladiator' as unknown }),
        createMockWarrior({ style: 'Gladiator' as unknown }),
        createMockWarrior({ style: 'Brawler' as unknown }),
      ],
      trainingAssignments: [{}, {}, {}] as unknown, // 3 assignments
      trainers: [{}, {}] as unknown, // 2 trainers
    });

    const rep = computeStableReputation(state);

    // uniqueStyles = 2
    // trainingCount = 3
    // trainerCount = 2
    // adaptRaw = 2 * 8 + 3 * 3 + 2 * 2 = 16 + 9 + 4 = 29
    expect(rep.adaptability).toBe(29);
  });

  it('ignores non-active roster members', () => {
    const state = createMockGameState({
      roster: [
        createMockWarrior({ status: 'Active', fame: 10 }),
        createMockWarrior({ status: 'Dead', fame: 100 }),
      ],
    });

    const rep = computeStableReputation(state);

    // avgFame should be 10, not 55
    // fameRaw = 10 * 2.0 = 20
    expect(rep.fame).toBe(20);
  });
});

describe('computeRivalReputation', () => {
  it('returns base reputation for empty roster', () => {
    const rep = computeRivalReputation([], [], 'Rival Stable');
    expect(rep.fame).toBe(0);
    expect(rep.notoriety).toBe(0);
    expect(rep.honor).toBe(50);
    expect(rep.adaptability).toBe(0);
  });

  it('calculates rival fame correctly', () => {
    const roster = [
      createMockWarrior({ fame: 10 }),
      createMockWarrior({ fame: 20 }),
      createMockWarrior({ fame: 30 }),
    ];

    const rep = computeRivalReputation(roster, [], 'Rival Stable');

    // avgFame = 20
    // fame = 20 * 2.0 = 40
    expect(rep.fame).toBe(40);
  });

  it('calculates rival notoriety and honor correctly', () => {
    const roster = [
      createMockWarrior({ career: { wins: 5, losses: 2, kills: 2 } as unknown }),
      createMockWarrior({ career: { wins: 3, losses: 1, kills: 0 } as unknown }),
    ];

    const rep = computeRivalReputation(roster, [], 'Rival Stable');

    // totalKills = 2
    // cleanBouts for w1 = 5 + 2 - 2 = 5
    // cleanBouts for w2 = 3 + 1 - 0 = 4
    // totalCleanBouts = 9

    // notoriety = 2 * 8 = 16
    expect(rep.notoriety).toBe(16);

    // honor = 50 + 9 * 0.3 - 2 * 5 = 50 + 2.7 - 10 = 42.7 -> 43
    expect(rep.honor).toBe(43);
  });

  it('calculates rival adaptability correctly', () => {
    const roster = [
      createMockWarrior({ style: 'Gladiator' as unknown }),
      createMockWarrior({ style: 'Brawler' as unknown }),
      createMockWarrior({ style: 'Rogue' as unknown }),
      createMockWarrior({ style: 'Gladiator' as unknown }), // Duplicate
    ];

    const rep = computeRivalReputation(roster, [], 'Rival Stable');

    // uniqueStyles = 3
    // adaptability = 3 * 10 = 30
    expect(rep.adaptability).toBe(30);
  });

  it('caps values correctly', () => {
    const roster = [
      createMockWarrior({
        fame: 100,
        career: { wins: 0, losses: 0, kills: 100 } as unknown, // Causes huge notoriety, zero honor
        style: 'Gladiator' as unknown,
      }),
      createMockWarrior({
        fame: 100,
        career: { wins: 1000, losses: 0, kills: 0 } as unknown, // Causes huge honor
        style: 'Brawler' as unknown,
      }),
    ];

    const rep1 = computeRivalReputation([roster[0]], [], 'Rival Stable');
    expect(rep1.fame).toBe(100);
    expect(rep1.notoriety).toBe(100);
    expect(rep1.honor).toBe(0); // Min 0

    const rep2 = computeRivalReputation([roster[1]], [], 'Rival Stable');
    expect(rep2.honor).toBe(100); // Max 100
  });

  it('ignores non-active roster members', () => {
    const roster = [
      createMockWarrior({ status: 'Active', fame: 10 }),
      createMockWarrior({ status: 'Dead', fame: 100 }),
    ];

    const rep = computeRivalReputation(roster, [], 'Rival Stable');

    // avgFame should be 10
    // fame = 10 * 2.0 = 20
    expect(rep.fame).toBe(20);
  });
});
