/**
 * RNG Service Interface
 * Provides a contract for random number generation, enabling
 * dependency injection and testability.
 */
export interface IRNGService {
  /**
   * Returns a random number between 0 (inclusive) and 1 (exclusive).
   */
  next(): number;

  /**
   * Picks a random element from an array.
   */
  pick<T>(array: T[]): T;

  /**
   * Generates a unique ID with an optional prefix.
   */
  uuid(prefix?: string): string;

  /**
   * Returns a random integer between min (inclusive) and max (inclusive).
   */
  roll(min: number, max: number): number;

  /**
   * Shuffles an array in place and returns it.
   */
  shuffle<T>(array: T[]): T[];

  /**
   * Weighted random selection from items array.
   */
  pickWeighted<T>(items: T[], weights: number[]): T;

  /**
   * Returns true with given probability (0-1).
   */
  chance(probability: number): boolean;
}
