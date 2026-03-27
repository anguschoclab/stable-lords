import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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

  describe('error handling', () => {
    let originalCrypto: any;

    beforeEach(() => {
      originalCrypto = (globalThis as any).crypto;
    });

    afterEach(() => {
      vi.restoreAllMocks();
      Object.defineProperty(globalThis, 'crypto', {
        value: originalCrypto,
        writable: true,
        configurable: true,
      });
    });

    it('should throw an error if crypto is undefined', () => {
      Object.defineProperty(globalThis, 'crypto', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      expect(() => random32()).toThrow('Secure random number generator not available in this environment.');
    });

    it('should throw an error if crypto.getRandomValues is undefined', () => {
      Object.defineProperty(globalThis, 'crypto', {
        value: { getRandomValues: undefined },
        writable: true,
        configurable: true,
      });
      expect(() => random32()).toThrow('Secure random number generator not available in this environment.');
    });
  });
});
