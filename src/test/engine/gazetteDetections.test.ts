import { describe, it, expect } from 'vitest';
import {
  detectUpsets,
  detectDebuts,
  computeStreaks,
  detectRivalryMatchup,
  detectGazetteTags,
  detectHotStreakers,
  detectRisingStars,
} from '@/engine/gazette/gazetteDetections';
import type { FightSummary } from '@/types/combat.types';

const createFight = (overrides: Partial<FightSummary> = {}): FightSummary => ({
  id: 'f1',
  week: 1,
  title: 'Fight',
  a: 'Alice',
  d: 'Bob',
  warriorIdA: 'wa',
  warriorIdD: 'wd',
  winner: 'A',
  by: 'KO',
  styleA: 'Brawler',
  styleD: 'Swordsman',
  createdAt: new Date().toISOString(),
  fameA: 10,
  fameD: 10,
  ...overrides,
});

describe('detectUpsets', () => {
  it('detects an upset when the underdog wins significantly', () => {
    // Loser fame (30) >= winner fame (10) + 10 AND loser fame (30) >= 2 * winner fame (10)
    const fights = [
      createFight({ a: 'Underdog', d: 'Favorite', winner: 'A', fameA: 10, fameD: 30 }),
    ];
    const upsets = detectUpsets(fights);
    expect(upsets).toHaveLength(1);
    expect(upsets[0]).toEqual({
      winner: 'Underdog',
      loser: 'Favorite',
      winnerFame: 10,
      loserFame: 30,
    });
  });

  it('does not detect an upset when fame difference is small', () => {
    // Loser fame (15) < winner fame (10) + 10
    const fights = [
      createFight({ a: 'Underdog', d: 'Favorite', winner: 'A', fameA: 10, fameD: 15 }),
    ];
    const upsets = detectUpsets(fights);
    expect(upsets).toHaveLength(0);
  });

  it('does not detect an upset when ratio is small', () => {
    // Loser fame (25) >= winner fame (15) + 10 is TRUE
    // BUT loser fame (25) < 2 * winner fame (15) (30)
    const fights = [
      createFight({ a: 'Underdog', d: 'Favorite', winner: 'A', fameA: 15, fameD: 25 }),
    ];
    const upsets = detectUpsets(fights);
    expect(upsets).toHaveLength(0);
  });

  it('does not detect an upset when the favorite wins', () => {
    const fights = [
      createFight({ a: 'Favorite', d: 'Underdog', winner: 'A', fameA: 30, fameD: 10 }),
    ];
    const upsets = detectUpsets(fights);
    expect(upsets).toHaveLength(0);
  });

  it('does not detect an upset on a draw', () => {
    const fights = [createFight({ winner: null, fameA: 10, fameD: 30 })];
    const upsets = detectUpsets(fights);
    expect(upsets).toHaveLength(0);
  });

  it('does not detect an upset when fame data is missing', () => {
    const fights = [
      createFight({ a: 'Underdog', d: 'Favorite', winner: 'A', fameA: undefined, fameD: 30 }),
    ];
    const upsets = detectUpsets(fights);
    expect(upsets).toHaveLength(0);
  });
});

describe('detectDebuts', () => {
  it('identifies warriors making their first appearance', () => {
    const allFights = [
      createFight({ id: 'f1', a: 'Alice', d: 'Bob' }),
      createFight({ id: 'f2', a: 'Alice', d: 'Charlie' }),
    ];
    const weekFights = [
      createFight({ id: 'f2', a: 'Alice', d: 'Charlie' }), // Charlie debut
      createFight({ id: 'f3', a: 'Dave', d: 'Alice' }), // Dave debut
    ];
    // allFights has f1, f2. weekFights are f2, f3.
    // priorCount = 3 - 2 = 1.
    // priorNames = {Alice, Bob} from f1.
    // weekFights: f2(Alice, Charlie), f3(Dave, Alice).
    // debuts: Charlie, Dave.

    const debuts = detectDebuts(weekFights, [
      ...allFights,
      createFight({ id: 'f3', a: 'Dave', d: 'Alice' }),
    ]);
    expect(debuts).toContain('Charlie');
    expect(debuts).toContain('Dave');
    expect(debuts).not.toContain('Alice');
    expect(debuts).not.toContain('Bob');
  });

  it('handles the first week correctly (all are debuts)', () => {
    const weekFights = [
      createFight({ id: 'f1', a: 'Alice', d: 'Bob' }),
      createFight({ id: 'f2', a: 'Charlie', d: 'Dave' }),
    ];
    const debuts = detectDebuts(weekFights, weekFights);
    expect(debuts).toHaveLength(4);
    expect(debuts).toContain('Alice');
    expect(debuts).toContain('Bob');
    expect(debuts).toContain('Charlie');
    expect(debuts).toContain('Dave');
  });

  it('returns an empty array when weekFights is empty', () => {
    const allFights = [createFight({ id: 'f1', a: 'Alice', d: 'Bob' })];
    const debuts = detectDebuts([], allFights);
    expect(debuts).toHaveLength(0);
  });

  it('does not return duplicates if a debuting fighter fights multiple times in a week', () => {
    const allFights = [
      createFight({ id: 'f1', a: 'Alice', d: 'Bob' })
    ];
    const weekFights = [
      createFight({ id: 'f2', a: 'Charlie', d: 'Dave' }),
      createFight({ id: 'f3', a: 'Charlie', d: 'Eve' }),
    ];
    const debuts = detectDebuts(weekFights, [...allFights, ...weekFights]);
    expect(debuts).toHaveLength(3);
    expect(debuts).toContain('Charlie');
    expect(debuts).toContain('Dave');
    expect(debuts).toContain('Eve');
    expect(debuts.filter(d => d === 'Charlie')).toHaveLength(1); // Only 1 Charlie
  });

  it('safely handles undefined or null entries in allFights', () => {
    const allFights = [
      createFight({ id: 'f1', a: 'Alice', d: 'Bob' }),
      undefined as unknown as FightSummary,
      null as unknown as FightSummary,
    ];
    const weekFights = [
      createFight({ id: 'f2', a: 'Alice', d: 'Charlie' }),
    ];
    // Ensure allFights length includes the undefined/nulls to test loop logic properly
    const debuts = detectDebuts(weekFights, [...allFights, ...weekFights]);
    expect(debuts).toHaveLength(1);
    expect(debuts).toContain('Charlie');
  });
});

describe('computeStreaks', () => {
  it('correctly tracks win and loss streaks', () => {
    const fights = [
      createFight({ a: 'Alice', d: 'Bob', winner: 'A' }), // Alice 1, Bob -1
      createFight({ a: 'Alice', d: 'Charlie', winner: 'A' }), // Alice 2, Charlie -1
      createFight({ a: 'Dave', d: 'Alice', winner: 'D' }), // Alice 3, Dave -1
      createFight({ a: 'Alice', d: 'Eve', winner: 'D' }), // Alice -1, Eve 1
    ];
    const streaks = computeStreaks(fights);
    expect(streaks.get('Alice')).toBe(-1);
    expect(streaks.get('Bob')).toBe(-1);
    expect(streaks.get('Charlie')).toBe(-1);
    expect(streaks.get('Dave')).toBe(-1);
    expect(streaks.get('Eve')).toBe(1);
  });
});

describe('detectRivalryMatchup', () => {
  it('detects a rivalry when warriors meet 3+ times', () => {
    const f1 = createFight({ a: 'Alice', d: 'Bob' });
    const f2 = createFight({ a: 'Alice', d: 'Bob' });
    const f3 = createFight({ a: 'Alice', d: 'Bob' });
    const allFights = [f1, f2, f3];
    const weekFights = [f3];

    const rivalry = detectRivalryMatchup(weekFights, allFights);
    expect(rivalry).toEqual({ a: 'Alice', b: 'Bob', count: 3 });
  });

  it('does not detect rivalry with fewer than 3 meetings', () => {
    const f1 = createFight({ a: 'Alice', d: 'Bob' });
    const f2 = createFight({ a: 'Alice', d: 'Bob' });
    const allFights = [f1, f2];
    const weekFights = [f2];

    const rivalry = detectRivalryMatchup(weekFights, allFights);
    expect(rivalry).toBeNull();
  });
});

describe('detectHotStreakers', () => {
  it('detects winners on a streak of 5+', () => {
    const streaks = new Map([
      ['Alice', 5],
      ['Bob', 4],
    ]);
    const weekFights = [
      createFight({ a: 'Alice', d: 'Charlie', winner: 'A' }),
      createFight({ a: 'Bob', d: 'Dave', winner: 'A' }),
    ];
    const hot = detectHotStreakers(weekFights, streaks);
    expect(hot).toHaveLength(1);
    expect(hot[0].name).toBe('Alice');
    expect(hot[0].streak).toBe(5);
  });
});

describe('detectRisingStars', () => {
  it('detects warriors who are 3-0 after this week', () => {
    const f1 = createFight({ a: 'Alice', d: 'B', winner: 'A' });
    const f2 = createFight({ a: 'Alice', d: 'C', winner: 'A' });
    const f3 = createFight({ a: 'Alice', d: 'D', winner: 'A' });
    const allFights = [f1, f2, f3];
    const weekFights = [f3];

    const stars = detectRisingStars(weekFights, allFights);
    expect(stars).toContain('Alice');
  });

  it('does not detect warriors with losses', () => {
    const f1 = createFight({ a: 'Alice', d: 'B', winner: 'D' });
    const f2 = createFight({ a: 'Alice', d: 'C', winner: 'A' });
    const f3 = createFight({ a: 'Alice', d: 'D', winner: 'A' });
    const allFights = [f1, f2, f3];
    const weekFights = [f3];

    const stars = detectRisingStars(weekFights, allFights);
    expect(stars).toHaveLength(0);
  });
});

describe('detectGazetteTags', () => {
  it('assigns Bloodbath for 2+ kills', () => {
    const fights = [createFight({ by: 'Kill' }), createFight({ by: 'Kill' })];
    const detections = {
      tags: [],
      hotStreakers: [],
      rivalryPair: null,
      risingStars: [],
      upsets: [],
    };
    const tags = detectGazetteTags(fights, detections);
    expect(tags).toContain('Bloodbath');
  });

  it('assigns KO Fest for 3+ KOs', () => {
    const fights = [
      createFight({ by: 'KO' }),
      createFight({ by: 'KO' }),
      createFight({ by: 'KO' }),
    ];
    const detections = {
      tags: [],
      hotStreakers: [],
      rivalryPair: null,
      risingStars: [],
      upsets: [],
    };
    const tags = detectGazetteTags(fights, detections);
    expect(tags).toContain('KO Fest');
  });

  it('assigns Upset when upsets are detected', () => {
    const detections = {
      tags: [],
      hotStreakers: [],
      rivalryPair: null,
      risingStars: [],
      upsets: [{ winner: 'W', loser: 'L', winnerFame: 1, loserFame: 20 }],
    };
    const tags = detectGazetteTags([], detections);
    expect(tags).toContain('Upset');
  });
});
