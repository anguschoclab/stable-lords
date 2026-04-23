import { describe, it, expect } from 'vitest';
import { makeFightSummary } from '@/engine/factories/combatFactory';
import { setMockIdGenerator } from '@/utils/idUtils';

describe('combatFactory', () => {
  describe('makeFightSummary', () => {
    it('should generate a default fight summary', () => {
      setMockIdGenerator(() => 'mock-fight-id');
      const summary = makeFightSummary();
      setMockIdGenerator(null);

      expect(summary.id).toBe('mock-fight-id');
      expect(summary.week).toBe(1);
      expect(summary.a).toBe('Attacker');
      expect(summary.d).toBe('Defender');
      expect(summary.warriorIdA).toBe('warrior-a');
      expect(summary.warriorIdD).toBe('warrior-d');
      expect(summary.styleA).toBe('Brawler');
      expect(summary.styleD).toBe('Balanced');
      expect(summary.winner).toBe('A');
      expect(summary.by).toBe('KO');
      expect(summary.title).toBe('Practice Match');
      expect(summary.transcript).toEqual([]);
      expect(typeof summary.createdAt).toBe('string');
      expect(new Date(summary.createdAt).getTime()).not.toBeNaN();
    });

    it('should handle partial overrides', () => {
      const overrides = {
        id: 'custom-fight-id',
        week: 42,
        a: 'Custom Attacker',
        d: 'Custom Defender',
        styleA: 'Speed' as any,
        styleD: 'Power' as any,
        winner: 'D' as const,
        by: 'Kill' as const,
        title: 'Championship Bout',
      };

      const summary = makeFightSummary(overrides);

      expect(summary.id).toBe('custom-fight-id');
      expect(summary.week).toBe(42);
      expect(summary.a).toBe('Custom Attacker');
      expect(summary.d).toBe('Custom Defender');
      expect(summary.styleA).toBe('Speed');
      expect(summary.styleD).toBe('Power');
      expect(summary.winner).toBe('D');
      expect(summary.by).toBe('Kill');
      expect(summary.title).toBe('Championship Bout');
      // ensure defaults are still there for non-overridden fields
      expect(summary.warriorIdA).toBe('warrior-a');
      expect(summary.warriorIdD).toBe('warrior-d');
      expect(summary.transcript).toEqual([]);
    });

    it('should accept a custom createdAt timestamp', () => {
      const customDate = '2024-01-01T00:00:00.000Z';
      const summary = makeFightSummary({}, customDate);

      expect(summary.createdAt).toBe(customDate);
    });
  });
});
