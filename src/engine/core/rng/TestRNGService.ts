import { IRNGService } from "./IRNGService";

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
    if (this.nextValues.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return this.nextValues.shift()!;
    }
    return 0.5; // Default deterministic value
  }

  pick<T>(array: T[]): T {
    this.callCount++;
    if (this.nextValues.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const index = Math.floor(this.nextValues.shift()! * array.length);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return array[index]!;
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return array[0]!; // Default to first element
  }

  uuid(prefix?: string): string {
    this.callCount++;
    return `${prefix || 'test'}-${this.callCount}`;
  }

  roll(min: number, max: number): number {
    this.callCount++;
    if (this.nextValues.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const value = this.nextValues.shift()!;
      return min + Math.floor(value * (max - min));
    }
    return min; // Default to min
  }

  shuffle<T>(array: T[]): T[] {
    this.callCount++;
    // Return a copy of the array (no shuffling for deterministic tests)
    return [...array];
  }
}
