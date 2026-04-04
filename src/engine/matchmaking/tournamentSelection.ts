import type { GameState, Warrior, RivalStableData, TournamentEntry, TournamentBout, WarriorStatus } from "@/types/game";
import { makeWarrior } from "@/engine/factories";
import { FightingStyle } from "@/types/shared.types";
import { SeededRNG } from "@/utils/random";
import { simulateFight, aiPlanForWarrior, defaultPlanForWarrior } from "@/engine";
import { updateEntityInList } from "@/utils/stateUtils";
import { generateId } from "@/utils/idUtils";

/**
 * TournamentSelectionService - Handles qualification and filler logic for 64-man tournaments.
 */
export const TournamentSelectionService = {
  // 🏛️ Engine Resolution: Progress the tournament by one round
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
    const resultsNews: string[] = [];

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
      
      const winnerName = outcome.winner === "A" ? bout.a : bout.d;
      winners.push(winnerName);
      
      // Update records and history
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

    // Update tournament state
    updatedState.tournaments = (updatedState.tournaments || []).map(t => 
      t.id === tournamentId ? { ...t, bracket, completed: isComplete, champion } : t
    );

    if (isComplete && champion) {
      resultsNews.push(`🏆 CHAMPION: ${champion} has won the ${tournament.name}!`);
    }

    return { updatedState, roundResults: resultsNews };
  },

  /**
   * Resolves an entire tournament to completion in one go.
   * Useful for AI-only tiers or headless testing.
   */
  resolveCompleteTournament(state: GameState, tournamentId: string, seed: number): GameState {
    let current = { ...state };
    let safety = 0;
    while (safety < 10) { // Max 6 rounds for 64-man + padding
      const tour = (current.tournaments || []).find(t => t.id === tournamentId);
      if (!tour || tour.completed) break;
      const result = this.resolveRound(current, tournamentId, seed + safety);
      current = result.updatedState;
      safety++;
    }
    return current;
  },

  /** Helper: Find warrior by name across player/rivals/tournament-participants */
  findWarrior(state: GameState, name: string, tournament?: TournamentEntry): Warrior | undefined {
    const playerW = state.roster.find(w => w.name === name);
    if (playerW) return playerW;
    
    for (const r of (state.rivals || [])) {
      const rw = r.roster.find(w => w.name === name);
      if (rw) return rw;
    }

    if (tournament) {
      const tourW = tournament.participants.find(w => w.name === name);
      if (tourW) return tourW;
    }

    return undefined;
  },

  /** Helper: Get AI plan for tournament warrior */
  getAIPlan(state: GameState, w: Warrior) {
     const rival = (state.rivals || []).find(r => r.roster.some(rw => rw.name === w.name));
     if (!rival) return { ...defaultPlanForWarrior(w), killDesire: 7 };
     const plan = aiPlanForWarrior(w, rival.owner.personality || "Pragmatic", rival.philosophy || "Opportunist", undefined, rival.strategy?.intent);
     return { ...plan, killDesire: 7 }; // Force championship stakes
  },

  /** Helper: Apply updates after tournament bout */
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
        seasonPoints: (w.seasonPoints || 0) + (isWinner ? 3 : 0) + (didKill ? 5 : 0)
      };
    };

    // Update Player Roster
    updatedState.roster = updatedState.roster.map(w => {
      if (w.id === wA.id) return updateWarrior(w, true);
      if (w.id === wD.id) return updateWarrior(w, false);
      return w;
    });

    // Update Rivals
    updatedState.rivals = (updatedState.rivals || []).map(r => ({
      ...r,
      roster: r.roster.map(w => {
        if (w.id === wA.id) return updateWarrior(w, true);
        if (w.id === wD.id) return updateWarrior(w, false);
        return w;
      })
    }));

    if (isKill) {
       const deadA = winnerSide === "D";
       const victim = deadA ? wA : wD;
       const deadWarrior = updateWarrior(victim, deadA);
       
       // Record in Graveyard
       updatedState.graveyard = [...(updatedState.graveyard || []), { 
         ...deadWarrior, 
         status: "Dead",
         deathWeek: state.week,
       }];

       // Filter from Roster/Rivals
       updatedState.roster = updatedState.roster.filter(w => w.id !== deadWarrior.id);
       updatedState.rivals = (updatedState.rivals || []).map(r => ({
         ...r,
         roster: r.roster.filter(w => w.id !== deadWarrior.id)
       }));

       // If it was a stabled warrior, add a memorial news item
       const rivalOwner = (state.rivals || []).find(r => r.owner.id === deadWarrior.stableId);
       if (rivalOwner || state.player.id === deadWarrior.stableId) {
         updatedState.newsletter = [...(updatedState.newsletter || []), {
           week: state.week,
           title: "⚰️ FUNERAL RITES",
           items: [`${deadWarrior.name} of ${rivalOwner?.owner.stableName || "your stable"} has been killed in the tournament.`]
         }];
       }
    }

    return updatedState;
  },

  /**
   * Selects the top 64 warriors for a specific tier.
   * If not enough stable-affiliated warriors, generates NPC freelancers.
   */
  selectQualifiedWarriors(state: GameState, tier: string, seed: number): { warriors: Warrior[]; stabledIds: string[] } {
    const rng = new SeededRNG(seed);
    const qualified: Warrior[] = [];
    
    // 1. Collect all stable-affiliated warriors in this tier
    const worldWarriors: { warrior: Warrior; stable: RivalStableData | null }[] = [];
    
    // Rivals
    (state.rivals || []).forEach(r => {
      if (r.tier === tier) {
        r.roster.forEach(w => {
          if (w.status === "Active") {
            worldWarriors.push({ warrior: w, stable: r });
          }
        });
      }
    });

    // Player (if matching tier)
    if (state.player.renown === (tier === "Legendary" ? 5 : tier === "Major" ? 2 : tier === "Established" ? 1 : 0)) {
      state.roster.forEach(w => {
         if (w.status === "Active") {
           worldWarriors.push({ warrior: w, stable: null });
         }
      });
    }

    // 2. Rank by Season Points (Wins/Kills)
    // Formula: (Wins * 3) + (Kills * 5) + (Fame / 10)
    const ranked = worldWarriors.sort((a, b) => {
      const scoreA = (a.warrior.career?.wins || 0) * 3 + (a.warrior.career?.kills || 0) * 5 + (a.warrior.fame || 0) / 10;
      const scoreB = (b.warrior.career?.wins || 0) * 3 + (b.warrior.career?.kills || 0) * 5 + (b.warrior.fame || 0) / 10;
      return scoreB - scoreA;
    });

    // Take top 64 (or all available if < 64)
    const elite = ranked.slice(0, 64).map(r => r.warrior);
    qualified.push(...elite);

    // 3. Fill with NPC Freelancers if < 64
    const fillersNeeded = 64 - qualified.length;
    for (let i = 0; i < fillersNeeded; i++) {
        const freelancer = this.generateFreelancer(tier, i, rng);
        qualified.push(freelancer);
    }

    return { 
      warriors: qualified.slice(0, 64), 
      stabledIds: elite.map(w => w.id) 
    };
  },

  /**
   * Generates a full 64-man tournament entry for a given week and season.
   */
  generateTournament(state: GameState, tier: string, week: number, season: string, seed: number): TournamentEntry {
    const { warriors } = this.selectQualifiedWarriors(state, tier, seed);
    const shuffled = [...warriors].sort(() => Math.random() - 0.5);
    
    const bracket: TournamentBout[] = [];
    // Round 1 has 32 matches
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
      id: `t_${tier.toLowerCase()}_${week}`,
      season: season as any,
      week,
      name: `${season} ${tier} Grand Championship`,
      bracket,
      participants: warriors,
      completed: false
    };
  },

  /**
   * Generates a "Freelancer" NPC to fill tournament brackets.
   * Tier influences their attribute pool.
   */
  generateFreelancer(tier: string, index: number, rng: SeededRNG): Warrior {
    const styles = Object.values(FightingStyle);
    const style = rng.pick(styles);
    
    // Attribute Pool scaling
    // Minor: 70 pts, Established: 85 pts, Major: 100 pts, Legendary: 120 pts
    const pool = tier === "Legendary" ? 120 : tier === "Major" ? 100 : tier === "Established" ? 85 : 70;
    
    const attrs = {
      ST: 5, CN: 5, SZ: 10, WT: 10, WL: 10, SP: 5, DF: 5
    };
    
    let remaining = pool - (5+5+10+10+10+5+5);
    const keys: (keyof typeof attrs)[] = ["ST", "CN", "SP", "DF", "WL", "WT"];
    
    while (remaining > 0) {
      const key = rng.pick(keys);
      if (attrs[key] < 25) {
        attrs[key]++;
        remaining--;
      }
    }

    return makeWarrior(
      undefined, 
      `Freelancer ${rng.pick(["Thrax", "Murmillo", "Retiarius", "Dimachaerus"])} #${index}`,
      style,
      attrs,
      {},
      () => rng.next()
    );
  }
};
