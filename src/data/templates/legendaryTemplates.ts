/**
 * Legendary stable templates for Stable Lords.
 * The most prestigious and powerful stables in the arena.
 */

import { FightingStyle } from '@/types/game';
import type { StableTemplate } from './stableTemplate.types';

export const LEGENDARY_TEMPLATES: StableTemplate[] = [
  {
    stableName: 'The Eternal Colosseum',
    motto: 'We were here before the sand, we will be here after.',
    origin:
      'The oldest fighting stable in recorded history. Backed by ancient wealth and generational knowledge, they have produced more champions than any other house.',
    ownerName: 'Aurelius Dominus',
    personality: 'Methodical',
    philosophy: 'Balanced',
    preferredStyles: [
      FightingStyle.ParryRiposte,
      FightingStyle.WallOfSteel,
      FightingStyle.StrikingAttack,
      FightingStyle.AimedBlow,
    ],
    attrBias: { ST: 2, CN: 2, WT: 2, WL: 2, SP: 1, DF: 1 },
    warriorNames: [
      'IMPERATOR',
      'DOMINUS',
      'PRAETOR',
      'CENTURION',
      'MAXIMUS',
      'AURELIUS',
      'LEGATUS',
      'TRIBUNE',
      'CONSUL',
      'DECANUS',
      'CAESAR',
      'NERO',
    ],
    fameRange: [6, 10],
    rosterRange: [8, 12],
    tier: 'Legendary',
    trainerRange: [4, 5],
    metaAdaptation: 'Traditionalist', // Ancient house, sticks to proven methods
    backstoryId: 'gladiator',
  },
];
