import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import { type Attributes, type TrainerFocus } from '@/types/shared.types';
import { TIER_BONUS } from '@/engine/trainers';

const FOCUS_ATTR_MAP: Record<TrainerFocus, (keyof Attributes)[]> = {
  Aggression: ['ST', 'SP'],
  Defense: ['CN', 'WL'],
  Endurance: ['CN', 'WL', 'ST'],
  Mind: ['WT', 'DF'],
  Healing: [],
};

/**
 * Computes the aggregate trainer bonus for a specific attribute.
 */
export function computeTrainerBonus(
  attribute: keyof Attributes,
  trainers: GameState['trainers'],
  warriorStyle: Warrior['style']
): number {
  let bonus = 0;
  for (const t of trainers) {
    if (t.contractWeeksLeft <= 0) continue;
    const focus = t.focus as TrainerFocus;
    const relevantAttrs = FOCUS_ATTR_MAP[focus] ?? [];
    if (relevantAttrs.includes(attribute)) {
      bonus += TIER_BONUS[t.tier as keyof typeof TIER_BONUS] ?? 0;
    }
    // Style affinity bonus
    if (t.styleBonusStyle === warriorStyle) {
      bonus += 1;
    }
  }
  return bonus * 0.05; // each point = +5%
}

/**
 * Returns the aggregate healing bonus from specialized medical trainers.
 */
export function getHealingTrainerBonus(trainers: GameState['trainers']): number {
  let bonus = 0;
  for (const t of trainers) {
    if (t.contractWeeksLeft <= 0) continue;
    if (t.focus === 'Healing') {
      bonus += TIER_BONUS[t.tier as keyof typeof TIER_BONUS] ?? 0;
    }
  }
  return bonus;
}
