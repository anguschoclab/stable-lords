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
      season: season as import("@/types/game").Season,
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
    const losers: string[] = [];

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

      const planA = wA.plan || this.getAIPlan(updatedState, wA, wD.style, wD.stableId);
      const planD = wD.plan || this.getAIPlan(updatedState, wD, wA.style, wA.stableId);
      
      const outcome = simulateFight(planA, planD, wA, wD, rng.roll(0, 1000000), updatedState.trainers, updatedState.weather);
      
      
      bout.winner = outcome.winner;
      bout.by = outcome.by;
      bout.fightId = `tf_${tournament.id}_${bout.round}_${bout.matchIndex}`;
      
      winners.push(outcome.winner === "A" ? bout.a : bout.d);
      losers.push(outcome.winner === "A" ? bout.d : bout.a);
      updatedState = this.applyBoutResults(updatedState, wA, wD, outcome, tournament.id, tournament.name);
    }

    // Generate next round pairings
    if (winners.length > 1) {
      const nextRound = currentRound + 1;
      
      // Standard Bracket progression
      for (let i = 0; i < winners.length; i += 2) {
        if (i + 1 < winners.length) {
          bracket.push({ round: nextRound, matchIndex: i / 2, a: winners[i], d: winners[i + 1] });
        } else {
          bracket.push({ round: nextRound, matchIndex: i / 2, a: winners[i], d: "(bye)", winner: "A" });
        }
      }

      // 🥉 Bronze Match Injection: If we just finished Semi-Finals (Round 5, winners.length === 2)
      if (currentRound === 5 && losers.length === 2) {
        bracket.push({ 
          round: 6, // Bronze Match happens alongside the Finals
          matchIndex: 1, // Finals is index 0
          a: losers[0], 
          d: losers[1],
          label: "Bronze Match" 
        } as import("@/types/game").TournamentEntry);
      }
    }

    const isComplete = winners.length <= 1 && currentRound >= 6;
    const champion = isComplete ? winners[0] : undefined;

    updatedState.tournaments = (updatedState.tournaments || []).map(t => 
      t.id === tournamentId ? { ...t, bracket, completed: isComplete, champion } : t
    );

    if (isComplete && champion) {
       updatedState = this.awardTournamentPrizes(updatedState, tournamentId);
    }

    return { updatedState, roundResults: isComplete && champion ? [`🏆 CHAMPION: ${champion} has won the ${tournament.name}!`] : [] };
  },

  /**
   * Final Prize Distribution (v1.0 Logic)
   * 1st: Gold Purse (100%) + Stable Slot
   * 2nd: Gold Purse (50%) + Weapon Insight Token
   * 3rd: Gold Purse (25%) + Rhythm Insight Token
   */
  awardTournamentPrizes(state: GameState, tournamentId: string): GameState {
    const tournament = state.tournaments.find(t => t.id === tournamentId);
    if (!tournament) return state;

    const bracket = tournament.bracket;
    const finals = bracket.find(b => b.round === 6 && b.matchIndex === 0);
    const bronze = bracket.find(b => b.round === 6 && b.matchIndex === 1);

    if (!finals) return state;

    const first = finals.winner === "A" ? finals.a : finals.d;
    const second = finals.winner === "A" ? finals.d : finals.a;
    const third = bronze ? (bronze.winner === "A" ? bronze.a : bronze.d) : undefined;

    let updatedState = { ...state };
    const tier = tournament.id.split("_")[1].toUpperCase(); // "GOLD", "SILVER", etc.
    const basePurse = tier === "GOLD" ? 5000 : tier === "SILVER" ? 2500 : tier === "BRONZE" ? 1200 : 600;

    const award = (name: string, place: 1 | 2 | 3) => {
      const w = this.findWarrior(updatedState, name, tournament);
      if (!w) return;

      const isPlayer = w.stableId === updatedState.player.id;
      const purseMult = place === 1 ? 1.0 : place === 2 ? 0.5 : 0.25;
      const prizeGold = Math.floor(basePurse * purseMult);

      // 1. Update Carrier Medals
      updatedState = this.modifyWarrior(updatedState, w.id, (draft) => {
        if (!draft.career.medals) draft.career.medals = { gold: 0, silver: 0, bronze: 0 };
        if (place === 1) draft.career.medals.gold++;
        if (place === 2) draft.career.medals.silver++;
        if (place === 3) draft.career.medals.bronze++;
      });

      // 2. Financials & Specific Rewards
      if (isPlayer) {
        updatedState.gold += prizeGold;
        updatedState.ledger.push({ 
          week: updatedState.week, 
          label: `${tournament.name} (${place}${place === 1 ? 'st' : place === 2 ? 'nd' : 'rd'})`, 
          amount: prizeGold, 
          category: "prize" 
        });

        if (place === 1) {
          updatedState.rosterBonus = (updatedState.rosterBonus || 0) + 1;
        } else if (place === 2) {
          // Add Weapon Token
          updatedState.insightTokens = [...(updatedState.insightTokens || []), {
            id: generateId(),
            type: "Weapon",
            warriorId: "",
            warriorName: "Unassigned",
            detail: `Earned from ${tournament.name} (🥈)`,
            discoveredWeek: updatedState.week
          }];
        } else if (place === 3) {
          // Add Rhythm Token
          updatedState.insightTokens = [...(updatedState.insightTokens || []), {
            id: generateId(),
            type: "Rhythm",
            warriorId: "",
            warriorName: "Unassigned",
            detail: `Earned from ${tournament.name} (🥉)`,
            discoveredWeek: updatedState.week
          }];
        }
      } else {
        // Rival reward logic
        updatedState.rivals = updatedState.rivals.map(r => 
          r.owner.id === w.stableId ? { ...r, gold: r.gold + prizeGold } : r
        );
      }
    };

    award(first, 1);
    award(second, 2);
    if (third) award(third, 3);

    return updatedState;
  },

  modifyWarrior(state: GameState, warriorId: string, transform: (w: Warrior) => void): GameState {
    const updatedState = { ...state };
    let found = false;

    updatedState.roster = updatedState.roster.map(w => {
      if (w.id === warriorId) { found = true; const draft = { ...w }; transform(draft); return draft; }
      return w;
    });

    if (!found) {
      updatedState.rivals = updatedState.rivals.map(r => ({
        ...r,
        roster: r.roster.map(w => {
          if (w.id === warriorId) { const draft = { ...w }; transform(draft); return draft; }
          return w;
        })
      }));
    }

    return updatedState;
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

  getAIPlan(state: GameState, w: Warrior, opponentStyle?: FightingStyle, opponentOwnerId?: string) {
     const rival = state.rivals.find(r => r.owner.id === w.stableId);
     if (!rival) return { ...defaultPlanForWarrior(w), killDesire: 7 };

     let grudgeIntensity = 0;
     if (opponentOwnerId) {
       const grudge = state.ownerGrudges?.find(g => 
         (g.ownerIdA === rival.owner.id && g.ownerIdB === opponentOwnerId) || 
         (g.ownerIdB === rival.owner.id && g.ownerIdA === opponentOwnerId)
       );
       grudgeIntensity = grudge?.intensity ?? 0;
     }

     return aiPlanForWarrior(
       w, 
       rival.owner.personality || "Pragmatic", 
       rival.owner.personality || "Opportunist", // Assuming personality maps to philosophy for AI
       opponentStyle, 
       rival.strategy?.intent,
       grudgeIntensity
     );
  },

  applyBoutResults(state: GameState, wA: Warrior, wD: Warrior, outcome: import("@/engine/boutProcessor").BoutResult, tId: string, tName: string): GameState {
    const isKill = outcome.by === "Kill";
    const winnerSide = outcome.winner;
    const updatedState = { ...state };

    const summary: import("@/types/game").FightSummary = {
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
      transcript: outcome.log.map((e: { text: string }) => e.text),
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
