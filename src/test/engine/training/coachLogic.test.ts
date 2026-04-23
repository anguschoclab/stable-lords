import { describe, it, expect } from 'vitest';
import { computeTrainerBonus, getHealingTrainerBonus } from '@/engine/training/coachLogic';
import { FightingStyle } from '@/types/game';

describe('coachLogic', () => {
  describe('computeTrainerBonus', () => {
    it('should calculate bonus for relevant attributes and style', () => {
      const trainers = [
        {
          id: 't1',
          name: 'Coach 1',
          tier: 'Master',
          focus: 'Aggression',
          styleBonusStyle: FightingStyle.StrikingAttack,
          contractWeeksLeft: 10,
          cost: 10,
          fame: 1,
          age: 40,
        },
        {
          id: 't2',
          name: 'Coach Expired',
          tier: 'Master',
          focus: 'Aggression',
          styleBonusStyle: FightingStyle.StrikingAttack,
          contractWeeksLeft: 0,
          cost: 10,
          fame: 1,
          age: 40,
        },
      ] as any;

      const bonus = computeTrainerBonus('ST', trainers, FightingStyle.StrikingAttack);
      // TIER_BONUS for Master = 3. Style match = +1. Total = 4. 4 * 0.05 = 0.2
      expect(bonus).toBeCloseTo(0.2);
    });
  });

  describe('getHealingTrainerBonus', () => {
    it('should calculate healing bonus', () => {
      const trainers = [
        {
          id: 't1',
          tier: 'Novice',
          focus: 'Healing',
          contractWeeksLeft: 10,
        },
        {
          id: 't2',
          tier: 'Novice',
          focus: 'Healing',
          contractWeeksLeft: 0,
        },
        {
          id: 't3',
          tier: 'Novice',
          focus: 'Aggression',
          contractWeeksLeft: 10,
        },
      ] as any;
      // Novice healing bonus = 1
      expect(getHealingTrainerBonus(trainers)).toBe(1);
    });
  });
});
