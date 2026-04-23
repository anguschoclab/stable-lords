import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createRosterSlice, RosterSlice } from '@/state/slices/rosterSlice';
import { act } from '@testing-library/react';
import type { Warrior } from '@/types/state.types';
import { FightingStyle } from '@/types/shared.types';

const mockWarrior: Warrior = {
  id: 'w1',
  name: 'Gaius',
  style: FightingStyle.AimedBlow,
  attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
  fame: 0,
  popularity: 0,
  titles: [],
  injuries: [],
  flair: [],
  career: { wins: 0, losses: 0, kills: 0 },
  champion: false,
  status: 'Active',
};

const createTestStore = () =>
  create<RosterSlice & { week: number }>()(
    immer((set, get, ...args) => ({
      ...createRosterSlice(set, get, ...args),
      week: 1,
    }))
  );

describe('RosterSlice', () => {
  let useTestStore: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    useTestStore = createTestStore();
  });

  it('should add a warrior to the roster', () => {
    act(() => {
      useTestStore.getState().addWarrior(mockWarrior);
    });
    expect(useTestStore.getState().roster).toHaveLength(1);
    expect(useTestStore.getState().roster[0].id).toBe('w1');
  });

  it('should kill a warrior and move them to the graveyard', () => {
    act(() => {
      useTestStore.getState().addWarrior(mockWarrior);
    });

    act(() => {
      useTestStore.getState().killWarrior('w1', 'rival_1', 'Decapitation');
    });

    expect(useTestStore.getState().roster).toHaveLength(0);
    expect(useTestStore.getState().graveyard).toHaveLength(1);
    expect(useTestStore.getState().graveyard[0]).toMatchObject({
      id: 'w1',
      status: 'Dead',
      deathCause: 'Decapitation',
    });
  });

  it('should retire a warrior and move them to retired list', () => {
    act(() => {
      useTestStore.getState().addWarrior(mockWarrior);
    });

    act(() => {
      useTestStore.getState().retireWarrior('w1');
    });

    expect(useTestStore.getState().roster).toHaveLength(0);
    expect(useTestStore.getState().retired).toHaveLength(1);
    expect(useTestStore.getState().retired[0].status).toBe('Retired');
  });
});
