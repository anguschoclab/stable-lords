import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createWorldSlice, WorldSlice } from '@/state/slices/worldSlice';
import { createEconomySlice, EconomySlice } from '@/state/slices/economySlice';
import { act } from '@testing-library/react';
import type { FightSummary } from '@/types/combat.types';

const createTestStore = () =>
  create<WorldSlice & EconomySlice>()(
    immer((set, get, ...args) => ({
      ...createWorldSlice(set, get, ...args),
      ...createEconomySlice(set, get, ...args),
    }))
  );

describe('WorldSlice', () => {
  let useTestStore: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    useTestStore = createTestStore();
  });

  it('should initialize a stable with starting capital', () => {
    act(() => {
      useTestStore.getState().initializeStable('Amau', 'The Gilded Lions');
    });

    const { player, treasury } = useTestStore.getState();
    expect(player.name).toBe('Amau');
    expect(player.stableName).toBe('The Gilded Lions');
    expect(treasury).toBe(500);
  });

  it('should append a fight to the arena history', () => {
    const mockFight = {
      id: 'f1',
      winner: 'a',
      transcript: [{ text: 'Clang!' }],
    } as unknown as FightSummary;

    act(() => {
      useTestStore.getState().appendFight(mockFight);
    });

    expect(useTestStore.getState().arenaHistory).toHaveLength(1);
  });

  it('should truncate arena history and remove old transcripts', () => {
    // Fill history with 25 fights
    act(() => {
      for (let i = 0; i < 25; i++) {
        const fight = {
          id: `f${i}`,
          transcript: [{ text: 'Heavy breathing...' }],
        } as unknown as FightSummary;
        useTestStore.getState().appendFight(fight);
      }
    });

    const history = useTestStore.getState().arenaHistory;
    expect(history).toHaveLength(25);

    // The 0th fight (oldest) should have NO transcript if we keep only last 20
    expect(history[0].transcript).toBeUndefined();
    // The 24th fight (newest) SHOULD have a transcript
    expect(history[24].transcript).toBeDefined();
  });
});
