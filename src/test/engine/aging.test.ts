import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { computeAgingImpact } from '@/engine/aging';
import { resolveImpacts } from '@/engine/impacts';
import type { GameState, Warrior, Attributes } from '@/types/game';
import { FightingStyle } from '@/types/game';
import { computeWarriorStats } from '@/engine/skillCalc';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';

// ─── Test Helpers ─────────────────────────────────────────────────────────

function makeWarrior(id: string, age: number, attrs: Partial<Attributes> = {}): Warrior {
  const fullAttrs: Attributes = {
    ST: 10,
    CN: 10,
    SZ: 10,
    WT: 10,
    WL: 10,
    SP: 10,
    DF: 10,
    ...attrs,
  };
  const { baseSkills, derivedStats } = computeWarriorStats(fullAttrs, FightingStyle.StrikingAttack);

  return {
    id,
    name: `Warrior ${id}`,
    style: FightingStyle.StrikingAttack,
    attributes: fullAttrs,
    baseSkills,
    derivedStats,
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: 'Active',
    age,
  };
}

function makeGameState(week: number, roster: Warrior[]): GameState {
  return {
    meta: { gameName: 'Test', version: '1.0', createdAt: '' },
    ftueComplete: true,
    coachDismissed: [],
    player: { id: 'p1', name: 'Player', stableName: 'Stable', fame: 0, renown: 0, titles: 0 },
    fame: 0,
    popularity: 0,
    treasury: 0,
    ledger: [],
    week,
    season: 'Spring',
    roster,
    graveyard: [],
    retired: [],
    arenaHistory: [],
    newsletter: [],
    hallOfFame: [],
    crowdMood: 'Calm',
    tournaments: [],
    trainers: [],
    hiringPool: [],
    trainingAssignments: [],
    seasonalGrowth: [],
    rivals: [],
    scoutReports: [],
    restStates: [],
    rivalries: [],
    matchHistory: [],
    recruitPool: [],
    rosterBonus: 0,
    ownerGrudges: [],
    insightTokens: [],
    moodHistory: [],
    settings: { featureFlags: { tournaments: false, scouting: false } },
    phase: 'Planning',
    gazettes: [],
    playerChallenges: [],
    playerAvoids: [],
    activeTournamentId: undefined,
    isFTUE: false,
    unacknowledgedDeaths: [],
  } as unknown as GameState;
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('computeAgingImpact — basic aging', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('increments age by 1 on multiples of 52 weeks', () => {
    const w = makeWarrior('w1', 20);
    const state = makeGameState(52, [w]);
    const rng = new SeededRNGService(state.week * 997 + 3);
    const impact = computeAgingImpact(state, rng);
    const newState = resolveImpacts(state, [impact]);

    expect(newState.roster[0]!.age).toBe(21);
  });

  it('does not increment age on non-multiples of 52 weeks', () => {
    const w = makeWarrior('w1', 20);
    const state = makeGameState(51, [w]);
    const rng = new SeededRNGService(state.week * 997 + 3);
    const impact = computeAgingImpact(state, rng);
    const newState = resolveImpacts(state, [impact]);

    expect(newState.roster[0]!.age).toBe(20);
  });
});

describe('computeAgingImpact — aging penalties', () => {
  beforeEach(() => {
    // Default mock to avoid retirement unless requested
    vi.spyOn(SeededRNGService.prototype, 'next').mockReturnValue(0.99);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Age constants tuned 2026-04: AGING_PENALTY_START=25, FORCED_RETIRE_MIN=26,
  // FORCED_RETIRE_MAX=32. Test ages updated to match the new windows.
  it('does not apply penalties to a warrior under the age penalty start limit', () => {
    const w = makeWarrior('w1', 23, { SP: 15, DF: 15 });
    const state = makeGameState(52, [w]);
    const rng = new SeededRNGService(state.week * 997 + 3);
    const impact = computeAgingImpact(state, rng);
    const newState = resolveImpacts(state, [impact]);

    expect(newState.roster[0]!.age).toBe(24);
    expect(newState.roster[0]!.attributes.SP).toBe(15);
    expect(newState.roster[0]!.attributes.DF).toBe(15);
  });

  it('applies penalty to SP and DF when age exceeds AGING_PENALTY_START', () => {
    // Age 27 → 28 ticks: > AGING_PENALTY_START (25), penalty=floor((28-25)/3)=1.
    // Stays under FORCED_RETIRE_MAX (32) so no retirement; retire chance gated
    // out by mock returning 0.99 in the parent describe's beforeEach.
    const w = makeWarrior('w1', 27, { SP: 15, DF: 15 });
    const state = makeGameState(52, [w]);
    const rng = new SeededRNGService(state.week * 997 + 3);
    const impact = computeAgingImpact(state, rng);
    const newState = resolveImpacts(state, [impact]);

    expect(newState.roster[0]!.age).toBe(28);
    expect(newState.roster[0]!.attributes.SP).toBe(14);
    expect(newState.roster[0]!.attributes.DF).toBe(14);
  });

  it('adds a newsletter event when aging penalties are applied', () => {
    const w = makeWarrior('w1', 27, { SP: 15, DF: 15 });
    const state = makeGameState(52, [w]);
    const rng = new SeededRNGService(state.week * 997 + 3);
    const impact = computeAgingImpact(state, rng);
    const newState = resolveImpacts(state, [impact]);

    expect(newState.newsletter.length).toBe(1);
    expect(newState.newsletter[0]!.title).toBe('Aging Report');
  });
});

describe('computeAgingImpact — forced retirement', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Retirement window 2026-04: FORCED_RETIRE_MIN=26, FORCED_RETIRE_MAX=32.
  it('guarantees retirement for a warrior at FORCED_RETIRE_MAX (32+)', () => {
    const w = makeWarrior('w1', 32);
    const state = makeGameState(10, [w]);
    const rng = new SeededRNGService(state.week * 997 + 3);
    const impact = computeAgingImpact(state, rng);
    const newState = resolveImpacts(state, [impact]);

    expect(newState.roster.length).toBe(0);
    expect(newState.retired.length).toBe(1);
  });

  it('can force retirement with a low random roll', () => {
    const w = makeWarrior('w1', 29);
    const state = makeGameState(12, [w]);

    // Retire chance at age 29 = ((29-26)/(32-26)) * 0.15 = 0.075. Mock 0.01 triggers.
    vi.spyOn(SeededRNGService.prototype, 'next').mockReturnValue(0.01);
    const rng = new SeededRNGService(state.week * 997 + 3);
    const impact = computeAgingImpact(state, rng);
    const newState = resolveImpacts(state, [impact]);

    expect(newState.roster.length).toBe(0);
    expect(newState.retired.length).toBe(1);
  });

  it('does not force retirement with a high random roll', () => {
    const w = makeWarrior('w1', 29);
    const state = makeGameState(12, [w]);

    vi.spyOn(SeededRNGService.prototype, 'next').mockReturnValue(0.99);
    const rng = new SeededRNGService(state.week * 997 + 3);
    const impact = computeAgingImpact(state, rng);
    const newState = resolveImpacts(state, [impact]);

    expect(newState.roster.length).toBe(1);
  });
});
