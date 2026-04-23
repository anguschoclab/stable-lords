import { describe, it, expect } from 'vitest';
import { SeededRNG, randomPick, stringToSeed, hashStr } from '@/utils/random';

describe('SeededRNG', () => {
  it('produces deterministic results for the same seed', () => {
    const seed = 12345;
    const rng1 = new SeededRNG(seed);
    const rng2 = new SeededRNG(seed);

    for (let i = 0; i < 10; i++) {
      expect(rng1.roll(0, 100)).toBe(rng2.roll(0, 100));
    }
  });

  it('produces different results for different seeds', () => {
    const rng1 = new SeededRNG(1);
    const rng2 = new SeededRNG(2);

    let identical = true;
    for (let i = 0; i < 10; i++) {
      if (rng1.roll(0, 1) !== rng2.roll(0, 1)) {
        identical = false;
        break;
      }
    }
    expect(identical).toBe(false);
  });

  it('roll(min, max) returns values within range', () => {
    const rng = new SeededRNG(42);
    for (let i = 0; i < 100; i++) {
      const val = rng.roll(5, 15);
      expect(val).toBeGreaterThanOrEqual(5);
      expect(val).toBeLessThanOrEqual(15);
    }
  });

  it('pick(array) returns an element from the array', () => {
    const rng = new SeededRNG(42);
    const arr = ['a', 'b', 'c'];
    for (let i = 0; i < 20; i++) {
      expect(arr).toContain(rng.pick(arr));
    }
  });

  it('chance(probability) works correctly', () => {
    const rng = new SeededRNG(42);
    // chance(1) should always be true, chance(0) always false
    expect(rng.chance(1)).toBe(true);
    expect(rng.chance(0)).toBe(false);
  });
});

describe('randomPick', () => {
  it('works with function-based RNG', () => {
    let counter = 0;
    const rng = () => (counter++ % 3) / 3;
    const arr = ['a', 'b', 'c'];
    const result = randomPick(rng, arr);
    expect(arr).toContain(result);
  });

  it('throws on empty array', () => {
    const rng = () => 0.5;
    expect(() => randomPick(rng, [])).toThrow('Cannot pick from empty array');
  });
});

describe('stringToSeed', () => {
  it('produces consistent seeds for same string', () => {
    const seed1 = stringToSeed('test');
    const seed2 = stringToSeed('test');
    expect(seed1).toBe(seed2);
  });

  it('produces different seeds for different strings', () => {
    const seed1 = stringToSeed('test');
    const seed2 = stringToSeed('different');
    expect(seed1).not.toBe(seed2);
  });

  it('returns positive numbers', () => {
    const seed = stringToSeed('any string');
    expect(seed).toBeGreaterThan(0);
  });
});

describe('hashStr', () => {
  it('produces consistent hashes for same string', () => {
    const hash1 = hashStr('test');
    const hash2 = hashStr('test');
    expect(hash1).toBe(hash2);
  });

  it('produces different hashes for different strings', () => {
    const hash1 = hashStr('test');
    const hash2 = hashStr('different');
    expect(hash1).not.toBe(hash2);
  });

  it('returns 32-bit unsigned integer', () => {
    const hash = hashStr('any string');
    expect(hash).toBeGreaterThanOrEqual(0);
    expect(hash).toBeLessThan(Math.pow(2, 32));
  });
});
