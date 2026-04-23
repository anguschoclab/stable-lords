import { SeededRNG } from '@/utils/random';
import { IRNGService } from './IRNGService';

/**
 * SeededRNG Service Implementation
 * Wraps the existing SeededRNG class to implement the IRNGService interface.
 * This enables dependency injection while maintaining deterministic behavior.
 */
export class SeededRNGService implements IRNGService {
  private rng: SeededRNG;

  constructor(seed: number) {
    this.rng = new SeededRNG(seed);
  }

  next(): number {
    return this.rng.next();
  }

  pick<T>(array: T[]): T {
    return this.rng.pick(array);
  }

  uuid(prefix?: string): string {
    return this.rng.uuid(prefix);
  }

  roll(min: number, max: number): number {
    return this.rng.roll(min, max);
  }

  shuffle<T>(array: T[]): T[] {
    return this.rng.shuffle(array);
  }

  pickWeighted<T>(items: T[], weights: number[]): T {
    if (items.length !== weights.length) {
      throw new Error('Items and weights must have same length');
    }
    if (items.length === 0) throw new Error('Cannot pick from empty array');
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = this.rng.next() * totalWeight;
    for (let i = 0; i < items.length; i++) {
      random -= weights[i]!;
      if (random <= 0) return items[i]!;
    }
    return items[items.length - 1]!;
  }

  chance(probability: number): boolean {
    return this.rng.next() < probability;
  }
}
