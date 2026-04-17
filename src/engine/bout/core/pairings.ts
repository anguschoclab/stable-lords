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

  // ⚡ Bolt: Use cached warriorMap if available, otherwise build it
  const warriorMap = state.warriorMap || (() => {
    const map = new Map<string, Warrior>();
    state.roster.forEach(w => map.set(w.id, w));
    (state.rivals || []).forEach(r => {
      r.roster.forEach(w => map.set(w.id, w));
    });
    return map;
  })();

  // ⚡ Bolt: Create O(N) map for name-based lookup instead of repeated O(N) Array.from searches
  const warriorNameMap = new Map<string, Warrior>();
  for (const w of warriorMap.values()) {
    warriorNameMap.set(w.name, w);
  }

  // 2. Derive pairings from Signed Contracts for this week
  const currentOffers = Object.values(state.boutOffers || {}).filter(
    o => o.status === "Signed" && o.boutWeek === currentWeek
  );

  currentOffers.forEach(offer => {
    const wA = warriorMap.get(offer.warriorIds[0]);
    const wD = warriorMap.get(offer.warriorIds[1]);

    if (wA && wD) {
      // Find which stable wD belongs to
      const rivalStable = (state.rivals || []).find(r => r.roster.some(w => w.id === wD.id));
      
      pairings.push({
        a: wA,
        d: wD,
        isRivalry: (offer.hype || 0) > 150, // Use hype as a proxy for rivalry
        rivalStable: rivalStable?.owner.stableName,
        rivalStableId: rivalStable?.owner.id,
        contractId: offer.id
      });
    }
  });

  // 3. Integrate Tournament Matchups
  if (state.isTournamentWeek && state.activeTournamentId) {
    const tournament = state.tournaments.find(t => t.id === state.activeTournamentId);
    if (tournament) {
      // Round 1 is Day 1, Round 2 is Day 2, etc.
      const currentDay = state.day || 0;
      const tournamentBouts = tournament.bracket.filter(b => b.round === currentDay && b.winner === undefined);
      
      tournamentBouts.forEach(bout => {
        const wA = warriorMap.get(bout.a) || warriorNameMap.get(bout.a);
        const wD = warriorMap.get(bout.d) || warriorNameMap.get(bout.d);
        
        if (wA && wD) {
          pairings.push({
            a: wA,
            d: wD,
            isRivalry: true, // Tournaments are always high stakes
            rivalStable: (state.rivals || []).find(r => r.owner.id === bout.stableD)?.owner.stableName || "Rival",
            rivalStableId: bout.stableD,
            contractId: `tour_${tournament.id}_${bout.round}_${bout.matchIndex}`
          });
        }
      });
    }
  }

  return pairings;
}
