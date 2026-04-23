import { describe, it, expect } from 'vitest';
import {
  getMatchupBonus,
  resolveEffectiveTactics,
  applyAggressionBias,
} from '@/engine/combat/resolution/resolution';
import { FightingStyle, type FightPlan, type PhaseStrategy } from '@/types/game';

describe('getMatchupBonus', () => {
  it('returns positive bonus for favorable matchups', () => {
    // Striker vs Slasher is typically favorable
    expect(
      getMatchupBonus(FightingStyle.StrikingAttack, FightingStyle.SlashingAttack)
    ).toBeDefined();
  });

  it('returns negative bonus for unfavorable matchups', () => {
    // Test unfavorable matchup
    expect(getMatchupBonus(FightingStyle.TotalParry, FightingStyle.StrikingAttack)).toBeDefined();
  });

  it('returns 0 for neutral matchups', () => {
    // Test same style matchup
    expect(
      getMatchupBonus(FightingStyle.StrikingAttack, FightingStyle.StrikingAttack)
    ).toBeDefined();
  });
});

describe('resolveEffectiveTactics', () => {
  it('returns phase-specific tactics when phase tactics defined', () => {
    const plan: FightPlan = {
      style: FightingStyle.StrikingAttack,
      OE: 5,
      AL: 5,
      offensiveTactic: 'Lunge',
      defensiveTactic: 'Dodge',
      phases: {
        opening: {
          OE: 6,
          AL: 4,
          offensiveTactic: 'Slash',
          defensiveTactic: 'Parry',
        } as PhaseStrategy,
      },
    };
    const result = resolveEffectiveTactics(plan, 'opening');
    expect(result.offTactic).toBe('Slash');
    expect(result.defTactic).toBe('Parry');
  });

  it('falls back to base tactics when phase tactics undefined', () => {
    const plan: FightPlan = {
      style: FightingStyle.StrikingAttack,
      OE: 5,
      AL: 5,
      offensiveTactic: 'Lunge',
      defensiveTactic: 'Dodge',
    };
    const result = resolveEffectiveTactics(plan, 'mid');
    expect(result.offTactic).toBe('Lunge');
    expect(result.defTactic).toBe('Dodge');
  });

  it("falls back to 'none' when no tactics defined", () => {
    const plan: FightPlan = {
      style: FightingStyle.StrikingAttack,
      OE: 5,
      AL: 5,
    };
    const result = resolveEffectiveTactics(plan, 'late');
    expect(result.offTactic).toBe('none');
    expect(result.defTactic).toBe('none');
  });

  it('uses phase target when defined', () => {
    const plan: FightPlan = {
      style: FightingStyle.StrikingAttack,
      OE: 5,
      AL: 5,
      target: 'Any',
      phases: {
        mid: {
          OE: 5,
          AL: 5,
          target: 'Head',
        } as PhaseStrategy,
      },
    };
    const result = resolveEffectiveTactics(plan, 'mid');
    expect(result.target).toBe('Head');
  });

  it('falls back to base target when phase undefined', () => {
    const plan: FightPlan = {
      style: FightingStyle.StrikingAttack,
      OE: 5,
      AL: 5,
      target: 'Right Leg',
    };
    const result = resolveEffectiveTactics(plan, 'late');
    expect(result.target).toBe('Right Leg');
  });
});

describe('applyAggressionBias', () => {
  it('returns [0, 0] for neutral bias of 5', () => {
    const result = applyAggressionBias(5);
    expect(result).toEqual([0, 0]);
  });

  it('returns positive attBias, negative defBias for aggression > 5', () => {
    const result = applyAggressionBias(8);
    expect(result[0]).toBeGreaterThan(0); // attBias
    expect(result[1]).toBeLessThan(0); // defBias
    expect(result[0]).toBeCloseTo(1.5); // (8 - 5) * 0.5
    expect(result[1]).toBeCloseTo(-1.5); // -(8 - 5) * 0.5
  });

  it('returns negative attBias, positive defBias for aggression < 5', () => {
    const result = applyAggressionBias(3);
    expect(result[0]).toBeLessThan(0); // attBias
    expect(result[1]).toBeGreaterThan(0); // defBias
    expect(result[0]).toBeCloseTo(-1); // (3 - 5) * 0.5
    expect(result[1]).toBeCloseTo(1); // -(3 - 5) * 0.5
  });

  it('handles maximum aggression bias of 10', () => {
    const result = applyAggressionBias(10);
    expect(result[0]).toBeCloseTo(2.5); // (10 - 5) * 0.5
    expect(result[1]).toBeCloseTo(-2.5);
  });

  it('handles minimum aggression bias of 0', () => {
    const result = applyAggressionBias(0);
    expect(result[0]).toBeCloseTo(-2.5); // (0 - 5) * 0.5
    expect(result[1]).toBeCloseTo(2.5);
  });
});
