
import type { GameState, Warrior, TournamentEntry, TournamentBout, FightSummary } from '@/types/state.types';
import { type WarriorStatus } from '@/types/warrior.types';
import { SeededRNG } from '@/utils/random';
import { simulateFight } from '@/engine/simulate';
import { findWarriorById, getAIPlan } from './utils';
import { awardTournamentPrizes } from './awards';
import type { FightOutcome } from '@/types/combat.types';

export function resolveRound(state: GameState, tournamentId: string, seed: number): { updatedState: GameState; roundResults: string[] } {
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

    const wA = findWarriorById(updatedState, bout.warriorIdA, tournament);
    const wD = findWarriorById(updatedState, bout.warriorIdD, tournament);

    if (!wA || !wD) {
      bout.winner = wA ? "A" : "D";
      const winnerObj = wA ? { id: wA.id, name: wA.name, stableId: wA.stableId } : (wD ? { id: wD.id, name: wD.name, stableId: wD.stableId } : undefined);
      if (winnerObj) winners.push(winnerObj);
      continue;
    }

    const planA = wA.plan || getAIPlan(updatedState, wA, wD.style, wD.stableId);
    const planD = wD.plan || getAIPlan(updatedState, wD, wA.style, wA.stableId);

    const outcome = simulateFight(planA, planD, wA, wD, rng.roll(0, 1000000), updatedState.trainers, updatedState.weather);


    bout.winner = outcome.winner;
    bout.by = outcome.by;
    bout.fightId = rng.uuid("bout");

    winners.push(outcome.winner === "A" ? { id: wA.id, name: wA.name, stableId: wA.stableId } : { id: wD.id, name: wD.name, stableId: wD.stableId });
    losers.push(outcome.winner === "A" ? { id: wD.id, name: wD.name, stableId: wD.stableId } : { id: wA.id, name: wA.name, stableId: wA.stableId });
    updatedState = applyBoutResults(updatedState, wA, wD, outcome, tournament.id, tournament.name, rng);
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
     updatedState = awardTournamentPrizes(tournament, updatedState);
  }

  return { updatedState, roundResults: isComplete && champion ? [`🏆 CHAMPION: ${champion} has won the ${tournament.name}!`] : [] };
}

export function resolveCompleteTournament(state: GameState, tournamentId: string, seed: number): GameState {
  let current = { ...state };
  let safety = 0;
  while (safety < 10) {
    const tour = (current.tournaments || []).find(t => t.id === tournamentId);
    if (!tour || tour.completed) break;
    const result = resolveRound(current, tournamentId, seed + safety);
    current = result.updatedState;
    safety++;
  }
  return current;
}

export function applyBoutResults(
  state: GameState,
  wA: Warrior,
  wD: Warrior,
  outcome: FightOutcome,
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
      }
      , fame: Math.max(0, (w.fame || 0) + (isWinner ? (didKill ? 3 : 1) : 0)),
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
}
