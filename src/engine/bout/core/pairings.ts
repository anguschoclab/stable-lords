import { GameState, Warrior, BoutOffer } from "@/types/state.types";

export interface BoutPairing {
  a: Warrior;
  d: Warrior;
  isRivalry: boolean;
  rivalStable?: string;
  rivalStableId?: string;
  contractId?: string;
}

export function generatePairings(state: GameState): BoutPairing[] {
  const currentWeek = state.week;
  const pairings: BoutPairing[] = [];
  const warriorMap = new Map<string, Warrior>();

  // 1. Build a fast lookup map for all active warriors
  state.roster.forEach(w => warriorMap.set(w.id, w));
  (state.rivals || []).forEach(r => {
    r.roster.forEach(w => warriorMap.set(w.id, w));
  });

  // 2. Derive pairings from Signed Contracts for this week
  const currentOffers = Object.values(state.boutOffers).filter(
    o => o.status === "Signed" && o.boutWeek === currentWeek
  );

  currentOffers.forEach(offer => {
    const wA = warriorMap.get(offer.warriorIds[0]);
    const wD = warriorMap.get(offer.warriorIds[1]);

    if (wA && wD) {
      // Find which stable wD belongs to
      const rivalStable = state.rivals.find(r => r.roster.some(w => w.id === wD.id));
      
      pairings.push({
        a: wA,
        d: wD,
        isRivalry: offer.hype > 150, // Use hype as a proxy for rivalry
        rivalStable: rivalStable?.owner.stableName,
        rivalStableId: rivalStable?.owner.id,
        contractId: offer.id
      });
    }
  });

  // 3. TODO: Integrate Tournament Matchups
  // (Assuming tournaments will eventually use the same signed status or a separate bracket lookup)

  return pairings;
}
