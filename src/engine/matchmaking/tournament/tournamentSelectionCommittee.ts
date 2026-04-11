import type { 
  GameState, 
  Warrior, 
  Season
} from "@/types/state.types";
import { FightingStyle } from "@/types/shared.types";
import { SeededRNG } from "@/utils/random";

/**
 * Tournament Selection Committee
 * Implements a 4-tier NCAA-style loop for 256-warrior seasonal coverage.
 */

export const TOURNAMENT_TIERS = [
  { id: "Gold", name: "Imperial Gold Cup", minRank: 1, maxRank: 64 },
  { id: "Silver", name: "Proconsul Silver Plate", minRank: 65, maxRank: 128 },
  { id: "Bronze", name: "Steel Bronze Gauntlet", minRank: 129, maxRank: 192 },
  { id: "Iron", name: "Foundry Iron Trials", minRank: 193, maxRank: 256 }
];

export interface CommitteeSelectionResult {
  warriors: Warrior[];
  updatedLockedIds: Set<string>;
}

/**
 * The "Committee" Model:
 * 1. Top 40 by Composite Rank (unlocked).
 * 2. Style Champions: #1 of each style (if unlocked).
 * 3. Bubble Watch: Random selection from next 30 eligible ranks.
 */
export function committeeSelection(
  state: GameState, 
  tier: string, 
  seed: number, 
  lockedIds: Set<string>
): CommitteeSelectionResult {
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

/**
 * Generate a freelancer warrior for tournament filler.
 * This is a simple placeholder that will be replaced by TournamentFreelancerGenerator.
 */
function generateFreelancer(tier: string, index: number, rng: SeededRNG): Warrior {
  // Temporary implementation - will be moved to TournamentFreelancerGenerator
  const styles = Object.values(FightingStyle);
  const style = rng.pick(styles);
  const pool = tier === "Gold" ? 120 : tier === "Silver" ? 100 : tier === "Bronze" ? 85 : 70;
  const attrs = { ST: 5, CN: 5, SZ: 10, WT: 10, WL: 10, SP: 5, DF: 5 };
  let remaining = pool - 50;
  const keys: (keyof typeof attrs)[] = ["ST", "CN", "SP", "DF", "WL", "WT"];
  while (remaining > 0) {
    const key = rng.pick(keys);
    if (attrs[key] < 25) { attrs[key]++; remaining--; }
  }
  
  // Import makeWarrior to avoid circular dependency
  const { makeWarrior } = require("../../../factories");
  return makeWarrior(undefined, `Freelancer ${rng.pick(["Thrax", "Murmillo", "Kaeso"])} #${index}`, style, attrs, {}, rng);
}
