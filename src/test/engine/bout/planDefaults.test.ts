import { describe, it, expect } from 'vitest';
import { defaultPlanForWarrior } from '@/engine/bout/planDefaults';
import { FightingStyle } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import crypto from 'crypto';

function createMockWarrior(style: FightingStyle, wt: number = 10): Warrior {
  return {
    id: crypto.randomUUID() as WarriorId,
    name: 'Test Warrior',
    style,
    attributes: {
      ST: 10,
      CN: 10,
      SZ: 10,
      WT: wt,
      WL: 10,
      SP: 10,
      DF: 10,
    },
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: 'Active',
    traits: [],
  };
}

describe('defaultPlanForWarrior', () => {
  describe('Aggressive Styles', () => {
    it('generates correct defaults for BashingAttack', () => {
      const warrior = createMockWarrior(FightingStyle.BashingAttack);
      const plan = defaultPlanForWarrior(warrior);
      expect(plan).toEqual({
        style: FightingStyle.BashingAttack,
        OE: 7,
        AL: 3,
        killDesire: 7,
        target: 'Any',
        protect: 'Any',
        feintTendency: 0,
      });
    });

    it('generates correct defaults for LungingAttack', () => {
      const warrior = createMockWarrior(FightingStyle.LungingAttack);
      const plan = defaultPlanForWarrior(warrior);
      expect(plan).toEqual({
        style: FightingStyle.LungingAttack,
        OE: 7,
        AL: 6,
        killDesire: 7,
        target: 'Any',
        protect: 'Any',
        feintTendency: 0,
      });
    });

    it('generates correct defaults for StrikingAttack', () => {
      const warrior = createMockWarrior(FightingStyle.StrikingAttack);
      const plan = defaultPlanForWarrior(warrior);
      expect(plan).toEqual({
        style: FightingStyle.StrikingAttack,
        OE: 7,
        AL: 5,
        killDesire: 7,
        target: 'Any',
        protect: 'Any',
        feintTendency: 0,
      });
    });

    it('generates correct defaults for SlashingAttack', () => {
      const warrior = createMockWarrior(FightingStyle.SlashingAttack);
      const plan = defaultPlanForWarrior(warrior);
      expect(plan).toEqual({
        style: FightingStyle.SlashingAttack,
        OE: 7,
        AL: 5,
        killDesire: 7,
        target: 'Any',
        protect: 'Any',
        feintTendency: 0,
      });
    });
  });

  describe('Defensive and Tactical Styles', () => {
    it('generates correct defaults for TotalParry', () => {
      const warrior = createMockWarrior(FightingStyle.TotalParry);
      const plan = defaultPlanForWarrior(warrior);
      expect(plan).toEqual({
        style: FightingStyle.TotalParry,
        OE: 2,
        AL: 2,
        killDesire: 3,
        target: 'Any',
        protect: 'Any',
        feintTendency: 0,
      });
    });

    it('generates correct defaults for WallOfSteel', () => {
      const warrior = createMockWarrior(FightingStyle.WallOfSteel);
      const plan = defaultPlanForWarrior(warrior);
      expect(plan).toEqual({
        style: FightingStyle.WallOfSteel,
        OE: 7,
        AL: 6,
        killDesire: 6,
        target: 'Any',
        protect: 'Any',
        feintTendency: 0,
      });
    });

    it('generates correct defaults for ParryRiposte', () => {
      const warrior = createMockWarrior(FightingStyle.ParryRiposte);
      const plan = defaultPlanForWarrior(warrior);
      expect(plan).toEqual({
        style: FightingStyle.ParryRiposte,
        OE: 4,
        AL: 5,
        killDesire: 3,
        target: 'Any',
        protect: 'Any',
        feintTendency: 0,
      });
    });

    it('generates correct defaults for AimedBlow', () => {
      const warrior = createMockWarrior(FightingStyle.AimedBlow);
      const plan = defaultPlanForWarrior(warrior);
      expect(plan).toEqual({
        style: FightingStyle.AimedBlow,
        OE: 6,
        AL: 5,
        killDesire: 8,
        target: 'Any',
        protect: 'Any',
        feintTendency: 0,
      });
    });
  });

  describe('Other Styles (Defaults)', () => {
    it('generates base defaults for an unhandled style (e.g. ParryLunge)', () => {
      const warrior = createMockWarrior(FightingStyle.ParryLunge);
      const plan = defaultPlanForWarrior(warrior);
      expect(plan).toEqual({
        style: FightingStyle.ParryLunge,
        OE: 5, // Base default
        AL: 6, // Base default
        killDesire: 5, // Base default
        target: 'Any',
        protect: 'Any',
        feintTendency: 0,
      });
    });
  });

  describe('Feint Tendency Logic', () => {
    it('sets feintTendency to 0 when WT is less than 15', () => {
      const warrior = createMockWarrior(FightingStyle.AimedBlow, 14);
      const plan = defaultPlanForWarrior(warrior);
      expect(plan.feintTendency).toBe(0);
    });

    it('calculates feintTendency correctly when WT is 15', () => {
      const warrior = createMockWarrior(FightingStyle.AimedBlow, 15);
      const plan = defaultPlanForWarrior(warrior);
      // Math.floor((15 - 14) * 1.5) = Math.floor(1.5) = 1
      expect(plan.feintTendency).toBe(1);
    });

    it('calculates feintTendency correctly when WT is 18', () => {
      const warrior = createMockWarrior(FightingStyle.AimedBlow, 18);
      const plan = defaultPlanForWarrior(warrior);
      // Math.floor((18 - 14) * 1.5) = Math.floor(4 * 1.5) = Math.floor(6) = 6
      expect(plan.feintTendency).toBe(6);
    });

    it('caps feintTendency at 10 for very high WT', () => {
      const warrior = createMockWarrior(FightingStyle.AimedBlow, 25);
      const plan = defaultPlanForWarrior(warrior);
      // Math.floor((25 - 14) * 1.5) = Math.floor(11 * 1.5) = Math.floor(16.5) = 16 => capped at 10
      expect(plan.feintTendency).toBe(10);
    });
  });
});
