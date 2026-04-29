/**
 * Tests for the traits system wiring (added 2026-04).
 * Verifies trait generation, static mod summing, and conditional mod evaluation.
 */
import { describe, it, expect } from 'vitest';
import {
  TRAITS,
  generateTraits,
  getStaticTraitMods,
  getDynamicTraitMods,
} from '@/engine/traits';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import type { Warrior } from '@/types/warrior.types';

function mockWarrior(traits: string[]): Warrior {
  return { traits } as unknown as Warrior;
}

describe('Warrior Traits', () => {
  describe('generateTraits', () => {
    it('produces 0-2 traits per warrior', () => {
      for (let seed = 1; seed < 100; seed++) {
        const rng = new SeededRNGService(seed);
        const traits = generateTraits(rng);
        expect(traits.length).toBeGreaterThanOrEqual(0);
        expect(traits.length).toBeLessThanOrEqual(2);
        for (const t of traits) expect(TRAITS[t]).toBeDefined();
      }
    });

    it('does not pick the same trait twice for one warrior', () => {
      for (let seed = 1; seed < 100; seed++) {
        const rng = new SeededRNGService(seed);
        const traits = generateTraits(rng);
        expect(new Set(traits).size).toBe(traits.length);
      }
    });

    it('is deterministic for a given seed', () => {
      const a = generateTraits(new SeededRNGService(42));
      const b = generateTraits(new SeededRNGService(42));
      expect(a).toEqual(b);
    });
  });

  describe('getStaticTraitMods', () => {
    it('returns zero mods for a warrior with no traits', () => {
      const mods = getStaticTraitMods(mockWarrior([]));
      expect(mods.attMod).toBe(0);
      expect(mods.parMod).toBe(0);
      expect(mods.defMod).toBe(0);
      expect(mods.iniMod).toBe(0);
      expect(mods.ripMod).toBe(0);
      expect(mods.decMod).toBe(0);
      expect(mods.dmgBonus).toBe(0);
      expect(mods.enduranceMult).toBe(1);
    });

    it('applies Quick (+1 INI)', () => {
      const mods = getStaticTraitMods(mockWarrior(['quick']));
      expect(mods.iniMod).toBe(1);
    });

    it('stacks multiple static traits additively', () => {
      const mods = getStaticTraitMods(mockWarrior(['quick', 'agile']));
      expect(mods.iniMod).toBe(1); // Quick
      expect(mods.defMod).toBe(1); // Agile
    });

    it('multiplies enduranceMult', () => {
      const mods = getStaticTraitMods(mockWarrior(['ironlung']));
      expect(mods.enduranceMult).toBeCloseTo(0.92);
    });

    it('ignores unknown trait ids gracefully', () => {
      const mods = getStaticTraitMods(mockWarrior(['no_such_trait']));
      expect(mods.iniMod).toBe(0);
    });
  });

  describe('getDynamicTraitMods', () => {
    const baseCtx = { phase: 'OPENING' as const, hpRatio: 1.0, endRatio: 1.0, consecutiveHits: 0 };

    it('Berserker: +2 ATT only when HP < 50%', () => {
      const fresh = getDynamicTraitMods(mockWarrior(['berserker']), { ...baseCtx, hpRatio: 0.8 });
      expect(fresh.attMod).toBe(0);
      const bloodied = getDynamicTraitMods(mockWarrior(['berserker']), { ...baseCtx, hpRatio: 0.4 });
      expect(bloodied.attMod).toBe(2);
    });

    it('Patient: +2 DEF only in OPENING phase', () => {
      const opening = getDynamicTraitMods(mockWarrior(['patient']), { ...baseCtx, phase: 'OPENING' });
      expect(opening.defMod).toBe(2);
      const late = getDynamicTraitMods(mockWarrior(['patient']), { ...baseCtx, phase: 'LATE' });
      expect(late.defMod).toBe(0);
    });

    it('Stalwart: +2 PAR only when HP > 75%', () => {
      const high = getDynamicTraitMods(mockWarrior(['stalwart']), { ...baseCtx, hpRatio: 0.9 });
      expect(high.parMod).toBe(2);
      const mid = getDynamicTraitMods(mockWarrior(['stalwart']), { ...baseCtx, hpRatio: 0.5 });
      expect(mid.parMod).toBe(0);
    });

    it('Combo Artist: +1 ATT only when consecutiveHits >= 2', () => {
      const cold = getDynamicTraitMods(mockWarrior(['combo_artist']), { ...baseCtx, consecutiveHits: 1 });
      expect(cold.attMod).toBe(0);
      const hot = getDynamicTraitMods(mockWarrior(['combo_artist']), { ...baseCtx, consecutiveHits: 2 });
      expect(hot.attMod).toBe(1);
    });

    it('Bloodthirsty: always adds killWindowBonus', () => {
      const mods = getDynamicTraitMods(mockWarrior(['bloodthirsty']), baseCtx);
      expect(mods.killWindowBonus).toBeCloseTo(0.005);
    });
  });
});
