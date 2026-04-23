/**
 * Warrior Factory - Creates warriors with calculated stats and favorites
 * Extracted from factories.ts to follow SRP
 */
import type { Warrior } from '@/types/state.types';
import { FightingStyle, type WarriorId } from '@/types/shared.types';
import { computeWarriorStats } from '@/engine/skillCalc';
import { generateFavorites } from '@/engine/favorites';
import { generateId } from '@/utils/idUtils';
import type { IRNGService } from '@/engine/core/rng/IRNGService';

/**
 * Creates a new warrior with calculated stats and favorites.
 *
 * @param id - Optional ID (if not provided, one will be generated)
 * @param name - Warrior name
 * @param style - Fighting style
 * @param attrs - Base attributes
 * @param overrides - Partial warrior properties to override defaults
 * @param rng - Optional SeededRNG for deterministic generation
 */
export function makeWarrior(
  id: WarriorId | undefined,
  name: string,
  style: FightingStyle,
  attrs: { ST: number; CN: number; SZ: number; WT: number; WL: number; SP: number; DF: number },
  overrides?: Partial<Warrior>,
  rng?: IRNGService
): Warrior {
  const { baseSkills, derivedStats } = computeWarriorStats(attrs, style);
  const favorites = generateFavorites(style, rng ? () => rng.next() : () => 0.5);

  return {
    id: id ?? (rng ? (rng.uuid() as WarriorId) : (generateId(undefined, 'warrior') as WarriorId)),
    name,
    style,
    attributes: attrs,
    baseSkills,
    derivedStats,
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: 'Active',
    age: 18 + Math.floor((rng ? rng.next() : 0.5) * 8),
    favorites,
    traits: overrides?.traits ?? [],
    lore: overrides?.lore ?? '',
    origin: overrides?.origin ?? '',
    ...overrides,
  };
}
