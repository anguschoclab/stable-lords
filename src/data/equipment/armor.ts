/**
 * Armor data for Stable Lords.
 * Body armor with varying weights and style restrictions.
 */

import { FightingStyle } from '@/types/game';
import type { EquipmentItem } from './equipment.types';

export const ARMORS: EquipmentItem[] = [
  {
    id: 'none_armor',
    code: '',
    name: 'None',
    slot: 'armor',
    weight: 0,
    description: 'No armor. Maximum mobility.',
  },
  {
    id: 'padded',
    code: 'AP',
    name: 'Padded',
    slot: 'armor',
    weight: 2,
    description: 'Quilted cloth armor. Basic protection.',
  },
  {
    id: 'leather',
    code: 'AL',
    name: 'Leather',
    slot: 'armor',
    weight: 4,
    description: 'Cured leather armor. Light and flexible.',
  },
  {
    id: 'studded_leather',
    code: 'AS',
    name: 'Studded Leather',
    slot: 'armor',
    weight: 5,
    description: 'Leather reinforced with metal studs.',
  },
  {
    id: 'ring_mail',
    code: 'AR',
    name: 'Ring Mail',
    slot: 'armor',
    weight: 6,
    description: 'Leather with metal rings sewn on.',
  },
  {
    id: 'scale_mail',
    code: 'ASM',
    name: 'Scalemail',
    slot: 'armor',
    weight: 8,
    description: 'Overlapping metal scales. Heavy.',
  },
  {
    id: 'chain_mail',
    code: 'ACM',
    name: 'Chainmail',
    slot: 'armor',
    weight: 10,
    description: 'Interlocking metal rings. Standard heavy protection.',
  },
  {
    id: 'plate_mail',
    code: 'APM',
    name: 'Platemail',
    slot: 'armor',
    weight: 12,
    description: 'Full plate mail. Very heavy.',
    restrictedStyles: [FightingStyle.AimedBlow, FightingStyle.LungingAttack],
  },
  {
    id: 'plate_armor',
    code: 'APA',
    name: 'Plate Armor',
    slot: 'armor',
    weight: 14,
    description: 'Maximum protection. Extremely heavy.',
    restrictedStyles: [
      FightingStyle.AimedBlow,
      FightingStyle.LungingAttack,
      FightingStyle.SlashingAttack,
    ],
  },
];
