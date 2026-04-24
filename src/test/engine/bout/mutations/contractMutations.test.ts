import { describe, it, expect } from 'vitest';
import { respondToBoutOffer } from '@/engine/bout/mutations/contractMutations';
import { GameState } from '@/types/state.types';

describe('contractMutations', () => {
  describe('respondToBoutOffer', () => {
    it('returns empty impact if offer not found', () => {
      const state = { boutOffers: {} } as unknown as GameState;
      const result = respondToBoutOffer(state, 'o1', 'w1', 'Accepted');
      expect(result).toEqual({});
    });

    it('updates response to Accepted but leaves status as Pending if not all responded', () => {
      const state = {
        boutOffers: {
          o1: {
            warriorIds: ['w1', 'w2'],
            responses: { w1: 'Pending', w2: 'Pending' },
            status: 'Pending',
          },
        },
      } as unknown as GameState;
      const result = respondToBoutOffer(state, 'o1', 'w1', 'Accepted');
      expect(result.boutOffers?.o1.responses.w1).toBe('Accepted');
      expect(result.boutOffers?.o1.status).toBe('Pending');
    });

    it('changes status to Signed when all accepted', () => {
      const state = {
        boutOffers: {
          o1: {
            warriorIds: ['w1', 'w2'],
            responses: { w1: 'Accepted', w2: 'Pending' },
            status: 'Pending',
          },
        },
      } as unknown as GameState;
      const result = respondToBoutOffer(state, 'o1', 'w2', 'Accepted');
      expect(result.boutOffers?.o1.responses.w2).toBe('Accepted');
      expect(result.boutOffers?.o1.status).toBe('Signed');
    });

    it('changes status to Rejected when all responded but one declined', () => {
      const state = {
        boutOffers: {
          o1: {
            warriorIds: ['w1', 'w2'],
            responses: { w1: 'Accepted', w2: 'Pending' },
            status: 'Pending',
          },
        },
      } as unknown as GameState;
      const result = respondToBoutOffer(state, 'o1', 'w2', 'Declined');
      expect(result.boutOffers?.o1.responses.w2).toBe('Declined');
      expect(result.boutOffers?.o1.status).toBe('Rejected');
    });
  });
});
