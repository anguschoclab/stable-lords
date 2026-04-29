import { describe, it, expect } from 'vitest';
import { runSeasonalPass } from '@/engine/pipeline/seasonal';
import type { GameState } from '@/types/state.types';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import type { WarriorId } from '@/types/shared.types';

describe('runSeasonalPass', () => {
  it('should not do anything if nextWeek is not 1', () => {
    const impact = runSeasonalPass({ year: 1 } as GameState, 2);
    expect(impact).toEqual({});
  });

  // Adding basic coverage to make sure the seasonal pass doesn't crash
  it('should run offseason event when nextWeek is 1', () => {
    const state: Partial<GameState> = {
      year: 1,
      roster: [{ id: 'w1', name: 'Bob', status: 'Active', injuries: [] } as any],
    };

    const rng = new SeededRNGService(42);
    const impact = runSeasonalPass(state as GameState, 1, rng);

    // Impact should have some changes, let's just make sure it doesn't crash
    // and returns a state impact object.
    expect(impact).toBeDefined();
    // In our SeededRNGService, 42 will pick a specific event, we just want to know it didn't throw.
  });

  it('should trigger the tavern_brawl offseason event, award fame, and add a Bruised Ribs injury', () => {
    // Offseason event keys in order: festival_of_blades(0), harsh_winter(1),
    // merchant_blessing(2), offseason_epiphany(3), tavern_brawl(4)
    // To pick index 4 out of 5: Math.floor(x * 5) === 4 → x in [0.8, 1.0)
    const rng = new SeededRNGService(99);
    const originalNext = rng.next.bind(rng);
    let callCount = 0;
    const mockNext = () => {
      callCount++;
      if (callCount === 1) return 4 / 7; // picks index 4 = tavern_brawl
      return originalNext();
    };
    (rng as any).next = mockNext;

    const warriorId = 'w-seasonal' as WarriorId;
    const state: Partial<GameState> = {
      year: 1,
      roster: [
        { id: warriorId, name: 'Ragnar', status: 'Active', fame: 10, injuries: [] } as any,
      ],
      newsletter: [],
    };

    const impact = runSeasonalPass(state as GameState, 1, rng);

    // The warrior should have received fame (+10 to +20)
    const update = impact.rosterUpdates?.get(warriorId);
    expect(update).toBeDefined();
    expect(update?.fame).toBeGreaterThanOrEqual(20);
    expect(update?.fame).toBeLessThanOrEqual(30);

    // The warrior should have a Bruised Ribs injury
    expect(update?.injuries).toHaveLength(1);
    expect(update?.injuries?.[0]?.name).toBe('Bruised Ribs');
    expect(update?.injuries?.[0]?.severity).toBe('Minor');
    expect(update?.injuries?.[0]?.penalties).toEqual({ CN: -1 });

    // Newsletter should reference the brawl
    expect(impact.newsletterItems).toHaveLength(1);
    expect(impact.newsletterItems?.[0]?.title).toBe('Tavern Brawl');
  });

  it('should not add a Bruised Ribs injury to an already-injured warrior in tavern_brawl', () => {
    const rng = new SeededRNGService(99);
    const originalNext = rng.next.bind(rng);
    let callCount = 0;
    const mockNext = () => {
      callCount++;
      if (callCount === 1) return 4 / 7; // picks tavern_brawl
      return originalNext();
    };
    (rng as any).next = mockNext;

    const warriorId = 'w-injured' as WarriorId;
    const state: Partial<GameState> = {
      year: 1,
      roster: [
        {
          id: warriorId,
          name: 'Scarred Ulf',
          status: 'Active',
          fame: 5,
          injuries: [
            { id: 'inj-1' as any, name: 'Cracked Ribs', severity: 'Moderate', weeksRemaining: 3, penalties: { CN: -2 } },
          ],
        } as any,
      ],
      newsletter: [],
    };

    const impact = runSeasonalPass(state as GameState, 1, rng);

    // No roster updates for the injured warrior — they were skipped
    expect(impact.rosterUpdates?.has(warriorId)).toBeFalsy();
  });
});
