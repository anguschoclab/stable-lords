import { FightingStyle, type Warrior, type FightPlan } from "@/types/game";

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

  const isDefensive = [
    FightingStyle.TotalParry,
    FightingStyle.WallOfSteel,
    FightingStyle.ParryRiposte,
  ].includes(style);

  let oe = 5, al = 6, kd = 5;

  if (isAggressive) {
    oe = style === FightingStyle.BashingAttack ? 9 : 8;
    al = style === FightingStyle.BashingAttack ? 3 : (style === FightingStyle.LungingAttack ? 8 : 5);
    kd = 7;
  } else if (isDefensive) {
    oe = style === FightingStyle.TotalParry ? 2 : 4;
    al = style === FightingStyle.TotalParry ? 2 : 5;
    kd = 3;
  } else if (style === FightingStyle.AimedBlow) {
    oe = 6; al = 5; kd = 8;
  }

  return { style, OE: oe, AL: al, killDesire: kd, target: "Any", protect: "Any" };
}
