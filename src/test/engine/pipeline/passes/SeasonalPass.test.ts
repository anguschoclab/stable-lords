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

  it('should trigger the black_market_raid offseason event, deduct gold, and newsletter', () => {
    const rng = new SeededRNGService(99);
    const originalNext = (rng as any).rng.next.bind((rng as any).rng);
    let callCount = 0;
    const mockNext = () => {
      callCount++;
      if (callCount === 1) return 7.5 / 12; // picks index 7 = black_market_raid
      return originalNext();
    };
    (rng as any).rng.next = mockNext;

    const warriorId = 'w-seasonal-raid' as WarriorId;
    const state: Partial<GameState> = {
      year: 1,
      roster: [{ id: warriorId, name: 'Slippery Pete', status: 'Active' } as any],
      newsletter: [],
      treasury: 1000,
    };

    const impact = runSeasonalPass(state as GameState, 1, rng);

    expect(impact.treasuryDelta).toBeDefined();
    expect(impact.treasuryDelta).toBeLessThanOrEqual(-50);
    expect(impact.treasuryDelta).toBeGreaterThanOrEqual(-150);

    expect(impact.ledgerEntries).toHaveLength(1);
    expect(impact.ledgerEntries?.[0]?.label).toBe('Black Market Fines');

    expect(impact.newsletterItems).toHaveLength(1);
    expect(impact.newsletterItems?.[0]?.title).toBe('Black Market Raid');
  });

  it('should trigger the grand_feast offseason event, deduct gold, award XP to all active', () => {
    const rng = new SeededRNGService(99);
    const originalNext = (rng as any).rng.next.bind((rng as any).rng);
    let callCount = 0;
    const mockNext = () => {
      callCount++;
      if (callCount === 1) return 8.5 / 12; // picks index 8 = grand_feast
      return originalNext();
    };
    (rng as any).rng.next = mockNext;

    const state: Partial<GameState> = {
      year: 1,
      roster: [
        { id: 'w1', name: 'Bob', status: 'Active', xp: 5 } as any,
        { id: 'w2', name: 'Alice', status: 'Active', xp: 10 } as any,
        { id: 'w3', name: 'Retired Dan', status: 'Retired', xp: 20 } as any,
      ],
      newsletter: [],
      treasury: 1000,
    };

    const impact = runSeasonalPass(state as GameState, 1, rng);

    expect(impact.treasuryDelta).toBeDefined();
    expect(impact.treasuryDelta).toBeLessThanOrEqual(-200);
    expect(impact.treasuryDelta).toBeGreaterThanOrEqual(-400);

    expect(impact.ledgerEntries).toHaveLength(1);
    expect(impact.ledgerEntries?.[0]?.label).toBe('Grand Feast Expenses');

    // w1 and w2 should get +10 xp. w3 gets nothing
    const w1Update = impact.rosterUpdates?.get('w1' as WarriorId);
    expect(w1Update?.xp).toBe(15);

    const w2Update = impact.rosterUpdates?.get('w2' as WarriorId);
    expect(w2Update?.xp).toBe(20);

    expect(impact.rosterUpdates?.has('w3' as WarriorId)).toBe(false);

    expect(impact.newsletterItems).toHaveLength(1);
    expect(impact.newsletterItems?.[0]?.title).toBe('A Grand Feast');
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
    const originalNext = (rng as any).rng.next.bind((rng as any).rng);
    let callCount = 0;
    const mockNext = () => {
      callCount++;
      if (callCount === 1) return 4.5 / 12; // picks index 4 = tavern_brawl
      return originalNext();
    };
    (rng as any).rng.next = mockNext;

    const warriorId = 'w-seasonal' as WarriorId;
    const state: Partial<GameState> = {
      year: 1,
      roster: [{ id: warriorId, name: 'Ragnar', status: 'Active', fame: 10, injuries: [] } as any],
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
    const originalNext = (rng as any).rng.next.bind((rng as any).rng);
    let callCount = 0;
    const mockNext = () => {
      callCount++;
      if (callCount === 1) return 4.5 / 12; // picks tavern_brawl
      return originalNext();
    };
    (rng as any).rng.next = mockNext;

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
            {
              id: 'inj-1' as any,
              name: 'Cracked Ribs',
              severity: 'Moderate',
              weeksRemaining: 3,
              penalties: { CN: -2 },
            },
          ],
        } as any,
      ],
      newsletter: [],
    };

    const impact = runSeasonalPass(state as GameState, 1, rng);

    // No roster updates for the injured warrior — they were skipped
    expect(impact.rosterUpdates?.has(warriorId)).toBeFalsy();
  });

  it('should trigger wandering_healer and cure an injury if someone is injured', () => {
    const rng = new SeededRNGService(99);
    const originalNext = (rng as any).rng.next.bind((rng as any).rng);
    let callCount = 0;
    const mockNext = () => {
      callCount++;
      if (callCount === 1) return 9.5 / 12; // picks index 9 = wandering_healer
      return originalNext();
    };
    (rng as any).rng.next = mockNext;

    const warriorId = 'w-injured' as WarriorId;
    const state: Partial<GameState> = {
      year: 1,
      roster: [
        {
          id: warriorId,
          name: 'Sickly Bob',
          status: 'Active',
          injuries: [
            {
              id: 'inj-1' as any,
              name: 'Cracked Ribs',
              severity: 'Moderate',
              weeksRemaining: 3,
              penalties: { CN: -2 },
            },
            {
              id: 'inj-2' as any,
              name: 'Sprained Ankle',
              severity: 'Minor',
              weeksRemaining: 1,
              penalties: { AG: -1 },
            },
          ],
        } as any,
      ],
      newsletter: [],
      treasury: 1000,
    };

    const impact = runSeasonalPass(state as GameState, 1, rng);

    expect(impact.treasuryDelta).toBeDefined();
    expect(impact.treasuryDelta).toBeLessThanOrEqual(-50);
    expect(impact.treasuryDelta).toBeGreaterThanOrEqual(-100);

    expect(impact.ledgerEntries).toHaveLength(1);
    expect(impact.ledgerEntries?.[0]?.label).toBe('Medical Tonics');

    // Should have 1 injury removed
    const wUpdate = impact.rosterUpdates?.get(warriorId);
    expect(wUpdate).toBeDefined();
    expect(wUpdate?.injuries).toHaveLength(1);

    expect(impact.newsletterItems).toHaveLength(1);
    expect(impact.newsletterItems?.[0]?.title).toBe('A Wandering Healer');
    expect(impact.newsletterItems?.[0]?.items[0]).toContain('cured Sickly Bob of an injury');
  });

  it('should trigger wandering_healer and offer snake oil if no one is injured', () => {
    const rng = new SeededRNGService(99);
    const originalNext = (rng as any).rng.next.bind((rng as any).rng);
    let callCount = 0;
    const mockNext = () => {
      callCount++;
      if (callCount === 1) return 9.5 / 12; // picks index 9 = wandering_healer
      return originalNext();
    };
    (rng as any).rng.next = mockNext;

    const state: Partial<GameState> = {
      year: 1,
      roster: [
        {
          id: 'w-healthy' as WarriorId,
          name: 'Healthy Bob',
          status: 'Active',
          injuries: [],
        } as any,
      ],
      newsletter: [],
      treasury: 1000,
    };

    const impact = runSeasonalPass(state as GameState, 1, rng);

    expect(impact.treasuryDelta).toBeDefined();
    expect(impact.treasuryDelta).toBeLessThanOrEqual(-50);
    expect(impact.treasuryDelta).toBeGreaterThanOrEqual(-100);

    expect(impact.ledgerEntries).toHaveLength(1);
    expect(impact.ledgerEntries?.[0]?.label).toBe('Medical Tonics');

    // Should have no roster updates
    expect(impact.rosterUpdates?.has('w-healthy' as WarriorId)).toBeFalsy();

    expect(impact.newsletterItems).toHaveLength(1);
    expect(impact.newsletterItems?.[0]?.title).toBe('A Wandering Healer');
    expect(impact.newsletterItems?.[0]?.items[0]).toContain('snake oil tonics');
  });

  it('should trigger the mystic_vision offseason event, award xp and fame, and add a newsletter item', () => {
    const rng = new SeededRNGService(99);
    const originalNext = (rng as any).rng.next.bind((rng as any).rng);
    let callCount = 0;
    const mockNext = () => {
      callCount++;
      if (callCount === 1) return 10.5 / 12; // picks index 10 = mystic_vision
      return originalNext();
    };
    (rng as any).rng.next = mockNext;

    const warriorId = 'w-mystic' as WarriorId;
    const state: Partial<GameState> = {
      year: 1,
      roster: [{ id: warriorId, name: 'Grok', status: 'Active', xp: 5, fame: 5 } as any],
      newsletter: [],
    };

    const impact = runSeasonalPass(state as GameState, 1, rng);

    // The warrior should have received XP (+15) and Fame (+10)
    const update = impact.rosterUpdates?.get(warriorId);
    expect(update).toBeDefined();
    expect(update?.xp).toBe(20);
    expect(update?.fame).toBe(15);

    // Newsletter should reference the mystic vision
    expect(impact.newsletterItems).toHaveLength(1);
    expect(impact.newsletterItems?.[0]?.title).toBe('A Mystic Vision');
  });

  it('should trigger the wild_animal_attack offseason event, award fame, and add a Bite Wound injury', () => {
    const rng = new SeededRNGService(99);
    const originalNext = (rng as any).rng.next.bind((rng as any).rng);
    let callCount = 0;
    const mockNext = () => {
      callCount++;
      if (callCount === 1) return 11.5 / 12; // picks index 11 = wild_animal_attack
      return originalNext();
    };
    (rng as any).rng.next = mockNext;

    const warriorId = 'w-animal' as WarriorId;
    const state: Partial<GameState> = {
      year: 1,
      roster: [{ id: warriorId, name: 'Grok', status: 'Active', fame: 5, injuries: [] } as any],
    };

    const impact = runSeasonalPass(state as GameState, 1, rng);

    expect(impact.rosterUpdates?.get(warriorId)?.fame).toBeGreaterThan(5);
    expect(impact.rosterUpdates?.get(warriorId)?.injuries?.[0]?.name).toBe('Bite Wound');
    expect(impact.newsletterItems?.[0]?.title).toBe('Wild Beast Encounter');
  });
});
