import { IRNGService } from './IRNGService';

/**
 * Test RNG Service Implementation
 * Provides deterministic, controllable random number generation for testing.
 * Allows setting specific return values and tracking call counts.
 */
export class TestRNGService implements IRNGService {
  private nextValues: number[] = [];
  private callCount = 0;

  /**
   * Sets the sequence of values to return from next() calls.
   */
  setNextValues(values: number[]): void {
    this.nextValues = [...values];
  }

  /**
   * Gets the number of times next() has been called.
   */
  getCallCount(): number {
    return this.callCount;
  }

  /**
   * Resets the call counter.
   */
  resetCallCount(): void {
    this.callCount = 0;
  }

  next(): number {
    this.callCount++;
    const v = this.nextValues.shift();
    if (v !== undefined) return v;
    return 0.5; // Default deterministic value
  }

  pick<T>(array: T[]): T {
    this.callCount++;
    const v = this.nextValues.shift();
    if (v !== undefined) {
      const index = Math.floor(v * array.length);
      return array[index] || array[0];
    }
    return array[0]; // Default to first element
  }

  uuid(prefix?: string): string {
    this.callCount++;
    return `${prefix || 'test'}-${this.callCount}`;
  }

  roll(min: number, max: number): number {
    this.callCount++;
    const v = this.nextValues.shift();
    if (v !== undefined) {
      return min + Math.floor(v * (max - min + 1));
    }
    return min; // Default to min
  }

  pickWeighted<T>(items: T[], weights: number[]): T {
    this.callCount++;
    if (items.length === 0) throw new Error('Cannot pick from empty array');
    return items[0]!;
  }

  chance(probability: number): boolean {
    return this.next() < probability;
  }

  shuffle<T>(array: T[]): T[] {
    this.callCount++;
    // Return a copy of the array (no shuffling for deterministic tests)
    return [...array];
  }
}
