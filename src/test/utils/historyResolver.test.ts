import { describe, it, expect } from 'vitest';
import { resolveWarriorName, resolveStableName, findWarrior } from '@/utils/historyResolver';
import { GameState } from '@/types/state.types';

describe('historyResolver', () => {
  const mockState: any = {
    player: { id: 'p1', stableName: 'Player Stable', name: 'Player' },
    roster: [
      { id: 'w1', name: 'Warrior 1' },
      { id: 'shared-id', name: 'Roster Warrior' },
    ],
    graveyard: [
      { id: 'w2', name: 'Warrior 2' },
      { id: 'shared-id', name: 'Grave Warrior' },
    ],
    retired: [{ id: 'w3', name: 'Warrior 3' }],
    rivals: [
      {
        id: 'r1',
        owner: { id: 'r1', stableName: 'Rival Stable 1' },
        roster: [
          { id: 'w4', name: 'Warrior 4' },
          { id: 'shared-id', name: 'Rival Warrior' },
        ],
      },
    ],
  };

  describe('resolveWarriorName', () => {
    it('should resolve name from roster', () => {
      expect(resolveWarriorName(mockState, 'w1', 'Fallback')).toBe('Warrior 1');
    });

    it('should resolve name from graveyard', () => {
      expect(resolveWarriorName(mockState, 'w2', 'Fallback')).toBe('Warrior 2');
    });

    it('should resolve name from retired', () => {
      expect(resolveWarriorName(mockState, 'w3', 'Fallback')).toBe('Warrior 3');
    });

    it('should resolve name from rivals', () => {
      expect(resolveWarriorName(mockState, 'w4', 'Fallback')).toBe('Warrior 4');
    });

    it('should use fallback if not found', () => {
      expect(resolveWarriorName(mockState, 'unknown', 'Fallback')).toBe('Fallback');
    });

    it('should prioritize roster > graveyard > retired > rivals', () => {
      expect(resolveWarriorName(mockState, 'shared-id', 'Fallback')).toBe('Roster Warrior');
    });
  });

  describe('resolveStableName', () => {
    it('should resolve player stable name', () => {
      expect(resolveStableName(mockState, 'p1', 'Fallback')).toBe('Player Stable');
    });

    it('should resolve rival stable name', () => {
      expect(resolveStableName(mockState, 'r1', 'Fallback')).toBe('Rival Stable 1');
    });

    it('should use fallback if not found', () => {
      expect(resolveStableName(mockState, 'unknown', 'Fallback')).toBe('Fallback');
    });
  });

  describe('findWarrior', () => {
    it('should find warrior by id', () => {
      const w = findWarrior(mockState, 'w1');
      expect(w?.name).toBe('Warrior 1');
    });

    it('should find warrior by name', () => {
      const w = findWarrior(mockState, undefined, 'Warrior 4');
      expect(w?.id).toBe('w4');
    });

    it('should prioritize ID over Name if both provided', () => {
      const w = findWarrior(mockState, 'w1', 'Warrior 4');
      expect(w?.id).toBe('w1');
    });

    it('should prioritize roster over other lists when searching by name', () => {
      const stateWithNameConflict: any = {
        ...mockState,
        roster: [...mockState.roster, { id: 'w-new', name: 'Warrior 4' }],
      };
      const w = findWarrior(stateWithNameConflict, undefined, 'Warrior 4');
      expect(w?.id).toBe('w-new');
    });
  });

  it('should handle state changes (new state object)', () => {
    const nextState = { ...mockState, roster: [{ id: 'w1', name: 'Updated Warrior 1' }] };
    expect(resolveWarriorName(nextState, 'w1', 'Fallback')).toBe('Updated Warrior 1');
  });
});
