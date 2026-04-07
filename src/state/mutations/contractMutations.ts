import { GameState, BoutOffer } from "@/types/game";

/**
 * Pure mutation for responding to a bout offer.
 * Extracted from worldSlice for use in AI workers and tests.
 */
export function respondToBoutOffer(
  state: GameState,
  offerId: string,
  warriorId: string,
  response: "Accepted" | "Declined"
): Partial<GameState> {
  const offer = state.boutOffers[offerId];
  if (!offer) return {};

  const newResponses = {
    ...offer.responses,
    [warriorId]: response,
  };

  // Check if all parties have responded
  let newStatus = offer.status;
  const allParticipatingWarriors = offer.warriorIds;
  const allResponded = allParticipatingWarriors.every((wid: string) => 
    newResponses[wid] && newResponses[wid] !== "Pending"
  );
  
  if (allResponded) {
    const anyDeclined = allParticipatingWarriors.some((wid: string) => newResponses[wid] === "Declined");
    newStatus = anyDeclined ? "Rejected" : "Signed";
  }

  return {
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
