import { GameState, BoutOffer } from "@/types/state.types";

/**
 * Stable Lords — Contract Mutations
 * Logic for accepting, declining, and managing bout offers.
 */

export function updateBoutOfferStatus(
  state: GameState,
  offerId: string,
  status: BoutOffer["status"]
): GameState {
  if (!state.boutOffers[offerId]) return state;

  return {
    ...state,
    boutOffers: {
      ...state.boutOffers,
      [offerId]: {
        ...state.boutOffers[offerId],
        status,
      },
    },
  };
}

export function respondToBoutOffer(
  state: GameState,
  offerId: string,
  warriorId: string,
  response: "Accepted" | "Declined"
): GameState {
  const offer = state.boutOffers[offerId];
  if (!offer) return state;

  const newResponses = {
    ...offer.responses,
    [warriorId]: response,
  };

  // Check if all parties have responded
  let newStatus = offer.status;
  const allParticipatingWarriors = offer.warriorIds;
  const allResponded = allParticipatingWarriors.every(id => newResponses[id] && newResponses[id] !== "Pending");
  
  if (allResponded) {
    const anyDeclined = allParticipatingWarriors.some(id => newResponses[id] === "Declined");
    newStatus = anyDeclined ? "Rejected" : "Signed";
  }

  return {
    ...state,
    boutOffers: {
      ...state.boutOffers,
      [offerId]: {
        ...offer,
        responses: newResponses,
        status: newStatus,
      },
    },
  };
}

export function clearExpiredOffers(state: GameState): GameState {
  const newOffers = { ...state.boutOffers };
  let changed = false;

  for (const id in newOffers) {
    const offer = newOffers[id];
    if (offer.status === "Proposed" && state.week >= offer.expirationWeek) {
      newOffers[id] = { ...offer, status: "Expired" };
      changed = true;
    }
  }

  return changed ? { ...state, boutOffers: newOffers } : state;
}
