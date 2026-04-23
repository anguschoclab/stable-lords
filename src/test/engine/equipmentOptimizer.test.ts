import { describe, it, expect } from 'vitest';
import { generateRecommendations, getStyleEquipmentTips } from '@/engine/equipmentOptimizer';
import { FightingStyle } from '@/types/shared.types';

describe('Equipment Optimizer', () => {
  describe('generateRecommendations', () => {
    it('should generate recommendations for Aimed Blow style', () => {
      const recommendations = generateRecommendations(FightingStyle.AimedBlow, 10);
      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toHaveProperty('loadout');
      expect(recommendations[0]).toHaveProperty('label');
      expect(recommendations[0]).toHaveProperty('synergy');
    });

    it('should generate recommendations for Bashing Attack style', () => {
      const recommendations = generateRecommendations(FightingStyle.BashingAttack, 12);
      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should generate recommendations for Total Parry style', () => {
      const recommendations = generateRecommendations(FightingStyle.TotalParry, 15);
      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should include preferred weapon in loadout', () => {
      const recommendations = generateRecommendations(FightingStyle.AimedBlow, 10);
      const rec = recommendations[0];
      if (rec) {
        expect(rec.breakdown.weapon.preferred).toBe(true);
      }
    });

    it('should calculate synergy score correctly', () => {
      const recommendations = generateRecommendations(FightingStyle.AimedBlow, 10);
      const rec = recommendations[0];
      if (rec) {
        expect(rec.synergy).toBeGreaterThanOrEqual(0);
        expect(rec.synergy).toBeLessThanOrEqual(100);
      }
    });

    it('should calculate total weight correctly', () => {
      const recommendations = generateRecommendations(FightingStyle.AimedBlow, 10);
      const rec = recommendations[0];
      if (rec) {
        expect(rec.totalWeight).toBeGreaterThan(0);
      }
    });
  });

  describe('getStyleEquipmentTips', () => {
    it('should return tips for Aimed Blow style', () => {
      const tips = getStyleEquipmentTips(FightingStyle.AimedBlow);
      expect(tips).toBeDefined();
      expect(Array.isArray(tips)).toBe(true);
      expect(tips.length).toBeGreaterThan(0);
    });

    it('should return tips for Bashing Attack style', () => {
      const tips = getStyleEquipmentTips(FightingStyle.BashingAttack);
      expect(tips).toBeDefined();
      expect(Array.isArray(tips)).toBe(true);
      expect(tips.length).toBeGreaterThan(0);
    });

    it('should return tips for Total Parry style', () => {
      const tips = getStyleEquipmentTips(FightingStyle.TotalParry);
      expect(tips).toBeDefined();
      expect(Array.isArray(tips)).toBe(true);
      expect(tips.length).toBeGreaterThan(0);
    });

    it('should return relevant tips about weapon preferences', () => {
      const tips = getStyleEquipmentTips(FightingStyle.AimedBlow);
      const hasWeaponTip = tips.some(
        (tip) =>
          tip.toLowerCase().includes('weapon') ||
          tip.toLowerCase().includes('dagger') ||
          tip.toLowerCase().includes('epée')
      );
      expect(hasWeaponTip).toBe(true);
    });

    it('should return relevant tips about armor', () => {
      const tips = getStyleEquipmentTips(FightingStyle.AimedBlow);
      const hasArmorTip = tips.some((tip) => tip.toLowerCase().includes('armor'));
      expect(hasArmorTip).toBe(true);
    });
  });
});
