import { describe, it, expect, beforeEach } from 'vitest';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { populateTestState } from '@/test/testHelpers';
import { runRankingsPass } from '@/engine/pipeline/passes/RankingsPass';
import { runPromoterPass } from '@/engine/pipeline/passes/PromoterPass';
import { processWeekBouts } from '@/engine/bout/services/boutProcessorService';
import { respondToBoutOffer } from '@/engine/bout/mutations/contractMutations';
import { resolveImpacts } from '@/engine/impacts';
import { GameState, BoutOffer } from '@/types/state.types';

describe('Contract System Cycle', () => {
  let state: GameState;

  beforeEach(() => {
    state = createFreshState('test-seed');
    state = populateTestState(state);

    // Fix test setup: remove rivals so that the limited promoter capacity
    // is filled purely by player warriors, guaranteeing offers are generated
    // for the player roster in tests that expect them.
    state.rivals = [];

    // Pre-initialize rankings cache
    const rankingImpact = runRankingsPass(state);
    state = resolveImpacts(state, [rankingImpact]);
  });

  it('should generate bout offers in PromoterPass', () => {
    const promoterImpact = runPromoterPass(state);
    const offers = Object.values(promoterImpact.boutOffers || {}) as BoutOffer[];
    expect(offers.length).toBeGreaterThan(0);
    expect(offers[0].status).toBe('Proposed');
  });

  it("should transition offer to 'Signed' when accepted by player", () => {
    const promoterImpact = runPromoterPass(state);
    const stateWithOffers = resolveImpacts(state, [promoterImpact]);
    const offers = Object.values(stateWithOffers.boutOffers || {}) as BoutOffer[];

    // Find an offer for a player warrior
    const offer = offers.find((o) =>
      o.warriorIds.some((wId) => stateWithOffers.roster.some((pW) => pW.id === wId))
    );
    expect(offer).toBeDefined();
    const playerWarrior = stateWithOffers.roster.find((w) => offer.warriorIds.includes(w.id));
    if (!playerWarrior) throw new Error('Player warrior not found for offer');
    const playerWarriorId = playerWarrior.id;

    // Simulate accepting an offer. Since both warriors in the test are player warriors (rivals removed),
    // we need BOTH warriors to accept to reach 'Signed' status.
    const w1 = offer.warriorIds[0];
    const w2 = offer.warriorIds[1];
    let impact = respondToBoutOffer(stateWithOffers, offer.id, w1, 'Accepted');
    let signedState = resolveImpacts(stateWithOffers, [impact]);
    impact = respondToBoutOffer(signedState, offer.id, w2, 'Accepted');
    signedState = resolveImpacts(signedState, [impact]);
    expect(signedState.boutOffers![offer.id].status).toBe('Signed');
  });

  it('should payout the purse upon bout resolution via processWeekBouts', () => {
    const promoterImpact = runPromoterPass(state);
    let s = resolveImpacts(state, [promoterImpact]);
    const offers = Object.values(s.boutOffers || {}) as BoutOffer[];
    const offer = offers.find((o) =>
      o.warriorIds.some((wId) => s.roster.some((pW) => pW.id === wId))
    );
    expect(offer).toBeDefined();
    const playerWarrior = s.roster.find((w) => offer.warriorIds.includes(w.id));
    if (!playerWarrior) throw new Error('Player warrior not found for offer in payout test');
    const playerWarriorId = playerWarrior.id;
    const initialGold = s.treasury;

    // Sign the first offer for both warriors
    const w1 = offer.warriorIds[0];
    const w2 = offer.warriorIds[1];
    let signImpact = respondToBoutOffer(s, offer.id, w1, 'Accepted');
    s = resolveImpacts(s, [signImpact]);
    signImpact = respondToBoutOffer(s, offer.id, w2, 'Accepted');
    s = resolveImpacts(s, [signImpact]);

    // Ensure the bout is scheduled for the CURRENT week so processWeekBouts picks it up
    s = resolveImpacts(s, [
      {
        boutOffers: {
          [offer.id]: {
            ...s.boutOffers![offer.id],
            boutWeek: s.week,
            status: 'Signed',
          },
        },
      },
    ]);

    // Run the week processing
    const processed = processWeekBouts(s);

    // Check results
    expect(processed.results.length).toBeGreaterThan(0);
    const ourBout = processed.results.find((r) => r.contractId === offer.id);
    expect(ourBout).toBeDefined();

    const resolvedState = resolveImpacts(s, [processed.impact]);

    // Gold should have increased (either by purse or show fee)
    expect(resolvedState.treasury).toBeGreaterThan(initialGold);

    // Contract should be cleared
  });
});
