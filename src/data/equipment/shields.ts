/**
 * Shield data for Stable Lords.
 * Offhand shields for the shield slot.
 * NOTE: In canonical Duelmasters, shields are listed alongside weapons.
 * Small Shield, Medium Shield, and Large Shield appear in the weapons list above.
 * This array provides "no shield" for the offhand slot when using a one-handed weapon
 * without a shield, or when the weapon IS a shield.
 */

import type { EquipmentItem } from './equipment.types';

export const SHIELDS: EquipmentItem[] = [
  {
    id: 'none_shield',
    code: '',
    name: 'None',
    slot: 'shield',
    weight: 0,
    description: 'No shield. Free off-hand.',
  },
];
