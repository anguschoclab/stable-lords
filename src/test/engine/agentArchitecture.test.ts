import { describe, it, expect } from 'vitest';
import { verifyIntentSkepticism } from '@/engine/ai/intentEngine';
import type { GameState, RivalStableData } from '@/types/state.types';

describe('AI Agent Architecture - Skeptical Intent', () => {
  const mockState = {
    week: 10,
    arenaHistory: [],
    rivals: [],
  } as unknown as GameState;

  const mockRival: Partial<RivalStableData> = {
    owner: { id: 'r1', personality: 'Methodical' } as unknown,
    treasury: 500,
    roster: [{ status: 'Active' }, { status: 'Active' }, { status: 'Active' }] as unknown,
    strategy: { intent: 'VENDETTA', planWeeksRemaining: 5 },
  };

  it('should approve a valid plan', () => {
    const isDisproved = verifyIntentSkepticism(mockRival as RivalStableData, mockState);
    expect(isDisproved).toBe(false);
  });

  it('should disprove a plan due to financial crisis', () => {
    const poorRival = { ...mockRival, treasury: 50 } as RivalStableData;
    const isDisproved = verifyIntentSkepticism(poorRival, mockState);
    expect(isDisproved).toBe(true);
  });

  it('should disprove a VENDETTA due to low active roster', () => {
    const weakRival = {
      ...mockRival,
      roster: [{ status: 'Active' }, { status: 'Inactive' }],
    } as unknown as RivalStableData;
    const isDisproved = verifyIntentSkepticism(weakRival, mockState);
    expect(isDisproved).toBe(true);
  });

  it('should NOT disprove if personality is Aggressive despite low treasury (higher risk tolerance)', () => {
    const aggressiveRival = {
      ...mockRival,
      owner: { id: 'r1', personality: 'Aggressive' } as unknown,
      treasury: 140,
    } as RivalStableData;
    const isDisproved = verifyIntentSkepticism(aggressiveRival, mockState);
    expect(isDisproved).toBe(true);
  });
});

import { verifyBoutAcceptance } from '@/engine/ai/workers/competitionWorker';
import { type Warrior, type WeatherType, FightingStyle } from '@/types/game';

describe('AI Agent Architecture - Weather Skepticism', () => {
  const lungeWarrior = {
    id: 'w1',
    name: 'Lunge Buster',
    style: FightingStyle.LungingAttack,
    attributes: { CN: 7, CON: 10 },
  } as unknown as Warrior;

  const tankWarrior = {
    id: 'w2',
    name: 'Iron Wall',
    style: 'Guard',
    attributes: { CN: 60, CON: 60 },
  } as unknown as Warrior;

  const mockRival = { treasury: 500, owner: { personality: 'Methodical' } } as RivalStableData;

  it('should decline a bout for LungingAttack in Rainy weather', () => {
    const mockCalculated = {
      treasury: 500,
      owner: { personality: 'Calculated' },
    } as unknown as RivalStableData;
    const decision = verifyBoutAcceptance(mockCalculated, lungeWarrior, tankWarrior, 'Rainy');
    expect(decision.accepted).toBe(false);
    expect(decision.reason).toContain('rain');
  });

  it('should accept a bout for LungingAttack in Clear weather', () => {
    const mockCalculated = {
      treasury: 500,
      owner: { personality: 'Calculated' },
    } as unknown as RivalStableData;
    const decision = verifyBoutAcceptance(mockCalculated, lungeWarrior, tankWarrior, 'Clear');
    expect(decision.accepted).toBe(true);
  });

  it('should decline a bout for low CON warrior in Sweltering weather', () => {
    const decision = verifyBoutAcceptance(mockRival, lungeWarrior, tankWarrior, 'Sweltering');
    expect(decision.accepted).toBe(false);
    expect(decision.reason).toContain('Heatstroke risk too high');
  });

  it('should accept a bout for high CON warrior in Sweltering weather', () => {
    const mockCalculated = {
      treasury: 500,
      owner: { personality: 'Calculated' },
    } as unknown as RivalStableData;
    const decision = verifyBoutAcceptance(mockCalculated, tankWarrior, lungeWarrior, 'Sweltering');
    expect(decision.accepted).toBe(true);
  });
});
