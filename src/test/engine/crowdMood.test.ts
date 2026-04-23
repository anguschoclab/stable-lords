import { describe, it, expect } from 'vitest';
import { getMoodModifiers, computeCrowdMood } from '@/engine/crowdMood';
import type { FightSummary } from '@/types/game';

// Helper to easily create a mocked FightSummary
function createMockFight(overrides: Partial<FightSummary> = {}): FightSummary {
  return {
    id: 'test-fight',
    week: 1,
    title: 'Test Bout',
    a: 'Warrior A',
    d: 'Warrior B',
    warriorIdA: 'wa-a',
    warriorIdD: 'wa-d',
    winner: 'A',
    by: 'KO',
    styleA: 'Brawler' as any,
    styleD: 'Fencer' as any,
    createdAt: new Date().toISOString(),
    transcript: [],
    ...overrides,
  };
}

describe('crowdMood system', () => {
  describe('getMoodModifiers', () => {
    it('returns correct modifiers for Bloodthirsty', () => {
      expect(getMoodModifiers('Bloodthirsty')).toMatchObject({
        fameMultiplier: 1.0,
        popMultiplier: 0.8,
        killChanceBonus: 0.1,
      });
    });

    it('returns correct modifiers for Theatrical', () => {
      expect(getMoodModifiers('Theatrical')).toMatchObject({
        fameMultiplier: 1.0,
        popMultiplier: 1.5,
        killChanceBonus: 0,
      });
    });

    it('returns correct modifiers for Solemn', () => {
      expect(getMoodModifiers('Solemn')).toMatchObject({
        fameMultiplier: 0.7,
        popMultiplier: 0.7,
        killChanceBonus: -0.05,
      });
    });

    it('returns correct modifiers for Festive', () => {
      expect(getMoodModifiers('Festive')).toMatchObject({
        fameMultiplier: 1.3,
        popMultiplier: 1.3,
        killChanceBonus: 0,
      });
    });

    it('returns correct modifiers for Calm (and as default)', () => {
      expect(getMoodModifiers('Calm')).toMatchObject({
        fameMultiplier: 1.0,
        popMultiplier: 1.0,
        killChanceBonus: 0,
      });

      // Assert default fallback is same as Calm
      expect(getMoodModifiers('Unknown' as unknown)).toMatchObject({
        fameMultiplier: 1.0,
        popMultiplier: 1.0,
        killChanceBonus: 0,
      });
    });
  });

  describe('computeCrowdMood', () => {
    it('returns Calm if there are no recent fights', () => {
      expect(computeCrowdMood([])).toBe('Calm');
    });

    it('returns Bloodthirsty if there are >= 2 kills in the last 5 fights', () => {
      const fights = [
        createMockFight({ by: 'Kill' }),
        createMockFight({ by: 'KO' }),
        createMockFight({ by: 'Kill' }),
        createMockFight({ by: 'Draw', winner: null }), // extra noise
      ];
      expect(computeCrowdMood(fights)).toBe('Bloodthirsty');
    });

    it('returns Solemn if there is >= 1 kill and >= 2 draws in the last 5 fights', () => {
      // It processes top-down, so it shouldn't hit Bloodthirsty if kills < 2
      const fights = [
        createMockFight({ by: 'Kill' }),
        createMockFight({ winner: null, by: 'Draw' }),
        createMockFight({ winner: null, by: 'Draw' }),
        createMockFight({ by: 'KO' }),
      ];
      expect(computeCrowdMood(fights)).toBe('Solemn');
    });

    it('returns Theatrical if there are >= 3 flashy fights in the last 5', () => {
      const fights = [
        createMockFight({ flashyTags: ['Flashy'] }),
        createMockFight({ flashyTags: ['Flashy', 'Bloody'] }),
        createMockFight({ flashyTags: ['Flashy'] }),
        createMockFight({ by: 'KO' }),
      ];
      expect(computeCrowdMood(fights)).toBe('Theatrical');
    });

    it('returns Festive if there are >= 4 fights with 0 kills in the last 5', () => {
      const fights = [
        createMockFight({ by: 'KO' }),
        createMockFight({ by: 'KO' }),
        createMockFight({ by: 'Exhaustion' }),
        createMockFight({ by: 'Draw', winner: null }),
      ];
      expect(computeCrowdMood(fights)).toBe('Festive');
    });

    it('only considers the last 5 fights', () => {
      // 6 fights total
      // The first two are kills, but one drops off when slicing the last 5.
      const fights = [
        createMockFight({ by: 'Kill' }),
        createMockFight({ by: 'Kill' }),
        createMockFight({ by: 'KO' }),
        createMockFight({ by: 'KO' }),
        createMockFight({ by: 'KO' }),
        createMockFight({ by: 'KO' }),
      ];
      // Only 1 kill in the last 5, and total length is > 4 so it becomes Festive if kills == 0
      // Actually there's 1 kill in the last 5, so it's not Festive, and not Bloodthirsty
      // Let's check what it evaluates to
      // kills = 1, flashy = 0, draws = 0.
      // Falls through to Calm!
      expect(computeCrowdMood(fights)).toBe('Calm');
    });

    it('prioritizes conditions correctly (Bloodthirsty > Solemn > Theatrical > Festive > Calm)', () => {
      // If there are 2 kills, 2 draws, 3 flashy, and 4 total fights (which contradicts 0 kills for Festive),
      // it should return Bloodthirsty.
      const fights = [
        createMockFight({ by: 'Kill', winner: null, flashyTags: ['Flashy'] }),
        createMockFight({ by: 'Kill', winner: null, flashyTags: ['Flashy'] }),
        createMockFight({ by: 'KO', flashyTags: ['Flashy'] }),
      ];
      expect(computeCrowdMood(fights)).toBe('Bloodthirsty');
    });

    it('returns Calm if no other conditions are met', () => {
      const fights = [
        createMockFight({ by: 'KO' }),
        createMockFight({ by: 'KO' }),
        createMockFight({ by: 'KO' }),
      ];
      // < 4 fights, no kills, no draws, no flashy -> Calm
      expect(computeCrowdMood(fights)).toBe('Calm');
    });
  });

  describe('crowd mood state transitions over time', () => {
    it('transitions from Calm to Theatrical to Festive to Bloodthirsty as fights progress', () => {
      const history: FightSummary[] = [];

      // Start empty
      expect(computeCrowdMood(history)).toBe('Calm');

      // 1. Add 3 flashy fights -> Theatrical (needs >=3 flashy)
      history.push(createMockFight({ flashyTags: ['Flashy'], by: 'KO' }));
      history.push(createMockFight({ flashyTags: ['Flashy'], by: 'KO' }));
      history.push(createMockFight({ flashyTags: ['Flashy'], by: 'KO' }));
      expect(computeCrowdMood(history)).toBe('Theatrical');

      // 2. Add 2 more non-flashy, non-kill fights -> Festive (length >= 4, kills == 0)
      // Now length is 5.
      history.push(createMockFight({ by: 'KO' }));
      history.push(createMockFight({ by: 'KO' }));
      // The last 5 has 3 flashy, 0 kills. Wait, flashy >= 3 triggers Theatrical!
      // Bloodthirsty > Solemn > Theatrical > Festive > Calm.
      // So with 3 flashy, it's still Theatrical.
      expect(computeCrowdMood(history)).toBe('Theatrical');

      // Let's push out the flashy fights to make it Festive
      // We need 4 total fights with 0 kills, and flashy < 3
      history.push(createMockFight({ by: 'KO' })); // 6th fight. Last 5: flashy=2
      history.push(createMockFight({ by: 'KO' })); // 7th fight. Last 5: flashy=1
      // Now last 5 fights: 0 kills, 1 flashy, length=5 -> Festive
      expect(computeCrowdMood(history)).toBe('Festive');

      // 3. Add 2 kills -> Bloodthirsty
      history.push(createMockFight({ by: 'Kill' })); // 8th fight. Last 5: 1 kill
      // Still has 1 kill, not 0. So not Festive. flashy < 3, kills < 2, draws < 2 -> Calm
      expect(computeCrowdMood(history)).toBe('Calm');

      history.push(createMockFight({ by: 'Kill' })); // 9th fight. Last 5: 2 kills
      expect(computeCrowdMood(history)).toBe('Bloodthirsty');

      // 4. Add draws to become Solemn. We need 1 kill and 2 draws in the last 5.
      // Current last 5: [KO, KO, KO, Kill, Kill] (kills = 2)
      // Push 1 draw: [KO, KO, Kill, Kill, Draw] (kills = 2 -> Bloodthirsty)
      history.push(createMockFight({ winner: null, by: 'Draw' }));
      expect(computeCrowdMood(history)).toBe('Bloodthirsty');

      // Push another draw: [KO, Kill, Kill, Draw, Draw] (kills = 2 -> Bloodthirsty)
      history.push(createMockFight({ winner: null, by: 'Draw' }));
      expect(computeCrowdMood(history)).toBe('Bloodthirsty');

      // Push something to drop a kill: [Kill, Kill, Draw, Draw, KO] (kills = 2 -> Bloodthirsty)
      history.push(createMockFight({ by: 'KO' }));
      expect(computeCrowdMood(history)).toBe('Bloodthirsty');

      // Drop the second kill: [Kill, Draw, Draw, KO, KO] (kills = 1, draws = 2 -> Solemn)
      history.push(createMockFight({ by: 'KO' }));
      expect(computeCrowdMood(history)).toBe('Solemn');
    });
  });
});
