import { SeededRNG } from "@/utils/random";
import { IRNGService } from "./IRNGService";

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
}
