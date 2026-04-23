/** @vitest-environment node */
import { describe, it, expect } from 'vitest';
import { aiPlanForWarrior, getStyleMatchupMods } from '@/engine/ownerAI';
import { FightingStyle } from '@/types/game';

describe('ownerAI - aiPlanForWarrior', () => {
  const mockWarrior: any = {
    id: 'w1',
    name: 'Test Warrior',
    style: FightingStyle.StrikingAttack,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
  };

  it('should apply personality and philosophy modifiers', () => {
    // Aggressive owner, Brute Force philosophy
    const plan = aiPlanForWarrior(mockWarrior, 'Aggressive', 'Brute Force');

    // Expected: 8 (base) + 2 (Aggressive) + 2 (Brute Force) = 12 -> Clamped to 10
    expect(plan.OE).toBe(10);
    expect(plan.AL).toBe(5);
    expect(plan.killDesire).toBe(10);
  });

  it('should clamp values between 1 and 10', () => {
    const plan = aiPlanForWarrior(
      mockWarrior,
      'Aggressive',
      'Brute Force',
      FightingStyle.WallOfSteel
    );
    // WallOfSteel vs StrikingAttack gives my OE +2
    // Total OE: 8 (base) + 2 (Aggressive) + 2 (Brute Force) + 2 (Matchup) = 14 -> Clamped to 10
    expect(plan.OE).toBe(10);
  });
});

describe('ownerAI - getStyleMatchupMods', () => {
  it('return correct mods for known match-ups', () => {
    const mods = getStyleMatchupMods(FightingStyle.BashingAttack, FightingStyle.LungingAttack);
    expect(mods.oe).toBe(2);
    expect(mods.al).toBe(1);
    expect(mods.kd).toBe(1);
  });

  it('return zero mods for unknown match-ups', () => {
    const mods = getStyleMatchupMods(FightingStyle.BashingAttack, FightingStyle.AimedBlow);
    expect(mods.oe).toBe(0);
    expect(mods.al).toBe(0);
    expect(mods.kd).toBe(0);
  });
});
