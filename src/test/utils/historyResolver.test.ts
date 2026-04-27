import { test, expect } from 'vitest';
import { resolveWarriorName, resolveStableName, findWarrior } from '@/utils/historyResolver';
import { GameState } from '@/types/state.types';

// Create a basic structure without needing full complex typed objects
interface TestNameResolutionState {
  player: { id: string; stableName: string; name: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rivals: { id: string; owner: { stableName: string }; roster?: { id: string; name: string }[] }[];
  roster: { id: string; name: string }[];
  graveyard: { id: string; name: string }[];
  retired: { id: string; name: string }[];
}

const generateState = (numRivals = 100, rosterSize = 20): TestNameResolutionState => {
  return {
    player: { id: 'p1', stableName: 'Player Stable', name: 'Player' },
    roster: Array.from({ length: rosterSize }, (_, i) => ({
      id: `p_w_${i}`,
      name: `Player Warrior ${i}`,
    })),
    graveyard: Array.from({ length: rosterSize }, (_, i) => ({
      id: `g_w_${i}`,
      name: `Graveyard Warrior ${i}`,
    })),
    retired: Array.from({ length: rosterSize }, (_, i) => ({
      id: `r_w_${i}`,
      name: `Retired Warrior ${i}`,
    })),
    rivals: Array.from({ length: numRivals }, (_, i) => ({
      id: `rival_${i}`,
      owner: { stableName: `Rival Stable ${i}` },
      roster: Array.from({ length: rosterSize }, (_, j) => ({
        id: `rival_${i}_w_${j}`,
        name: `Rival ${i} Warrior ${j}`,
      })),
    })),
  };
};

test('historyResolver caching logic exactly matches precedence', () => {
  const state: TestNameResolutionState = {
    player: { id: 'p1', stableName: 'Player Stable', name: 'Player' },
    roster: [{ id: 'w1', name: 'Roster Warrior 1' }], // Highest precedence
    graveyard: [
      { id: 'w1', name: 'Graveyard Warrior 1' },
      { id: 'w2', name: 'Graveyard Warrior 2' },
    ],
    retired: [
      { id: 'w2', name: 'Retired Warrior 2' },
      { id: 'w3', name: 'Retired Warrior 3' },
    ],
    rivals: [
      {
        id: 'r1',
        owner: { stableName: 'Rival 1' },
        roster: [
          { id: 'w3', name: 'Rival1 Warrior 3' },
          { id: 'w4', name: 'Rival1 Warrior 4' },
        ],
      }, // Rival 0 has higher precedence than Rival 1
      {
        id: 'r2',
        owner: { stableName: 'Rival 2' },
        roster: [
          { id: 'w4', name: 'Rival2 Warrior 4' },
          { id: 'w5', name: 'Rival2 Warrior 5' },
        ],
      },
    ],
  };

  expect(resolveWarriorName(state, 'w1', '')).toBe('Roster Warrior 1');
  expect(resolveWarriorName(state, 'w2', '')).toBe('Graveyard Warrior 2');
  expect(resolveWarriorName(state, 'w3', '')).toBe('Retired Warrior 3');
  expect(resolveWarriorName(state, 'w4', '')).toBe('Rival1 Warrior 4');
  expect(resolveWarriorName(state, 'w5', '')).toBe('Rival2 Warrior 5');
});

test('historyResolver stable name logic exactly matches precedence', () => {
  const state: TestNameResolutionState = {
    player: { id: 'p1', stableName: 'Player Stable', name: 'Player' },
    roster: [],
    graveyard: [],
    retired: [],
    rivals: [
      { id: 'p1', owner: { stableName: 'Rival 1' }, roster: [] },
      { id: 'r2', owner: { stableName: 'Rival 2' }, roster: [] },
      { id: 'r2', owner: { stableName: 'Rival 3' }, roster: [] },
    ],
  };

  expect(resolveStableName(state, 'p1', '')).toBe('Player Stable'); // Player stable > rival stable
  expect(resolveStableName(state, 'r2', '')).toBe('Rival 2'); // Rival 0 > Rival 1
  expect(resolveStableName(state, 'r99', 'Fallback')).toBe('Fallback');
});

test('findWarrior uses the correct precedence and caching', () => {
  // Use a minimal object matching GameState
  const state = {
    player: { id: 'p1', stableName: 'Player Stable', name: 'Player' },
    roster: [{ id: 'w1', name: 'Warrior 1' }],
    graveyard: [{ id: 'w1', name: 'Warrior 2' }],
    retired: [],
    rivals: [],
  } as unknown as GameState;

  expect(findWarrior(state, 'w1')).toEqual({ id: 'w1', name: 'Warrior 1' } as any);
  expect(findWarrior(state, undefined, 'Warrior 1')).toEqual({ id: 'w1', name: 'Warrior 1' } as any);
  expect(findWarrior(state, undefined, 'Warrior 2')).toEqual({ id: 'w1', name: 'Warrior 2' } as any);
  expect(findWarrior(state, 'w99', 'Warrior 99')).toBeUndefined();
});

test('historyResolver works correctly with missing arrays', () => {
  const state = {
    player: { id: 'p1', stableName: 'Player Stable', name: 'Player' },
  } as unknown as TestNameResolutionState;

  expect(resolveWarriorName(state, 'w1', 'Fallback')).toBe('Fallback');
  expect(resolveStableName(state, 'p1', 'Fallback')).toBe('Player Stable');
});

test('historyResolver cache speed', () => {
  const state = generateState();
  const start = performance.now();
  for (let i = 0; i < 1000; i++) {
    resolveWarriorName(state, 'rival_99_w_19', 'Legacy');
    resolveStableName(state, 'rival_99', 'Legacy');
    findWarrior(state as unknown as GameState, 'rival_99_w_19');
  }
  const end = performance.now();
  console.log(`Time taken: ${end - start} ms`);
  expect(end - start).toBeLessThan(100); // Should be very fast with O(1) cache
});
