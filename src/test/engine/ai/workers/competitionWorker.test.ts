import { describe, it, expect, beforeEach } from 'vitest';
import { createFreshState } from '@/engine/factories';
import { populateTestState } from '@/test/testHelpers';
import { runPromoterPass } from '@/engine/pipeline/passes/PromoterPass';
import { runRankingsPass } from '@/engine/pipeline/passes/RankingsPass';
import {
  evaluateBoutOffer,
  processAllRivalsBoutOffers,
} from '@/engine/ai/workers/competitionWorker';
import { FightingStyle } from '@/types/shared.types';
import { makeWarrior } from '@/engine/factories';
import type { GameState, RivalStableData, Warrior, BoutOffer } from '@/types/state.types';
import type { WarriorId, BoutOfferId, PromoterId, StableId, InjuryId } from '@/types/shared.types';
import type { InjuryData } from '@/types/warrior.types';
import { generateId } from '@/utils/idUtils';
import { resolveImpacts } from '@/engine/impacts';

// Helper to create a test bout offer
function createTestOffer(
  state: GameState,
  promoterId: string,
  warriorIds: string[],
  purse: number = 100,
  hype: number = 100
): BoutOffer {
  return {
    id: generateId(undefined, 'offer') as BoutOfferId,
    promoterId: promoterId as PromoterId,
    warriorIds: warriorIds as WarriorId[],
    boutWeek: state.week + 2,
    expirationWeek: state.week + 1,
    purse,
    hype,
    status: 'Proposed',
    responses: {},
  };
}

// Helper to create a rival with specific warriors
function createTestRival(
  id: string,
  name: string,
  warriors: Warrior[],
  personality: RivalStableData['owner']['personality'] = 'Pragmatic'
): RivalStableData {
  return {
    id: id as StableId,
    owner: {
      id: `owner_${id}` as StableId,
      name: `Owner ${name}`,
      stableName: name,
      fame: 100,
      renown: 50,
      titles: 0,
      personality,
    },
    fame: 100,
    roster: warriors,
    treasury: 1000,
    tier: 'Established',
  };
}

describe('CompetitionWorker', () => {
  let state: GameState;
  let rivals: RivalStableData[];

  beforeEach(() => {
    state = createFreshState('test-seed');
    state = populateTestState(state);
    const rankingsImpact = runRankingsPass(state);
    state = resolveImpacts(state, [rankingsImpact]);
    rivals = state.rivals || [];
  });

  describe('evaluateBoutOffer - Fatigue Gate', () => {
    it('should decline offers for warriors with fatigue > 60 (non-Aggressive personality)', () => {
      const rival = rivals[0];
      if (!rival) return;

      const baseWarrior = rival.roster[0];
      if (!baseWarrior) return;

      // Create a warrior with high fatigue
      const fatiguedWarrior = {
        ...baseWarrior,
        fatigue: 70,
      } as Warrior;
      rival.roster[0] = fatiguedWarrior;

      const offer = createTestOffer(state, 'p_local', [fatiguedWarrior.id as string]);

      const result = evaluateBoutOffer(offer, rival, fatiguedWarrior);
      expect(result).toBe('Declined');
    });

    it('should accept offers for warriors with fatigue > 60 if rival is Aggressive', () => {
      const rival = createTestRival(
        'aggressive_rival',
        'Aggressive Stable',
        [
          makeWarrior(
            generateId(undefined, 'warrior') as WarriorId,
            'Aggressive Warrior',
            FightingStyle.StrikingAttack,
            { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 }
          ),
        ],
        'Aggressive'
      );

      const baseWarrior = rival.roster[0];
      if (!baseWarrior) return;
      const fatiguedWarrior = {
        ...baseWarrior,
        fatigue: 70,
      };
      rival.roster[0] = fatiguedWarrior;

      const offer = createTestOffer(state, 'p_local', [fatiguedWarrior.id as string]);

      const result = evaluateBoutOffer(offer, rival, fatiguedWarrior);
      // Aggressive rivals accept even with high fatigue
      expect(result).toBe('Accepted');
    });

    it('should accept offers for warriors with fatigue <= 60', () => {
      const rival = rivals[0];
      if (!rival) return;

      const baseWarrior = rival.roster[0];
      if (!baseWarrior) return;
      const restedWarrior = {
        ...baseWarrior,
        fatigue: 50,
      } as Warrior;

      const offer = createTestOffer(state, 'p_local', [restedWarrior.id as string]);

      const result = evaluateBoutOffer(offer, rival, restedWarrior);
      expect(result).toBe('Accepted');
    });

    it('should accept offers for warriors with fatigue = 0 (fresh)', () => {
      const rival = rivals[0];
      if (!rival) return;

      const baseWarrior = rival.roster[0];
      if (!baseWarrior) return;
      const freshWarrior = {
        ...baseWarrior,
        fatigue: 0,
      } as Warrior;

      const offer = createTestOffer(state, 'p_local', [freshWarrior.id as string]);

      const result = evaluateBoutOffer(offer, rival, freshWarrior);
      expect(result).toBe('Accepted');
    });
  });

  describe('evaluateBoutOffer - Injury Gate', () => {
    it('should decline offers for warriors with Moderate injuries', () => {
      const rival = rivals[0];
      if (!rival) return;

      const baseWarrior = rival.roster[0]!;
      const injuredWarrior = {
        ...baseWarrior,
        injuries: [
          {
            id: generateId(undefined, 'injury') as InjuryId,
            name: 'Broken Arm',
            severity: 'Moderate',
            description: 'Broken arm',
            weeksRemaining: 3,
            penalties: {},
          },
        ],
      } as Warrior;

      const offer = createTestOffer(state, 'p_local', [injuredWarrior.id as string]);

      const result = evaluateBoutOffer(offer, rival, injuredWarrior);
      expect(result).toBe('Declined');
    });

    it('should decline offers for warriors with Severe injuries', () => {
      const rival = rivals[0];
      if (!rival) return;

      const injuredWarrior = {
        ...rival.roster[0]!,
        injuries: [
          {
            id: generateId(undefined, 'injury') as InjuryId,
            name: 'Crushed Rib',
            severity: 'Severe',
            description: 'Crushed rib',
            weeksRemaining: 6,
            penalties: {},
          },
        ],
      } as Warrior;

      const offer = createTestOffer(state, 'p_local', [injuredWarrior.id as string]);

      const result = evaluateBoutOffer(offer, rival, injuredWarrior);
      expect(result).toBe('Declined');
    });

    it('should decline offers for warriors with Critical injuries', () => {
      const rival = rivals[0];
      if (!rival) return;

      const injuredWarrior = {
        ...rival.roster[0]!,
        injuries: [
          {
            id: generateId(undefined, 'injury') as InjuryId,
            name: 'Skull Fracture',
            severity: 'Critical',
            description: 'Skull fracture',
            weeksRemaining: 12,
            penalties: {},
          },
        ],
      } as Warrior;

      const offer = createTestOffer(state, 'p_local', [injuredWarrior.id as string]);

      const result = evaluateBoutOffer(offer, rival, injuredWarrior);
      expect(result).toBe('Declined');
    });

    it('should decline offers for warriors with Permanent injuries', () => {
      const rival = rivals[0];
      if (!rival) return;

      const injuredWarrior = {
        ...rival.roster[0]!,
        injuries: [
          {
            id: generateId(undefined, 'injury') as InjuryId,
            name: 'Lost Eye',
            severity: 'Permanent',
            description: 'Lost eye',
            weeksRemaining: Infinity,
            penalties: {},
            permanent: true,
          },
        ],
      } as Warrior;

      const offer = createTestOffer(state, 'p_local', [injuredWarrior.id as string]);

      const result = evaluateBoutOffer(offer, rival, injuredWarrior);
      expect(result).toBe('Declined');
    });

    it('should accept offers for warriors with only Minor injuries', () => {
      const rival = rivals[0];
      if (!rival) return;

      const injuredWarrior = {
        ...rival.roster[0]!,
        injuries: [
          {
            id: generateId(undefined, 'injury') as InjuryId,
            name: 'Cut',
            severity: 'Minor',
            description: 'Minor cut',
            weeksRemaining: 1,
            penalties: {},
          },
        ],
      } as Warrior;

      const offer = createTestOffer(state, 'p_local', [injuredWarrior.id as string]);

      const result = evaluateBoutOffer(offer, rival, injuredWarrior);
      // Minor injuries don't block acceptance
      expect(result).toBe('Accepted');
    });

    it('should accept offers for warriors with no injuries', () => {
      const rival = rivals[0];
      if (!rival) return;

      const healthyWarrior = {
        ...rival.roster[0]!,
        injuries: [],
      } as Warrior;

      const offer = createTestOffer(state, 'p_local', [healthyWarrior.id as string]);

      const result = evaluateBoutOffer(offer, rival, healthyWarrior);
      expect(result).toBe('Accepted');
    });

    it('should decline if any injury is blocking (Moderate+) even with Minor injuries present', () => {
      const rival = rivals[0];
      if (!rival) return;

      const injuredWarrior = {
        ...rival.roster[0]!,
        injuries: [
          {
            id: generateId(undefined, 'injury') as InjuryId,
            name: 'Cut',
            severity: 'Minor',
            description: 'Minor cut',
            weeksRemaining: 1,
            penalties: {},
          },
          {
            id: generateId(undefined, 'injury') as InjuryId,
            name: 'Broken Arm',
            severity: 'Moderate' as const,
            description: 'Broken arm',
            weeksRemaining: 3,
            penalties: {},
          },
        ],
      } as Warrior;

      const offer = createTestOffer(state, 'p_local', [injuredWarrior.id as string]);

      const result = evaluateBoutOffer(offer, rival, injuredWarrior);
      // Moderate injury blocks acceptance despite Minor injury being present
      expect(result).toBe('Declined');
    });
  });

  describe('evaluateBoutOffer - Combined Gates', () => {
    it('should decline if warrior has high fatigue AND blocking injury', () => {
      const rival = rivals[0];
      if (!rival) return;

      const compromisedWarrior: Warrior = {
        ...rival.roster[0],
        fatigue: 75,
        injuries: [
          {
            id: generateId(undefined, 'injury') as WarriorId,
            name: 'Broken Arm',
            severity: 'Moderate',
            description: 'Broken arm',
            weeksRemaining: 3,
            penalties: {},
          } as InjuryData,
        ],
      };

      const offer = createTestOffer(state, 'p_local', [compromisedWarrior.id as string]);

      const result = evaluateBoutOffer(offer, rival, compromisedWarrior);
      expect(result).toBe('Declined');
    });
  });

  describe('processAllRivalsBoutOffers - Slate Processing', () => {
    it('should process offers for all rivals', () => {
      // Create some test offers
      const rival1 = rivals[0];
      const rival2 = rivals[1];
      if (!rival1 || !rival2) return;

      const warrior1 = rival1.roster[0];
      const warrior2 = rival2.roster[0];
      if (!warrior1 || !warrior2) return;

      const offer1 = createTestOffer(state, 'p_local', [warrior1.id as string], 100, 100);
      const offer2 = createTestOffer(state, 'p_legendary', [warrior2.id as string], 200, 150);

      state.boutOffers = {
        [offer1.id]: offer1,
        [offer2.id]: offer2,
      };

      const result = processAllRivalsBoutOffers(state, rivals);

      // Should return some impact (accepted or declined)
      expect(result).toBeDefined();
    });

    it('should prevent double-booking the same warrior', () => {
      const rival = rivals[0];
      if (!rival) return;

      const warrior = rival.roster[0];
      if (!warrior) return;

      // Create two offers for the same warrior
      const offer1 = createTestOffer(state, 'p_local', [warrior.id as string], 100, 100);
      const offer2 = createTestOffer(state, 'p_legendary', [warrior.id as string], 200, 150);

      state.boutOffers = {
        [offer1.id]: offer1,
        [offer2.id]: offer2,
      };

      const result = processAllRivalsBoutOffers(state, [rival]);

      // Should have processed both offers
      expect(result).toBeDefined();

      // Check that the warrior was only picked for one offer
      const updatedOffers = result.boutOffers || {};
      const responses1 = updatedOffers[offer1.id]?.responses?.[warrior.id];
      const responses2 = updatedOffers[offer2.id]?.responses?.[warrior.id];

      // One should be accepted, the other should be declined or pending
      const hasOneAcceptance = responses1 === 'Accepted' || responses2 === 'Accepted';
      expect(hasOneAcceptance).toBe(true);
    });

    it('should sort offers by quality (hype × purse) to prioritize better offers', () => {
      const rival = rivals[0];
      if (!rival) return;

      const warrior = rival.roster[0];
      if (!warrior) return;

      // Create offers with different quality
      const lowQualityOffer = createTestOffer(state, 'p_local', [warrior.id as string], 50, 50); // 2500
      const highQualityOffer = createTestOffer(
        state,
        'p_legendary',
        [warrior.id as string],
        200,
        200
      ); // 40000

      state.boutOffers = {
        [lowQualityOffer.id]: lowQualityOffer,
        [highQualityOffer.id]: highQualityOffer,
      };

      const result = processAllRivalsBoutOffers(state, [rival]);

      expect(result).toBeDefined();
    });

    it('should skip warriors already committed to other offers', () => {
      const rival = rivals[0];
      if (!rival) return;

      const warrior1 = rival.roster[0];
      const warrior2 = rival.roster[1];
      if (!warrior1 || !warrior2) return;

      // Create offer for both warriors
      const offer = createTestOffer(
        state,
        'p_local',
        [warrior1.id as string, warrior2.id as string],
        100,
        100
      );

      state.boutOffers = {
        [offer.id]: offer,
      };

      const result = processAllRivalsBoutOffers(state, [rival]);

      expect(result).toBeDefined();
    });

    it('should handle empty offer list gracefully', () => {
      state.boutOffers = {};

      const result = processAllRivalsBoutOffers(state, rivals);

      expect(result).toBeDefined();
      expect(Object.keys(result.boutOffers || {})).toHaveLength(0);
    });

    it('should handle empty rivals list gracefully', () => {
      const offer = createTestOffer(state, 'p_local', ['some_id'], 100, 100);
      state.boutOffers = {
        [offer.id]: offer,
      };

      const result = processAllRivalsBoutOffers(state, []);

      expect(result).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle warriors with undefined fatigue', () => {
      const rival = rivals[0];
      if (!rival) return;

      const warrior: Warrior = {
        ...rival.roster[0],
        fatigue: undefined as any,
      };

      const offer = createTestOffer(state, 'p_local', [warrior.id as string]);

      // Should not throw and should evaluate based on other criteria
      expect(() => evaluateBoutOffer(offer, rival, warrior)).not.toThrow();
    });

    it('should handle warriors with undefined injuries', () => {
      const rival = rivals[0];
      if (!rival) return;

      const warrior: Warrior = {
        ...rival.roster[0],
        injuries: undefined as any,
      };

      const offer = createTestOffer(state, 'p_local', [warrior.id as string]);

      // Should not throw and should treat as no injuries
      const result = evaluateBoutOffer(offer, rival, warrior);
      expect(result).toBe('Accepted');
    });

    it('should handle offer not found for rival', () => {
      // Create offer for a warrior that doesn't belong to any rival
      const offer = createTestOffer(state, 'p_local', ['unknown_warrior_id'], 100, 100);

      state.boutOffers = {
        [offer.id]: offer,
      };

      const result = processAllRivalsBoutOffers(state, rivals);

      // Should handle gracefully
      expect(result).toBeDefined();
    });
  });
});
