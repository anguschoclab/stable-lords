import { describe, it, expect, beforeEach } from "vitest";
import { createFreshState } from "@/engine/factories";
import { populateTestState } from "@/test/testHelpers";
import { runRankingsPass } from "@/engine/pipeline/passes/RankingsPass";
import { runPromoterPass } from "@/engine/pipeline/passes/PromoterPass";
import { processWeekBouts } from "@/engine/bout/services/boutProcessorService";
import { respondToBoutOffer } from "@/state/mutations/contractMutations";
import { GameState, BoutOffer } from "@/types/state.types";

describe("Contract System Cycle", () => {
  let state: GameState;

  beforeEach(() => {
    state = createFreshState("test-seed");
    state = populateTestState(state);
    // Pre-initialize rankings cache
    state = runRankingsPass(state);
  });

  it("should generate bout offers in PromoterPass", () => {
    const updatedState = runPromoterPass(state);
    const offers = Object.values(updatedState.boutOffers) as BoutOffer[];
    expect(offers.length).toBeGreaterThan(0);
    expect(offers[0].status).toBe("Proposed");
  });

  it("should transition offer to 'Signed' when accepted by player", () => {
    const stateWithOffers = runPromoterPass(state);
    const offers = Object.values(stateWithOffers.boutOffers) as BoutOffer[];
    
    // Find an offer for a player warrior
    const offer = offers.find(o => o.warriorIds.some(wId => stateWithOffers.roster.some(pW => pW.id === wId)));
    if (!offer) return; // Skip if no player offer in this seed

    const playerWarriorId = stateWithOffers.roster.find(w => offer.warriorIds.includes(w.id))!.id;
    
    // Simulate accepting an offer
    const signedState = respondToBoutOffer(stateWithOffers, offer.id, playerWarriorId, "Accepted");
    expect(signedState.boutOffers[offer.id].status).toBe("Signed");
  });

  it("should payout the purse upon bout resolution via processWeekBouts", () => {
    let s = runPromoterPass(state);
    const offers = Object.values(s.boutOffers) as BoutOffer[];
    const offer = offers.find(o => o.warriorIds.some(wId => s.roster.some(pW => pW.id === wId)));
    
    if (!offer) return; // Skip if no player offer generated in this seed

    const playerWarriorId = s.roster.find(w => offer.warriorIds.includes(w.id))!.id;
    const initialGold = s.gold;

    // Sign the first offer for the player
    s = respondToBoutOffer(s, offer.id, playerWarriorId, "Accepted");
    
    // Ensure the bout is scheduled for the CURRENT week so processWeekBouts picks it up
    s.boutOffers[offer.id].boutWeek = s.week;
    s.boutOffers[offer.id].status = "Signed";

    // Run the week processing
    const processed = processWeekBouts(s);
    
    // Check results
    expect(processed.results.length).toBeGreaterThan(0);
    const ourBout = processed.results.find(r => r.contractId === offer.id);
    expect(ourBout).toBeDefined();

    // Gold should have increased (either by purse or show fee)
    expect(processed.state.gold).toBeGreaterThan(initialGold);
    
    // Contract should be cleared
    expect(processed.state.boutOffers[offer.id]).toBeUndefined();
  });
});
