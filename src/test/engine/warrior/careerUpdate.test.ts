/**
 * Career Update Tests
 * Tests for warrior career progression, fatigue management, and tournament exemptions
 */
import { describe, it, expect } from 'vitest';
import { makeWarrior } from '@/engine/factories';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { FightingStyle } from '@/types/shared.types';
import type { Warrior } from '@/types/state.types';
import {
  calculateCareerUpdate,
  applyCareerUpdate,
  updateWarriorFromBoutOutcome,
  CareerUpdateInput,
} from '@/engine/warrior/careerUpdate';

describe('careerUpdate', () => {
  const rng = new SeededRNGService(12345);

  function createTestWarrior(
    fatigue: number = 0,
    wins: number = 0,
    losses: number = 0,
    kills: number = 0,
    fame: number = 10
  ): Warrior {
    return makeWarrior(
      undefined,
      'TestWarrior',
      FightingStyle.StrikingAttack,
      { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
      {
        fatigue,
        career: { wins, losses, kills },
        fame,
        status: 'Active' as const,
      },
      rng
    ) as Warrior;
  }

  describe('calculateCareerUpdate', () => {
    describe('fatigue management', () => {
      it('should add +25 fatigue for regular bout (skipFatigue=false)', () => {
        const warrior = createTestWarrior(10);
        const input: CareerUpdateInput = {
          isWinner: true,
          isKill: false,
          isVictim: false,
          skipFatigue: false,
        };

        const result = calculateCareerUpdate(warrior, input);

        expect(result.fatigue).toBe(35); // 10 + 25
      });

      it('should NOT add fatigue when skipFatigue=true (tournament exemption)', () => {
        const warrior = createTestWarrior(30);
        const input: CareerUpdateInput = {
          isWinner: true,
          isKill: false,
          isVictim: false,
          skipFatigue: true,
        };

        const result = calculateCareerUpdate(warrior, input);

        expect(result.fatigue).toBe(30); // Unchanged
      });

      it('should cap fatigue at 100 for regular bout', () => {
        const warrior = createTestWarrior(90);
        const input: CareerUpdateInput = {
          isWinner: true,
          isKill: false,
          isVictim: false,
          skipFatigue: false,
        };

        const result = calculateCareerUpdate(warrior, input);

        expect(result.fatigue).toBe(100); // Capped, not 115
      });

      it('should reset fatigue to 0 when warrior is killed regardless of skipFatigue', () => {
        const warrior = createTestWarrior(50);
        const input: CareerUpdateInput = {
          isWinner: false,
          isKill: true,
          isVictim: true,
          skipFatigue: false,
        };

        const result = calculateCareerUpdate(warrior, input);

        expect(result.fatigue).toBe(0);
        expect(result.status).toBe('Dead');
      });

      it('should handle skipFatigue with already high fatigue', () => {
        const warrior = createTestWarrior(95);
        const input: CareerUpdateInput = {
          isWinner: true,
          isKill: false,
          isVictim: false,
          skipFatigue: true,
        };

        const result = calculateCareerUpdate(warrior, input);

        expect(result.fatigue).toBe(95); // Unchanged despite being near cap
      });
    });

    describe('career stats', () => {
      it('should increment wins for winner', () => {
        const warrior = createTestWarrior(0, 5, 3, 1);
        const input: CareerUpdateInput = {
          isWinner: true,
          isKill: false,
          isVictim: false,
        };

        const result = calculateCareerUpdate(warrior, input);

        expect(result.career.wins).toBe(6);
        expect(result.career.losses).toBe(3);
        expect(result.career.kills).toBe(1);
      });

      it('should increment losses for loser', () => {
        const warrior = createTestWarrior(0, 5, 3, 1);
        const input: CareerUpdateInput = {
          isWinner: false,
          isKill: false,
          isVictim: false,
        };

        const result = calculateCareerUpdate(warrior, input);

        expect(result.career.wins).toBe(5);
        expect(result.career.losses).toBe(4);
        expect(result.career.kills).toBe(1);
      });

      it('should increment kills when winner gets a kill', () => {
        const warrior = createTestWarrior(0, 5, 3, 1);
        const input: CareerUpdateInput = {
          isWinner: true,
          isKill: true,
          isVictim: false,
        };

        const result = calculateCareerUpdate(warrior, input);

        expect(result.career.wins).toBe(6);
        expect(result.career.kills).toBe(2);
      });
    });

    describe('fame calculation', () => {
      it('should add +1 fame for regular win', () => {
        const warrior = createTestWarrior(0, 0, 0, 0, 10);
        const input: CareerUpdateInput = {
          isWinner: true,
          isKill: false,
          isVictim: false,
        };

        const result = calculateCareerUpdate(warrior, input);

        expect(result.fame).toBe(11);
      });

      it('should add +3 fame for kill win', () => {
        const warrior = createTestWarrior(0, 0, 0, 0, 10);
        const input: CareerUpdateInput = {
          isWinner: true,
          isKill: true,
          isVictim: false,
        };

        const result = calculateCareerUpdate(warrior, input);

        expect(result.fame).toBe(13);
      });

      it('should add fame delta bonus', () => {
        const warrior = createTestWarrior(0, 0, 0, 0, 10);
        const input: CareerUpdateInput = {
          isWinner: true,
          isKill: false,
          isVictim: false,
          fameDelta: 5,
        };

        const result = calculateCareerUpdate(warrior, input);

        expect(result.fame).toBe(16); // 10 + 1 (win) + 5 (delta)
      });

      it('should not add fame for loss', () => {
        const warrior = createTestWarrior(0, 0, 0, 0, 10);
        const input: CareerUpdateInput = {
          isWinner: false,
          isKill: false,
          isVictim: false,
        };

        const result = calculateCareerUpdate(warrior, input);

        expect(result.fame).toBe(10);
      });

      it('should never have negative fame', () => {
        const warrior = createTestWarrior(0, 0, 0, 0, 0);
        const input: CareerUpdateInput = {
          isWinner: false,
          isKill: false,
          isVictim: false,
          fameDelta: -5,
        };

        const result = calculateCareerUpdate(warrior, input);

        expect(result.fame).toBe(0);
      });
    });

    describe('status management', () => {
      it('should keep status Active for survivor', () => {
        const warrior = createTestWarrior();
        const input: CareerUpdateInput = {
          isWinner: false,
          isKill: false,
          isVictim: false,
        };

        const result = calculateCareerUpdate(warrior, input);

        expect(result.status).toBe('Active');
      });

      it('should set status to Dead for victim', () => {
        const warrior = createTestWarrior();
        const input: CareerUpdateInput = {
          isWinner: false,
          isKill: true,
          isVictim: true,
        };

        const result = calculateCareerUpdate(warrior, input);

        expect(result.status).toBe('Dead');
      });
    });
  });

  describe('applyCareerUpdate', () => {
    it('should apply all updates to warrior', () => {
      const warrior = createTestWarrior(10, 5, 3, 1, 20);
      const updateResult = calculateCareerUpdate(warrior, {
        isWinner: true,
        isKill: false,
        isVictim: false,
        skipFatigue: false,
      });

      const updated = applyCareerUpdate(warrior, updateResult);

      expect(updated.fatigue).toBe(35);
      expect(updated.career.wins).toBe(6);
      expect(updated.career.losses).toBe(3);
      expect(updated.fame).toBe(21);
      expect(updated.status).toBe('Active');
    });

    it('should preserve warrior id and name', () => {
      const warrior = createTestWarrior();
      const updateResult = calculateCareerUpdate(warrior, {
        isWinner: true,
        isKill: false,
        isVictim: false,
      });

      const updated = applyCareerUpdate(warrior, updateResult);

      expect(updated.id).toBe(warrior.id);
      expect(updated.name).toBe(warrior.name);
    });
  });

  describe('updateWarriorFromBoutOutcome', () => {
    it('should identify attacker as winner when winnerSide is A', () => {
      const warrior = createTestWarrior();

      const updated = updateWarriorFromBoutOutcome(warrior, true, 'A', false, false);

      expect(updated.career.wins).toBe(1);
      expect(updated.career.losses).toBe(0);
    });

    it('should identify attacker as loser when winnerSide is D', () => {
      const warrior = createTestWarrior();

      const updated = updateWarriorFromBoutOutcome(warrior, true, 'D', false, false);

      expect(updated.career.wins).toBe(0);
      expect(updated.career.losses).toBe(1);
    });

    it('should identify defender as winner when winnerSide is D', () => {
      const warrior = createTestWarrior();

      const updated = updateWarriorFromBoutOutcome(warrior, false, 'D', false, false);

      expect(updated.career.wins).toBe(1);
      expect(updated.career.losses).toBe(0);
    });

    it('should apply fatigue skip for tournament bout', () => {
      const warrior = createTestWarrior(40);

      const updated = updateWarriorFromBoutOutcome(warrior, true, 'A', false, true);

      expect(updated.fatigue).toBe(40); // Unchanged
      expect(updated.career.wins).toBe(1);
    });

    it('should apply normal fatigue for non-tournament bout', () => {
      const warrior = createTestWarrior(40);

      const updated = updateWarriorFromBoutOutcome(warrior, true, 'A', false, false);

      expect(updated.fatigue).toBe(65); // 40 + 25
    });

    it('should handle kill victory with fatigue skip', () => {
      const warrior = createTestWarrior(30, 5, 2, 1, 15);

      const updated = updateWarriorFromBoutOutcome(warrior, true, 'A', true, true);

      expect(updated.fatigue).toBe(30); // Unchanged
      expect(updated.career.wins).toBe(6);
      expect(updated.career.kills).toBe(2);
      expect(updated.fame).toBe(18); // +3 for kill
    });

    it('should handle death outcome (isVictim)', () => {
      const warrior = createTestWarrior(50, 3, 2, 0, 10);

      // Defender loses and gets killed
      const updated = updateWarriorFromBoutOutcome(warrior, false, 'A', true, false);

      expect(updated.status).toBe('Dead');
      expect(updated.fatigue).toBe(0);
      expect(updated.career.losses).toBe(3);
    });
  });

  describe('tournament week fatigue exemption integration', () => {
    it('should simulate tournament week with multiple bouts - fatigue should not accumulate', () => {
      let warrior = createTestWarrior(10);
      const skipFatigue = true; // Tournament week

      // Simulate 3 tournament bouts in one week
      for (let i = 0; i < 3; i++) {
        warrior = updateWarriorFromBoutOutcome(warrior, true, 'A', false, skipFatigue);
      }

      // After 3 wins with fatigue skip, should still be at initial fatigue
      expect(warrior.fatigue).toBe(10);
      expect(warrior.career.wins).toBe(3);
    });

    it('should simulate regular week with multiple bouts - fatigue should accumulate', () => {
      let warrior = createTestWarrior(10);
      const skipFatigue = false; // Regular week

      // Simulate 3 regular bouts
      for (let i = 0; i < 3; i++) {
        warrior = updateWarriorFromBoutOutcome(warrior, true, 'A', false, skipFatigue);
      }

      // After 3 wins: 10 + 25 + 25 + 25 = 85
      expect(warrior.fatigue).toBe(85);
      expect(warrior.career.wins).toBe(3);
    });

    it('should cap fatigue at 100 even with multiple bouts', () => {
      let warrior = createTestWarrior(80);
      const skipFatigue = false;

      // Two more bouts should cap at 100, not 130
      warrior = updateWarriorFromBoutOutcome(warrior, true, 'A', false, skipFatigue);
      warrior = updateWarriorFromBoutOutcome(warrior, true, 'A', false, skipFatigue);

      expect(warrior.fatigue).toBe(100);
    });
  });
});
