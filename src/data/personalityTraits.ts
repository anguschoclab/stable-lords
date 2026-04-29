import type { Attributes } from '@/types/game';
import type { FightPlan } from '@/types/shared.types';

export interface PersonalityTraitData {
  id: string;
  modifiers: Partial<FightPlan>;
  attrBonus?: Partial<Attributes>;
  description: string;
}

export const PERSONALITY_TRAIT_DATA: Record<string, PersonalityTraitData> = {
  Aggressive: {
    id: 'Aggressive',
    modifiers: { OE: 4, AL: -2, killDesire: 5 },
    attrBonus: { ST: 1, WL: 1 },
    description: 'Fights with reckless abandon, favoring strength over defense.',
  },
  Disciplined: {
    id: 'Disciplined',
    modifiers: { AL: 3, OE: -1, feintTendency: 5 },
    attrBonus: { DF: 1, WL: 1 },
    description: 'Calm and focused, waiting for the perfect moment to strike.',
  },
  Cunning: {
    id: 'Cunning',
    modifiers: { feintTendency: 10, AL: 2, killDesire: -2 },
    attrBonus: { SP: 1, DF: 1 },
    description: 'Favors trickery and misdirection to find the killing blow.',
  },
  Sturdy: {
    id: 'Sturdy',
    modifiers: { AL: -3, OE: -2, killDesire: -5 },
    attrBonus: { CN: 1, SZ: 1 },
    description: 'An unbreakable wall that outlasts any opponent.',
  },
  Feral: {
    id: 'Feral',
    modifiers: { OE: 6, AL: -4, killDesire: 10 },
    attrBonus: { ST: 1, SP: 1 },
    description: 'Fights with a savage, unpredictable intensity.',
  },
  Merciless: {
    id: 'Merciless',
    modifiers: { killDesire: 15, OE: 2 },
    attrBonus: { ST: 1, WL: 1 },
    description: 'Relentlessly pursues the kill, ignoring all distractions.',
  },
  Calculated: {
    id: 'Calculated',
    modifiers: { feintTendency: 8, AL: 4, OE: -3 },
    attrBonus: { SP: 1, DF: 1 },
    description: 'Every move is a deliberate setup for a final strike.',
  },
  Resilient: {
    id: 'Resilient',
    modifiers: { AL: -2, killDesire: -8 },
    attrBonus: { CN: 2 },
    description: 'Absorbs punishment that would fell a lesser warrior.',
  },
  Evasive: {
    id: 'Evasive',
    modifiers: { AL: 10, OE: -5, feintTendency: 5 },
    attrBonus: { SP: 2 },
    description: 'A ghost on the sand, near-impossible to pin down.',
  },
  Brutal: {
    id: 'Brutal',
    modifiers: { OE: 8, killDesire: 5, AL: -5 },
    attrBonus: { ST: 2 },
    description: 'Values raw power and crushing impact above all else.',
  },
};

export const PERSONALITY_TRAITS = Object.keys(PERSONALITY_TRAIT_DATA);
