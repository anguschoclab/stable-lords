import { FightingStyle } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { FightPlan } from '@/types/combat.types';

/**
 * Returns a sane default plan for a warrior based on their fighting style.
 * Used when a warrior has no custom plan set.
 */
export function defaultPlanForWarrior(warrior: Warrior): FightPlan {
  const style = warrior.style;

  const isAggressive = [
    FightingStyle.BashingAttack,
    FightingStyle.StrikingAttack,
    FightingStyle.LungingAttack,
    FightingStyle.SlashingAttack,
  ].includes(style);

  let oe = 5,
    al = 6,
    kd = 5;

  if (isAggressive) {
    oe = style === FightingStyle.BashingAttack ? 7 : 7;
    al = style === FightingStyle.BashingAttack ? 3 : style === FightingStyle.LungingAttack ? 6 : 5;
    kd = 7;
  } else if (style === FightingStyle.TotalParry) {
    oe = 2;
    al = 2;
    kd = 3;
  } else if (style === FightingStyle.WallOfSteel) {
    // WoS uses INI=7 advantage + passive ramp to control fights — needs active OE not passive OE=4
    oe = 7;
    al = 6;
    kd = 6;
  } else if (style === FightingStyle.ParryRiposte) {
    oe = 4;
    al = 5;
    kd = 3;
  } else if (style === FightingStyle.AimedBlow) {
    oe = 6;
    al = 5;
    kd = 8;
  }

  // Feint tendency is derived from WT — only effective at WT >= 15 (engine gate)
  const feintTendency =
    warrior.attributes.WT >= 15 ? Math.min(10, Math.floor((warrior.attributes.WT - 14) * 1.5)) : 0;

  return { style, OE: oe, AL: al, killDesire: kd, target: 'Any', protect: 'Any', feintTendency };
}
