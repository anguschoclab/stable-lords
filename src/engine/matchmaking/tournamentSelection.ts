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

      const tournament = this.buildTournament(tierConfig.id, tierConfig.name, warriors, week, season, rng);
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
        const freelancer = this.generateFreelancer(tier, i, rng);
        qualified.push(freelancer);
      }
    }

    return { warriors: qualified.slice(0, 64), updatedLockedIds: newLocks };
  },

  buildTournament(tierId: string, name: string, participants: Warrior[], week: number, season: string, rng: SeededRNG): TournamentEntry {
    const shuffled = rng.shuffle([...participants]);
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
        stableA: shuffled[i].stableId, // snapshots current stable name if needed
        stableD: shuffled[i+1].stableId,
      });
    }

    return {
      id: rng.uuid("tou"),
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
    const winners: { id: string; name: string; stableId?: string }[] = [];
    const losers: { id: string; name: string; stableId?: string }[] = [];

    for (const bout of roundBouts) {
      if (bout.d === "(bye)") {
        bout.winner = "A";
        winners.push({ id: bout.warriorIdA, name: bout.a, stableId: bout.stableIdA });
        continue;
      }

      const wA = this.findWarriorById(updatedState, bout.warriorIdA, tournament);
      const wD = this.findWarriorById(updatedState, bout.warriorIdD, tournament);

      if (!wA || !wD) {
        bout.winner = wA ? "A" : "D";
        const winnerObj = wA ? { id: wA.id, name: wA.name, stableId: wA.stableId } : (wD ? { id: wD.id, name: wD.name, stableId: wD.stableId } : undefined);
        if (winnerObj) winners.push(winnerObj);
        continue;
      }

      const planA = wA.plan || this.getAIPlan(updatedState, wA, wD.style, wD.stableId);
      const planD = wD.plan || this.getAIPlan(updatedState, wD, wA.style, wA.stableId);
      
      const outcome = simulateFight(planA, planD, wA, wD, rng.roll(0, 1000000), updatedState.trainers, updatedState.weather);
      
      
      bout.winner = outcome.winner;
      bout.by = outcome.by;
      bout.fightId = rng.uuid("bt");
      
      winners.push(outcome.winner === "A" ? { id: wA.id, name: wA.name, stableId: wA.stableId } : { id: wD.id, name: wD.name, stableId: wD.stableId });
      losers.push(outcome.winner === "A" ? { id: wD.id, name: wD.name, stableId: wD.stableId } : { id: wA.id, name: wA.name, stableId: wA.stableId });
      updatedState = this.applyBoutResults(updatedState, wA, wD, outcome, tournament.id, tournament.name, rng);
    }

    // Generate next round pairings
    if (winners.length > 1) {
      const nextRound = currentRound + 1;
      
      // Standard Bracket progression
      for (let i = 0; i < winners.length; i += 2) {
        if (i + 1 < winners.length) {
          bracket.push({ 
            round: nextRound, 
            matchIndex: i / 2, 
            a: winners[i].name, 
            d: winners[i + 1].name,
            warriorIdA: winners[i].id,
            warriorIdD: winners[i+1].id,
            stableIdA: winners[i].stableId,
            stableIdD: winners[i+1].stableId
          });
        } else {
          bracket.push({ 
            round: nextRound, 
            matchIndex: i / 2, 
            a: winners[i].name, 
            d: "(bye)", 
            warriorIdA: winners[i].id,
            warriorIdD: "bye",
            winner: "A" 
          });
        }
      }

      // 🥉 Bronze Match Injection: If we just finished Semi-Finals (Round 5, winners.length === 2)
      if (currentRound === 5 && losers.length === 2) {
        const bronzeBout: TournamentBout = { 
          round: 6, // Bronze Match happens alongside the Finals
          matchIndex: 1, // Finals is index 0
          a: losers[0].name, 
          d: losers[1].name,
          warriorIdA: losers[0].id,
          warriorIdD: losers[1].id,
          stableIdA: losers[0].stableId,
          stableIdD: losers[1].id
        };
        bracket.push(bronzeBout);
      }
    }

    const isComplete = winners.length <= 1 && currentRound >= 6;
    const champion = isComplete ? winners[0].name : undefined;

    updatedState.tournaments = (updatedState.tournaments || []).map(t => 
      t.id === tournamentId ? { ...t, bracket, completed: isComplete, champion } : t
    );

    if (isComplete && champion) {
       updatedState = this.awardTournamentPrizes(updatedState, tournamentId, rng);
    }

    return { updatedState, roundResults: isComplete && champion ? [`🏆 CHAMPION: ${champion} has won the ${tournament.name}!`] : [] };
  },

  /**
   * Final Prize Distribution (v1.0 Logic)
   * 1st: Gold Purse (100%) + Stable Slot
   * 2nd: Gold Purse (50%) + Weapon Insight Token
   * 3rd: Gold Purse (25%) + Rhythm Insight Token
   */
  awardTournamentPrizes(state: GameState, tournamentId: string, rng: SeededRNG): GameState {
    const tournament = state.tournaments.find(t => t.id === tournamentId);
    if (!tournament) return state;

    const bracket = tournament.bracket;
    const finals = bracket.find(b => b.round === 6 && b.matchIndex === 0);
    const bronze = bracket.find(b => b.round === 6 && b.matchIndex === 1);

    if (!finals) return state;

    const first = finals.winner === "A" ? finals.warriorIdA : finals.warriorIdD;
    const second = finals.winner === "A" ? finals.warriorIdD : finals.warriorIdA;
    const third = bronze ? (bronze.winner === "A" ? bronze.warriorIdA : bronze.warriorIdD) : undefined;

    let updatedState = { ...state };
    const tier = tournament.id.split("_")[1].toUpperCase(); // "GOLD", "SILVER", etc.
    const basePurse = tier === "GOLD" ? 5000 : tier === "SILVER" ? 2500 : tier === "BRONZE" ? 1200 : 600;

    const award = (warriorId: string, place: 1 | 2 | 3, awardRng: SeededRNG) => {
      const w = this.findWarriorById(updatedState, warriorId, tournament);
      if (!w) return;

      const isPlayer = w.stableId === updatedState.player.id;
      const purseMult = place === 1 ? 1.0 : place === 2 ? 0.5 : 0.25;
      const prizeGold = Math.floor(basePurse * purseMult);
      const prizeFame = place === 1 ? 100 : place === 2 ? 50 : 25;

      // 1. Update Carrier Medals
      updatedState = this.modifyWarrior(updatedState, w.id, (draft) => {
        if (!draft.career.medals) draft.career.medals = { gold: 0, silver: 0, bronze: 0 };
        if (place === 1) draft.career.medals.gold++;
        if (place === 2) draft.career.medals.silver++;
        if (place === 3) draft.career.medals.bronze++;
        draft.fame = (draft.fame || 0) + prizeFame;
      });

      // 2. Financials & Specific Rewards
      if (isPlayer) {
        updatedState.treasury += prizeGold;
        updatedState.ledger.push({ 
          id: awardRng.uuid("led"),
          week: updatedState.week, 
          label: `${tournament.name} (${place}${place === 1 ? 'st' : place === 2 ? 'nd' : 'rd'})`, 
          amount: prizeGold, 
          category: "prize" 
        });
        updatedState.fame = (updatedState.fame || 0) + prizeFame;
        updatedState.player = { ...updatedState.player, fame: (updatedState.player.fame || 0) + prizeFame };

        if (place === 1) {
          updatedState.rosterBonus = (updatedState.rosterBonus || 0) + 1;
        } else if (place === 2) {
          // Add Weapon Token
          updatedState.insightTokens = [...(updatedState.insightTokens || []), {
            id: awardRng.uuid("ins"),
            type: "Weapon",
            warriorId: "",
            warriorName: "Unassigned",
            detail: `Earned from ${tournament.name} (🥈)`,
            discoveredWeek: updatedState.week
          }];
        } else if (place === 3) {
          // Add Rhythm Token
          updatedState.insightTokens = [...(updatedState.insightTokens || []), {
            id: awardRng.uuid("ins"),
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
          r.owner.id === w.stableId ? { ...r, treasury: r.treasury + prizeGold, fame: (r.fame || 0) + prizeFame } : r
        );
      }
    };

    award(first, 1, rng);
    award(second, 2, rng);
    if (third) award(third, 3, rng);

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

  findWarriorById(state: GameState, warriorId: string, tournament?: TournamentEntry): Warrior | undefined {
    const playerW = state.roster.find(w => w.id === warriorId);
    if (playerW) return playerW;
    for (const r of state.rivals) {
      const rw = r.roster.find(w => w.id === warriorId);
      if (rw) return rw;
    }
    return tournament?.participants.find(w => w.id === warriorId);
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

  applyBoutResults(
    state: GameState, 
    wA: Warrior, 
    wD: Warrior, 
    outcome: import("@/types/game").FightOutcome, 
    tId: string, 
    tName: string,
    rng: SeededRNG
  ): GameState {
    const isKill = outcome.by === "Kill";
    const winnerSide = outcome.winner;
    const updatedState = { ...state };

    const summary: import("@/types/state.types").FightSummary = {
      id: rng.uuid("bout"),
      week: state.week,
      phase: "resolution" as const,
      tournamentId: tId,
      title: `${wA.name} vs ${wD.name} (${tName})`,
      a: wA.name,
      d: wD.name,
      warriorIdA: wA.id,
      warriorIdD: wD.id,
      stableIdA: wA.stableId,
      stableIdD: wD.stableId,
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
    return makeWarrior(undefined, `Freelancer ${rng.pick(["Thrax", "Murmillo", "Kaeso"])} #${index}`, style, attrs, {}, rng);
  }
};
