
import type { GameState, Warrior, TournamentEntry, TournamentBout, Season } from '@/types/state.types';
import { FightingStyle } from '@/types/shared.types';
import { SeededRNG } from '@/utils/random';
import { generateId } from '@/utils/idUtils';
import { generateFreelancer } from './utils';

export function committeeSelection(
  state: GameState,
  tier: string,
  seed: number,
  lockedIds: Set<string>
): { warriors: Warrior[]; updatedLockedIds: Set<string> } {
  const rng = new SeededRNG(seed);
  const rankings = state.realmRankings || {};
  const qualified: Warrior[] = [];
  const newLocks = new Set<string>();

  // Gather all active, unlocked warriors
  const pool: { w: Warrior; rank: number; score: number }[] = [];

  const collect = (roster: Warrior[]) => {
    roster.forEach(w => {
      if (w.status === "Active" && !lockedIds.has(w.id)) {
        // 🌩️ Tournament Entry Skepticism: Weather Check
        if (state.weather === "Rainy" && w.style === FightingStyle.LungingAttack) return;
        if (state.weather === "Scalding" && (w.attributes.CN || 0) < 10) return;

        const r = rankings[w.id];
        if (r) pool.push({ w, rank: r.overallRank, score: r.compositeScore });
      }
    });
  };

  collect(state.roster);
  state.rivals.forEach(r => collect(r.roster));

  // Sort pool by rank
  const sortedPool = pool.sort((a, b) => a.rank - b.rank);

  // 1. Mandatory Invites (Top 40 of available)
  const top40 = sortedPool.slice(0, 40);
  top40.forEach(p => { qualified.push(p.w); newLocks.add(p.w.id); });

  // 2. Style Champions Auto-Bid (Top 1 of each style not yet invited)
  Object.values(FightingStyle).forEach(style => {
    if (qualified.length >= 50) return;
    const styleLead = sortedPool.find(p => p.w.style === style && !newLocks.has(p.w.id));
    if (styleLead) {
      qualified.push(styleLead.w);
      newLocks.add(styleLead.w.id);
    }
  });

  // 3. Bubble Watch (Fill to 64 from the next 40 candidates)
  const remainingNeeded = 64 - qualified.length;
  const bubblePool = sortedPool.filter(p => !newLocks.has(p.w.id)).slice(0, 40);
  const shuffledBubble = rng.shuffle(bubblePool);

  shuffledBubble.slice(0, remainingNeeded).forEach(p => {
    qualified.push(p.w);
    newLocks.add(p.w.id);
  });

  // 4. Emergency Fillers (If world population is decimated)
  if (qualified.length < 64) {
    const fillersNeeded = 64 - qualified.length;
    for (let i = 0; i < fillersNeeded; i++) {
      const freelancer = generateFreelancer(tier, i, rng);
      qualified.push(freelancer);
    }
  }

  return { warriors: qualified.slice(0, 64), updatedLockedIds: newLocks };
}

export function buildTournament(tierId: string, tierName: string, warriors: Warrior[], week: number, season: Season, rng: SeededRNG): TournamentEntry {
  const id = `t-${tierId.toLowerCase()}-${season.toLowerCase()}-${week}`;
  const shuffled = rng.shuffle([...warriors]);
  const bracket: TournamentBout[] = [];

  for (let i = 0; i < 64; i += 2) {
    bracket.push({
      round: 1,
      matchIndex: i / 2,
      a: shuffled[i].name,
      d: shuffled[i+1].name,
      warriorIdA: shuffled[i].id,
      warriorIdD: shuffled[i+1].id,
      stableIdA: shuffled[i].stableId,
      stableIdD: shuffled[i+1].stableId,
      stableA: shuffled[i].stableId,
      stableD: shuffled[i+1].stableId,
    });
  }

  return {
    id,
    season,
    week,
    tierId,
    name: tierName,
    bracket,
    participants: warriors,
    completed: false
  };
}
