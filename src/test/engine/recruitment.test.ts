import { describe, it, expect } from 'vitest';
import {
  generateRecruit,
  generateRecruitPool,
  partialRefreshPool,
  fullRefreshPool,
  DEFAULT_POOL_SIZE
} from '@/engine/recruitment';
import { SeededRNG } from '@/utils/random';

describe('Recruitment Engine', () => {
  describe('generateRecruit', () => {
    it('should generate a valid recruit with all required properties', () => {
      const rng = new SeededRNG(42);
      const usedNames = new Set<string>();
      const week = 1;

      const recruit = generateRecruit(rng, usedNames, week);

      expect(recruit).toBeDefined();
      expect(recruit.id).toBeDefined();
      expect(typeof recruit.id).toBe('string');
      expect(recruit.name).toBeDefined();
      expect(typeof recruit.name).toBe('string');
      expect(recruit.style).toBeDefined();
      expect(recruit.attributes).toBeDefined();
      expect(recruit.potential).toBeDefined();
      expect(recruit.baseSkills).toBeDefined();
      expect(recruit.derivedStats).toBeDefined();
      expect(recruit.tier).toBeDefined();
      expect(recruit.cost).toBeGreaterThan(0);
      expect(recruit.age).toBeGreaterThanOrEqual(16);
      expect(recruit.age).toBeLessThanOrEqual(21);
      expect(recruit.lore).toBeDefined();
      expect(recruit.addedWeek).toBe(week);
      expect(recruit.favorites).toBeDefined();

      // Name should be added to usedNames set
      expect(usedNames.has(recruit.name)).toBe(true);
    });

    it('should respect the forceTier parameter when provided', () => {
      const rng = new SeededRNG(42);
      const usedNames = new Set<string>();

      const prodigy = generateRecruit(rng, usedNames, 1, 'Prodigy');
      expect(prodigy.tier).toBe('Prodigy');

      const common = generateRecruit(rng, usedNames, 1, 'Common');
      expect(common.tier).toBe('Common');
    });

    it('should generate unique names', () => {
      const rng = new SeededRNG(42);
      const usedNames = new Set<string>();

      const recruit1 = generateRecruit(rng, usedNames, 1);
      const recruit2 = generateRecruit(rng, usedNames, 1);

      expect(recruit1.name).not.toBe(recruit2.name);
      expect(usedNames.has(recruit1.name)).toBe(true);
      expect(usedNames.has(recruit2.name)).toBe(true);
    });
  });

  describe('generateRecruitPool', () => {
    it('should generate a pool of the default size', () => {
      const usedNames = new Set<string>();
      const week = 1;

      const pool = generateRecruitPool(DEFAULT_POOL_SIZE, week, usedNames);

      expect(pool.length).toBe(DEFAULT_POOL_SIZE);
      // It should guarantee at least two Promising+ warriors
      const promisingPlus = pool.filter(w => ['Promising', 'Exceptional', 'Prodigy'].includes(w.tier));
      expect(promisingPlus.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('partialRefreshPool', () => {
    it('should remove a subset of older recruits and replace them', () => {
      const usedNames = new Set<string>();
      // Generate initial pool
      const initialPool = generateRecruitPool(DEFAULT_POOL_SIZE, 1, usedNames);

      // Partial refresh at week 2
      const refreshedPool = partialRefreshPool(initialPool, 2, usedNames);

      expect(refreshedPool.length).toBe(DEFAULT_POOL_SIZE);

      // Count how many are from week 2
      const newRecruits = refreshedPool.filter(w => w.addedWeek === 2);
      expect(newRecruits.length).toBeGreaterThanOrEqual(2);
      expect(newRecruits.length).toBeLessThanOrEqual(4);
    });
  });

  describe('fullRefreshPool', () => {
    it('should completely replace the pool', () => {
      const usedNames = new Set<string>();
      const pool = fullRefreshPool(2, usedNames);

      expect(pool.length).toBe(DEFAULT_POOL_SIZE);
      expect(pool.every(w => w.addedWeek === 2)).toBe(true);
    });
  });
});
