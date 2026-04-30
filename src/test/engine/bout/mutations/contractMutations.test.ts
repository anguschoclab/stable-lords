import { describe, it, expect, beforeEach } from 'vitest';
import { respondToBoutOffer } from '@/engine/bout/mutations/contractMutations';
import { GameState, BoutOffer } from '@/types/state.types';
import { createFreshState } from '@/engine/factories';

describe('contractMutations', () => {
  let state: GameState;

  beforeEach(() => {
    state = createFreshState('test-seed');
  });

  describe('respondToBoutOffer', () => {
    it('returns empty impact when offer does not exist', () => {
      const impact = respondToBoutOffer(state, 'nonexistent', 'w1', 'Accepted');
      expect(impact).toEqual({});
    });

    it('updates response correctly for single warrior', () => {
      state.boutOffers['offer1'] = {
        id: 'offer1',
        promoterId: 'p1',
        warriorIds: ['w1', 'w2'],
        boutWeek: 10,
        expirationWeek: 11,
        purse: 100,
        hype: 10,
        status: 'Proposed',
        responses: { w1: 'Pending', w2: 'Pending' }
      };

      const impact = respondToBoutOffer(state, 'offer1', 'w1', 'Accepted');
      expect(impact.boutOffers?.['offer1'].responses).toEqual({
        w1: 'Accepted',
        w2: 'Pending'
      });
      expect(impact.boutOffers?.['offer1'].status).toBe('Proposed');
    });

    it('updates status to Signed when all warriors accept', () => {
      state.boutOffers['offer1'] = {
        id: 'offer1',
        promoterId: 'p1',
        warriorIds: ['w1', 'w2'],
        boutWeek: 10,
        expirationWeek: 11,
        purse: 100,
        hype: 10,
        status: 'Proposed',
        responses: { w1: 'Accepted', w2: 'Pending' }
      } as BoutOffer;

      const impact = respondToBoutOffer(state, 'offer1', 'w2', 'Accepted');
      expect(impact.boutOffers?.['offer1'].responses).toEqual({
        w1: 'Accepted',
        w2: 'Accepted'
      });
      expect(impact.boutOffers?.['offer1'].status).toBe('Signed');
    });

    it('updates status to Rejected when any warrior declines (all responded)', () => {
      state.boutOffers['offer1'] = {
        id: 'offer1',
        promoterId: 'p1',
        warriorIds: ['w1', 'w2'],
        boutWeek: 10,
        expirationWeek: 11,
        purse: 100,
        hype: 10,
        status: 'Proposed',
        responses: { w1: 'Accepted', w2: 'Pending' }
      } as BoutOffer;

      const impact = respondToBoutOffer(state, 'offer1', 'w2', 'Declined');
      expect(impact.boutOffers?.['offer1'].responses).toEqual({
        w1: 'Accepted',
        w2: 'Declined'
      });
      expect(impact.boutOffers?.['offer1'].status).toBe('Rejected');
    });
  });
});
