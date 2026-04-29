import { describe, it, expect, afterEach, vi } from 'vitest';
import { runEventPass } from '@/engine/pipeline/passes/EventPass';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { resolveImpacts } from '@/engine/impacts';
import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { WarriorId } from '@/types/shared.types';

describe('EventPass', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should rarely trigger the Lost Relic Discovery event and correctly modify stats', () => {
    // To hit `brawlRng.next() < 0.04`, we need RNG next to return something small.
    // However, brawlRng = rootRng?.clone() ?? new SeededRNG(nextWeek * 999 + 1);
    const rng = new SeededRNGService(42);
    // Mock the rng so the first call to .next() (brawl event) is > 0.05,
    // the second call (blessing event) is > 0.03,
    // and the third call (lost relic event) is < 0.04.
    const originalNext = rng.next.bind(rng);
    let callCount = 0;
    const mockNext = () => {
      callCount++;
      if (callCount === 1) return 0.5; // fail Tavern Brawl
      if (callCount === 2) return 0.5; // fail Star-crossed Blessing
      if (callCount === 3) return 0.01; // succeed Lost Relic
      return originalNext();
    };
    (rng as any).next = mockNext;

    const w: Partial<Warrior> = {
      id: 'w-1' as WarriorId,
      name: 'Gladiator',
      status: 'Active',
      fame: 0,
      xp: 0,
    };
    const state: Partial<GameState> = {
      roster: [w as Warrior],
      newsletter: [],
    };

    const impact = runEventPass(state as GameState, 2, rng);
    const nextState = resolveImpacts(state as GameState, [impact]);
    const warrior = nextState.roster.find((r: Warrior) => r.id === 'w-1');
    expect(warrior?.fame).toBe(10);
    expect(warrior?.xp).toBe(5);

    const newsletter = nextState.newsletter?.[0];
    expect(newsletter?.title).toBe('Lost Relic Discovery');
    expect(newsletter?.items[0]).toContain('discovered an ancient artifact');
  });

  it('should trigger the Tavern Brawl event, award +5 fame and add a Black Eye injury', () => {
    const rng = new SeededRNGService(42);
    const originalNext = rng.next.bind(rng);
    let callCount = 0;
    const mockNext = () => {
      callCount++;
      if (callCount === 1) return 0.01; // succeed Tavern Brawl (< 0.05)
      return originalNext();
    };
    (rng as any).next = mockNext;

    const w: Partial<Warrior> = {
      id: 'w-brawl' as WarriorId,
      name: 'Bruto',
      status: 'Active',
      fame: 10,
      injuries: [],
    };
    const state: Partial<GameState> = {
      roster: [w as Warrior],
      newsletter: [],
    };

    const impact = runEventPass(state as GameState, 3, rng);
    const nextState = resolveImpacts(state as GameState, [impact]);
    const warrior = nextState.roster.find((r: Warrior) => r.id === 'w-brawl');

    expect(warrior?.fame).toBe(15);
    expect(warrior?.injuries).toHaveLength(1);
    expect(warrior?.injuries?.[0]?.name).toBe('Black Eye');
    expect(warrior?.injuries?.[0]?.severity).toBe('Minor');
    expect(warrior?.injuries?.[0]?.weeksRemaining).toBe(1);

    const newsletter = nextState.newsletter?.[0];
    expect(newsletter?.title).toBe('Tavern Brawl!');
  });

  it('should trigger the Mysterious Patron event and correctly update treasuryDelta', () => {
    const rng = new SeededRNGService(42);
    const originalNext = rng.next.bind(rng);
    let callCount = 0;
    const mockNext = () => {
      callCount++;
      if (callCount === 1) return 0.5; // fail Tavern Brawl
      if (callCount === 2) return 0.5; // fail Star-crossed Blessing
      if (callCount === 3) return 0.5; // fail Lost Relic
      if (callCount === 4) return 0.01; // succeed Mysterious Patron
      return originalNext();
    };
    (rng as any).next = mockNext;

    const state: Partial<GameState> = {
      roster: [],
      newsletter: [],
      treasury: 1000,
    };

    const impact = runEventPass(state as GameState, 2, rng);

    expect(impact.treasuryDelta).toBeGreaterThanOrEqual(100);
    expect(impact.newsletterItems?.[0]?.title).toBe('A Mysterious Patron!');
  });
});
