import { describe, it, expect } from 'vitest';
import { random32 } from '../../utils/random';

describe('random32', () => {
  it('should return a number', () => {
    const val = random32();
    expect(typeof val).toBe('number');
  });

  it('should be within the 32-bit unsigned integer range', () => {
    for (let i = 0; i < 100; i++) {
      const val = random32();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(4294967296);
    }
  });
});
