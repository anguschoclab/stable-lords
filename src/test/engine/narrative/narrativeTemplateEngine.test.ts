import { describe, it, expect } from 'vitest';
import {
  NarrativeTemplateEngine,
  type CombatContext,
} from '@/engine/narrative/narrativeTemplateEngine';

describe('NarrativeTemplateEngine', () => {
  describe('interpolateTemplate', () => {
    it('should replace %A token with attacker name', () => {
      const template = '%A attacks fiercely.';
      const ctx: CombatContext = { attacker: 'Thor' };
      const result = NarrativeTemplateEngine.interpolateTemplate(template, ctx);
      expect(result).toBe('Thor attacks fiercely.');
    });

    it('should replace %D token with defender name', () => {
      const template = '%D defends bravely.';
      const ctx: CombatContext = { defender: 'Loki' };
      const result = NarrativeTemplateEngine.interpolateTemplate(template, ctx);
      expect(result).toBe('Loki defends bravely.');
    });

    it('should replace %W token with weapon name', () => {
      const template = '%A strikes with %W.';
      const ctx: CombatContext = { attacker: 'Thor', weapon: 'HAMMER' };
      const result = NarrativeTemplateEngine.interpolateTemplate(template, ctx);
      expect(result).toBe('Thor strikes with HAMMER.');
    });

    it('should replace %BP token with body part', () => {
      const template = 'Hits %BP squarely.';
      const ctx: CombatContext = { bodyPart: 'CHEST' };
      const result = NarrativeTemplateEngine.interpolateTemplate(template, ctx);
      expect(result).toBe('Hits CHEST squarely.');
    });

    it('should replace %H token with hits count', () => {
      const template = 'The bout lasted %H minutes.';
      const ctx: CombatContext = { hits: 15 };
      const result = NarrativeTemplateEngine.interpolateTemplate(template, ctx);
      expect(result).toBe('The bout lasted 15 minutes.');
    });

    it('should replace multiple tokens', () => {
      const template = '%A strikes %D in the %BP with %W.';
      const ctx: CombatContext = {
        attacker: 'Thor',
        defender: 'Loki',
        bodyPart: 'HEAD',
        weapon: 'HAMMER',
      };
      const result = NarrativeTemplateEngine.interpolateTemplate(template, ctx);
      expect(result).toBe('Thor strikes Loki in the HEAD with HAMMER.');
    });

    it('should fall back to default for missing attacker', () => {
      const template = '%A attacks.';
      const ctx: CombatContext = {};
      const result = NarrativeTemplateEngine.interpolateTemplate(template, ctx);
      expect(result).toBe('The warrior attacks.');
    });

    it('should fall back to default for missing defender', () => {
      const template = '%A attacks %D.';
      const ctx: CombatContext = { attacker: 'Thor' };
      const result = NarrativeTemplateEngine.interpolateTemplate(template, ctx);
      expect(result).toBe('Thor attacks the opponent.');
    });

    it('should fall back to default for missing weapon', () => {
      const template = '%A uses %W.';
      const ctx: CombatContext = { attacker: 'Thor' };
      const result = NarrativeTemplateEngine.interpolateTemplate(template, ctx);
      expect(result).toBe('Thor uses weapon.');
    });

    it('should fall back to default for missing body part', () => {
      const template = 'Hits %BP.';
      const ctx: CombatContext = {};
      const result = NarrativeTemplateEngine.interpolateTemplate(template, ctx);
      expect(result).toBe('Hits body.');
    });

    it('should use name as fallback for attacker', () => {
      const template = '%A attacks.';
      const ctx: CombatContext = { name: 'Warrior' };
      const result = NarrativeTemplateEngine.interpolateTemplate(template, ctx);
      expect(result).toBe('Warrior attacks.');
    });
  });

  describe('getFromArchive', () => {
    it('should retrieve template from valid path', () => {
      const template = NarrativeTemplateEngine.getFromArchive(() => 0.5, ['pbp', 'openers']);
      expect(template).toBeDefined();
      expect(typeof template).toBe('string');
    });

    it('should return fallback for invalid path', () => {
      const template = NarrativeTemplateEngine.getFromArchive(() => 0.5, ['invalid', 'path']);
      expect(template).toBe('A fierce exchange occurs.');
    });

    it('should return fallback for missing template', () => {
      const template = NarrativeTemplateEngine.getFromArchive(() => 0.5, ['pbp', 'nonexistent']);
      expect(template).toBe('A fierce exchange occurs.');
    });

    it('should handle empty path array', () => {
      const template = NarrativeTemplateEngine.getFromArchive(() => 0.5, []);
      expect(template).toBe('A fierce exchange occurs.');
    });
  });
});
