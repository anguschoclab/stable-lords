/**
 * Rival Warrior Factory - Generates warriors for rival stables
 * Extracted from rivals.ts to follow SRP
 */
import type { Attributes } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { FightingStyle } from '@/types/shared.types';
import { makeWarrior } from '../factories/warriorFactory';

/**
 * Generates biased attributes based on a bias configuration.
 * Used to create warriors with preferred stat distributions.
 */
export function biasedAttrs(
  rng: () => number,
  bias: Record<string, number>,
  catchupPool: number = 0
): Attributes {
  const attrs = { ST: 3, CN: 3, SZ: 3, WT: 3, WL: 3, SP: 3, DF: 3 };
  let pool = 70 - 21 + catchupPool;
  const weighted: (keyof typeof attrs)[] = [];
  for (const k of Object.keys(attrs) as (keyof typeof attrs)[]) {
    const w = bias[k] ?? 1;
    for (let i = 0; i < w; i++) weighted.push(k);
  }
  while (pool > 0) {
    const idx = Math.floor(rng() * weighted.length);
    const key = weighted[idx];
    if (key === undefined) {
      throw new Error('Attribute key selection out of bounds');
    }
    const currentVal = attrs[key];
    if (currentVal === undefined) {
      throw new Error('Attribute value not found');
    }
    const add = Math.min(pool, 25 - currentVal, Math.floor(rng() * 4) + 1);
    if (add <= 0) continue;
    attrs[key] = currentVal + add;
    pool -= add;
  }
  return attrs;
}

/**
 * Creates a warrior for a rival stable with proper RNG wrapper.
 */
export function createRivalWarrior(
  wId: string,
  wName: string,
  style: FightingStyle,
  attrs: Attributes,
  stableId: string,
  fameRange: [number, number],
  rng: SeededRNGService
): Warrior {
  // Create a wrapper object compatible with SeededRNG for makeWarrior
  const rngWrapper: IRNGService = {
    next: () => rng.next(),
    pick: <T>(arr: T[]): T => {
      if (arr.length === 0) throw new Error('Cannot pick from empty array');
      const idx = Math.floor(rng.next() * arr.length);
      const item = arr[idx];
      if (item === undefined) {
        throw new Error('RNG pick returned undefined');
      }
      return item;
    },
    roll: (min: number, max: number) => Math.floor(rng.next() * (max - min + 1)) + min,
    uuid: () => crypto.randomUUID(),
    chance: (p: number) => rng.next() < p,
    shuffle: <T>(arr: T[]): T[] => {
      const shuffled = [...arr];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rng.next() * (i + 1));
        const tempI = shuffled[i];
        const tempJ = shuffled[j];
        if (tempI === undefined || tempJ === undefined) {
          throw new Error('Shuffle index out of bounds');
        }
        shuffled[i] = tempJ;
        shuffled[j] = tempI;
      }
      return shuffled;
    },
    pickWeighted: <T>(items: T[], weights: number[]): T => {
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      const random = rng.next() * totalWeight;
      let cumulative = 0;
      for (let i = 0; i < items.length; i++) {
        const weight = weights[i];
        if (weight === undefined) {
          throw new Error('Weight index out of bounds');
        }
        cumulative += weight;
        if (random < cumulative) {
          const item = items[i];
          if (item === undefined) {
            throw new Error('Item index out of bounds');
          }
          return item;
        }
      }
      const fallback = items[items.length - 1];
      if (fallback === undefined) {
        throw new Error('No items available for weighted pick');
      }
      return fallback;
    },
  };

  return makeWarrior(
    wId,
    wName,
    style,
    attrs,
    {
      fame: Math.floor(rng.next() * (fameRange[1] - fameRange[0] + 1)) + fameRange[0],
      popularity: Math.floor(rng.next() * 5),
      stableId,
    },
    rngWrapper
  );
}
