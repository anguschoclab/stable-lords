import type { GameState, Warrior, RivalStableData, TournamentEntry, TournamentBout } from "@/types/state.types";
import { type WarriorStatus } from "@/types/warrior.types";
import { makeWarrior } from "@/engine/factories";
import { FightingStyle } from "@/types/shared.types";
import { SeededRNG } from "@/utils/random";
import { simulateFight, aiPlanForWarrior, defaultPlanForWarrior } from "@/engine";
import { generateId } from "@/utils/idUtils";

/**
 * Stable Lords — Tournament Selection Committee (v1.0)
 * Implements a 4-tier NCAA-style loop for 256-warrior seasonal coverage.
 */

export const TOURNAMENT_TIERS = [
  { id: "Gold", name: "Imperial Gold Cup", minRank: 1, maxRank: 64 },
  { id: "Silver", name: "Proconsul Silver Plate", minRank: 65, maxRank: 128 },
  { id: "Bronze", name: "Steel Bronze Gauntlet", minRank: 129, maxRank: 192 },
  { id: "Iron", name: "Foundry Iron Trials", minRank: 193, maxRank: 256 }
];

export const TournamentSelectionService = {
  
  /**
   * Generates all 4 seasonal tournaments using the committee selection logic.
   */
  generateSeasonalTiers(state: GameState, week: number, season: string, seed: number): TournamentEntry[] {
    const rng = new SeededRNG(seed);
    const tournaments: TournamentEntry[] = [];
    const lockedWarriorIds = new Set<string>();

    TOURNAMENT_TIERS.forEach((tierConfig, idx) => {
      const { warriors, updatedLockedIds } = this.committeeSelection(state, tierConfig.id, seed + idx, lockedWarriorIds);
      
      // Update locked IDs for the next tier
      updatedLockedIds.forEach(id => lockedWarriorIds.add(id));

      const tournament = this.buildTournament(tierConfig.id, tierConfig.name, warriors, week, season);
      tournaments.push(tournament);
    });

    return tournaments;
  },

  /**
   * The "Committee" Model:
   * 1. Top 40 by Composite Rank (unlocked).
   * 2. Style Champions: #1 of each style (if unlocked).
   * 3. Bubble Watch: Random selection from next 30 eligible ranks.
   */
  committeeSelection(
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
        const freelancer = this.generateFreelancer(tier, i, rng);
        qualified.push(freelancer);
      }
    }

    return { warriors: qualified.slice(0, 64), updatedLockedIds: newLocks };
  },

  buildTournament(tierId: string, name: string, participants: Warrior[], week: number, season: string): TournamentEntry {
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const bracket: TournamentBout[] = [];
    
    for (let i = 0; i < 64; i += 2) {
      bracket.push({
        round: 1,
        matchIndex: i / 2,
        a: shuffled[i].name,
        d: shuffled[i+1].name,
        stableA: shuffled[i].stableId,
        stableD: shuffled[i+1].stableId,
      });
    }

    return {
      id: `t_${tierId.toLowerCase()}_${week}`,
      season: season as any,
      week,
      name,
      bracket,
      participants,
      completed: false
    };
  },

  // 🏛️ Engine Resolution (Modular for Round-by-Round or Instant)
  resolveRound(state: GameState, tournamentId: string, seed: number): { updatedState: GameState; roundResults: string[] } {
    const rng = new SeededRNG(seed);
    let updatedState = { ...state };
    const tournament = (updatedState.tournaments || []).find(t => t.id === tournamentId);
    if (!tournament || tournament.completed) return { updatedState, roundResults: [] };

    const bracket = [...tournament.bracket];
    const unresolved = bracket.filter(b => b.winner === undefined);
    if (unresolved.length === 0) return { updatedState, roundResults: [] };

    const currentRound = Math.min(...unresolved.map(b => b.round));
    const roundBouts = unresolved.filter(b => b.round === currentRound);
    const winners: string[] = [];

    for (const bout of roundBouts) {
      if (bout.d === "(bye)") {
        bout.winner = "A";
        winners.push(bout.a);
        continue;
      }

      const wA = this.findWarrior(updatedState, bout.a, tournament);
      const wD = this.findWarrior(updatedState, bout.d, tournament);

      if (!wA || !wD) {
        bout.winner = wA ? "A" : "D";
        winners.push(wA?.name || wD?.name || "");
        continue;
      }

      const planA = wA.plan || this.getAIPlan(updatedState, wA);
      const planD = wD.plan || this.getAIPlan(updatedState, wD);
      
      const outcome = simulateFight(planA, planD, wA, wD, rng.roll(0, 1000000), updatedState.trainers, updatedState.weather);
      
      bout.winner = outcome.winner;
      bout.by = outcome.by;
      bout.fightId = `tf_${tournament.id}_${bout.round}_${bout.matchIndex}`;
      
      winners.push(outcome.winner === "A" ? bout.a : bout.d);
      updatedState = this.applyBoutResults(updatedState, wA, wD, outcome, tournament.id, tournament.name);
    }

    // Generate next round pairings
    if (winners.length > 1) {
      const nextRound = currentRound + 1;
      for (let i = 0; i < winners.length; i += 2) {
        if (i + 1 < winners.length) {
          bracket.push({ round: nextRound, matchIndex: i / 2, a: winners[i], d: winners[i + 1] });
        } else {
          bracket.push({ round: nextRound, matchIndex: i / 2, a: winners[i], d: "(bye)", winner: "A" });
        }
      }
    }

    const isComplete = winners.length <= 1;
    const champion = isComplete ? winners[0] : undefined;

    updatedState.tournaments = (updatedState.tournaments || []).map(t => 
      t.id === tournamentId ? { ...t, bracket, completed: isComplete, champion } : t
    );

    return { updatedState, roundResults: isComplete && champion ? [`🏆 CHAMPION: ${champion} has won the ${tournament.name}!`] : [] };
  },

  resolveCompleteTournament(state: GameState, tournamentId: string, seed: number): GameState {
    let current = { ...state };
    let safety = 0;
    while (safety < 10) {
      const tour = (current.tournaments || []).find(t => t.id === tournamentId);
      if (!tour || tour.completed) break;
      const result = this.resolveRound(current, tournamentId, seed + safety);
      current = result.updatedState;
      safety++;
    }
    return current;
  },

  findWarrior(state: GameState, name: string, tournament?: TournamentEntry): Warrior | undefined {
    const playerW = state.roster.find(w => w.name === name);
    if (playerW) return playerW;
    for (const r of state.rivals) {
      const rw = r.roster.find(w => w.name === name);
      if (rw) return rw;
    }
    return tournament?.participants.find(w => w.name === name);
  },

  getAIPlan(state: GameState, w: Warrior) {
     const rival = state.rivals.find(r => r.roster.some(rw => rw.name === w.name));
     if (!rival) return { ...defaultPlanForWarrior(w), killDesire: 7 };
     const plan = aiPlanForWarrior(w, rival.owner.personality || "Pragmatic", rival.philosophy || "Opportunist", undefined, rival.strategy?.intent);
     return { ...plan, killDesire: 7 };
  },

  applyBoutResults(state: GameState, wA: Warrior, wD: Warrior, outcome: any, tId: string, tName: string): GameState {
    const isKill = outcome.by === "Kill";
    const winnerSide = outcome.winner;
    const updatedState = { ...state };

    const summary: any = {
      id: `tf_${tId}_${generateId()}`,
      week: state.week,
      phase: "resolution" as const,
      tournamentId: tId,
      title: `${wA.name} vs ${wD.name} (${tName})`,
      a: wA.name,
      d: wD.name,
      winner: winnerSide,
      by: outcome.by,
      styleA: wA.style,
      styleD: wD.style,
      transcript: outcome.log.map((e: any) => e.text),
      createdAt: new Date().toISOString(),
    };

    updatedState.arenaHistory = [...(updatedState.arenaHistory || []), summary].slice(-500);

    const updateWarrior = (w: Warrior, isAttacker: boolean) => {
      const isWinner = (isAttacker && winnerSide === "A") || (!isAttacker && winnerSide === "D");
      const didKill = isWinner && isKill;
      const isVictim = !isWinner && isKill;
      
      return {
        ...w,
        status: (isVictim ? "Dead" : "Active") as WarriorStatus,
        fatigue: isVictim ? 0 : Math.min(100, (w.fatigue || 0) + 25),
        career: {
          ...w.career,
          wins: (w.career?.wins || 0) + (isWinner ? 1 : 0),
          losses: (w.career?.losses || 0) + (isWinner ? 0 : 1),
          kills: (w.career?.kills || 0) + (didKill ? 1 : 0),
        },
        fame: Math.max(0, (w.fame || 0) + (isWinner ? (didKill ? 3 : 1) : 0)),
      };
    };

    updatedState.roster = updatedState.roster.map(w => {
      if (w.id === wA.id) return updateWarrior(w, true);
      if (w.id === wD.id) return updateWarrior(w, false);
      return w;
    });

    updatedState.rivals = updatedState.rivals.map(r => ({
      ...r,
      roster: r.roster.map(w => {
        if (w.id === wA.id) return updateWarrior(w, true);
        if (w.id === wD.id) return updateWarrior(w, false);
        return w;
      })
    }));

    if (isKill) {
       const victim = winnerSide === "D" ? wA : wD;
       updatedState.graveyard = [...(updatedState.graveyard || []), { ...victim, status: "Dead", deathWeek: state.week }];
       updatedState.roster = updatedState.roster.filter(w => w.id !== victim.id);
       updatedState.rivals = updatedState.rivals.map(r => ({ ...r, roster: r.roster.filter(w => w.id !== victim.id) }));
    }

    return updatedState;
  },

  generateFreelancer(tier: string, index: number, rng: SeededRNG): Warrior {
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
    return makeWarrior(undefined, `Freelancer ${rng.pick(["Thrax", "Murmillo", "Kaeso"])} #${index}`, style, attrs, {}, () => rng.next());
  }
};
