import { describe, it, expect, vi } from 'vitest';
import { computeHealthImpact, applyHealthUpdates } from '@/engine/health';
import { type GameState, type Warrior, type InjuryData } from '@/types/game';

describe('Health System (Boundary Testing)', () => {
  it('should handle warrior health / injuries correctly at boundaries', () => {
    // Setting up a warrior with negative weeks remaining to ensure tick logic is safe
    const mockInjury: InjuryData = {
      id: 'i1',
      name: 'cut',
      description: 'cut',
      severity: 'Minor',
      weeksRemaining: -1,
      penalties: {},
    };

    // Setting up another warrior with 0 weeks remaining
    const mockInjury2: InjuryData = {
      id: 'i2',
      name: 'bruise',
      description: 'bruise',
      severity: 'Minor',
      weeksRemaining: 0,
      penalties: {},
    };

    const mockState = {
      week: 5,
      roster: [
        { id: 'w1', name: 'Warrior 1', injuries: [mockInjury] },
        { id: 'w2', name: 'Warrior 2', injuries: [mockInjury2] },
      ],
      restStates: [],
    } as unknown as GameState;

    const impact = computeHealthImpact(mockState);

    // The negative and 0 week injuries should instantly heal since -1 - 1 = -2 <= 0
    expect(impact.rosterUpdates?.get('w1')?.injuries).toEqual([]);
    expect(impact.rosterUpdates?.get('w2')?.injuries).toEqual([]);

    expect(impact.newsletterItems?.[0].items).toContain('Warrior 1 recovered from cut.');
    expect(impact.newsletterItems?.[0].items).toContain('Warrior 2 recovered from bruise.');
  });

  it('should handle empty injuries array safely', () => {
    const mockState = {
      week: 5,
      roster: [{ id: 'w3', name: 'Warrior 3', injuries: [] }],
      restStates: [],
    } as unknown as GameState;

    const newState = applyHealthUpdates(mockState);
    expect(newState.roster[0].injuries).toEqual([]);
  });
});
