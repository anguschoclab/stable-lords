/**
 * Stable template type definitions for Stable Lords.
 */

import { FightingStyle, OwnerPersonality, MetaAdaptation } from '@/types/game';
import type { BackstoryId } from '@/data/backstories';

export interface StableTemplate {
  stableName: string;
  motto: string;
  origin: string;
  ownerName: string;
  personality: OwnerPersonality;
  philosophy:
    | 'Brute Force'
    | 'Speed Kills'
    | 'Iron Defense'
    | 'Balanced'
    | 'Spectacle'
    | 'Cunning'
    | 'Endurance'
    | 'Specialist';
  preferredStyles: FightingStyle[];
  attrBias: Partial<Record<'ST' | 'CN' | 'SZ' | 'WT' | 'WL' | 'SP' | 'DF', number>>;
  warriorNames: string[];
  fameRange: [number, number];
  rosterRange: [number, number];
  tier: 'Minor' | 'Established' | 'Major' | 'Legendary';
  trainerRange: [number, number];
  /** How this owner reacts to meta shifts */
  metaAdaptation: MetaAdaptation;
  /** Who the owner was before founding the stable. Orthogonal to stable archetype. */
  backstoryId: BackstoryId;
}

export type StableTier = 'Minor' | 'Established' | 'Major' | 'Legendary';

export type StablePhilosophy =
  | 'Brute Force'
  | 'Speed Kills'
  | 'Iron Defense'
  | 'Balanced'
  | 'Spectacle'
  | 'Cunning'
  | 'Endurance'
  | 'Specialist';
