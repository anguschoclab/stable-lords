import { GameState, TournamentEntry, FightSummary, TournamentBout } from "@/types/game";
import { simulateFight, defaultPlanForWarrior, fameFromTags } from "@/engine";
import { killWarrior } from "@/state/gameStore";
import { ArenaHistory } from "@/engine/history/arenaHistory";
import { LoreArchive } from "@/lore/LoreArchive";
import { NewsletterFeed } from "@/engine/newsletter/feed";
import { StyleRollups } from "@/engine/stats/styleRollups";
import { getFightsForTournament } from "@/engine/core/historyUtils";

export interface ProcessTournamentRoundResult {
  updatedState: GameState;
  messages: string[];
  isComplete: boolean;
  champion?: string;
}

/**
 * Simulates a single round of a given tournament.
 * Extracts the monolithic logic from Tournaments.tsx.
 */
export function processTournamentRound(state: GameState, tournamentId: string): ProcessTournamentRoundResult {
  const currentTournament = state.tournaments.find((t) => t.id === tournamentId);
  if (!currentTournament || currentTournament.completed) {
    return { updatedState: state, messages: [], isComplete: true };
  }

  const bracket = [...currentTournament.bracket];
  const unresolved = bracket.filter((b) => b.winner === undefined);
  if (unresolved.length === 0) {
    return { updatedState: state, messages: [], isComplete: currentTournament.completed, champion: currentTournament.champion };
  }

  const currentRound = Math.min(...unresolved.map((b) => b.round));
  const roundBouts = unresolved.filter((b) => b.round === currentRound);

  let updatedState = { ...state };
  const winners: string[] = [];
  const messages: string[] = [];

  const findWarrior = (name: string) => {
    const player = updatedState.roster.find((w) => w.name === name);
    if (player) return player;
    for (const rival of (updatedState.rivals ?? [])) {
      const rw = rival.roster.find((w) => w.name === name);
      if (rw) return rw;
    }
    return undefined;
  };

  for (const bout of roundBouts) {
    if (bout.d === "(bye)") {
      bout.winner = "A";
      winners.push(bout.a);
      continue;
    }
    const wA = findWarrior(bout.a);
    const wD = findWarrior(bout.d);
    if (!wA || !wD) {
      bout.winner = wA ? "A" : wD ? "D" : null;
      winners.push(wA?.name ?? wD?.name ?? "");
      continue;
    }

    const planA = wA.plan ?? defaultPlanForWarrior(wA);
    const planD = wD.plan ?? defaultPlanForWarrior(wD);
    const outcome = simulateFight(planA, planD, wA, wD, undefined, updatedState.trainers, updatedState.weather);

    bout.winner = outcome.winner;
    bout.by = outcome.by;
    bout.fightId = `tf_${Date.now()}_${bout.matchIndex}_${Math.random().toString(36).substring(7)}`;

    const sIdA = bout.stableA;
    const sIdD = bout.stableD;
    const rvKey = sIdA && sIdD ? (sIdA < sIdD ? `${sIdA}|${sIdD}` : `${sIdD}|${sIdA}`) : null;
    const isRivalry = !!rvKey && state.rivalries?.some(r => (r.stableIdA === sIdA && r.stableIdB === sIdD) || (r.stableIdB === sIdA && r.stableIdA === sIdD));

    const winnerName = outcome.winner === "A" ? bout.a : outcome.winner === "D" ? bout.d : null;
    if (winnerName) winners.push(winnerName);

    if (outcome.by === "Kill") {
      const deadId = outcome.winner === "A" ? wD.id : wA.id;
      const killerName = outcome.winner === "A" ? wA.name : wD.name;
      updatedState = killWarrior(updatedState, deadId, killerName, `Killed in ${currentTournament.name}`);
    }

    const tags = outcome.post?.tags ?? [];
    const summary: FightSummary = {
      id: bout.fightId,
      week: state.week,
      phase: "resolution",
      tournamentId: currentTournament.id,
      title: `${bout.a} vs ${bout.d}`,
      a: bout.a,
      d: bout.d,
      winner: outcome.winner,
      by: outcome.by,
      styleA: wA.style,
      styleD: wD.style,
      stableA: sIdA,
      stableD: sIdD,
      isRivalry,
      flashyTags: tags,
      transcript: outcome.log.map((e) => e.text),
      createdAt: new Date().toISOString(),
    };

    updatedState.arenaHistory = [...updatedState.arenaHistory, summary];
    ArenaHistory.append(summary);
    LoreArchive.signalFight(summary);
    StyleRollups.addFight({ week: state.week, styleA: wA.style, styleD: wD.style, winner: outcome.winner, by: outcome.by, isTournament: currentTournament.id });
    NewsletterFeed.appendFightResult({ summary, transcript: outcome.log.map((e) => e.text) });

    if (outcome.winner) {
      const fameData = fameFromTags(tags);
      updatedState.fame = (updatedState.fame ?? 0) + fameData.fame;
      updatedState.player = { ...updatedState.player, fame: (updatedState.player.fame ?? 0) + fameData.fame };
    }

    updatedState.roster = updatedState.roster.map((w) => {
      if (w.id === wA.id) {
        return {
          ...w,
          career: {
            ...w.career,
            wins: w.career.wins + (outcome.winner === "A" ? 1 : 0),
            losses: w.career.losses + (outcome.winner === "D" ? 1 : 0),
            kills: w.career.kills + (outcome.by === "Kill" && outcome.winner === "A" ? 1 : 0),
          },
        };
      }
      if (w.id === wD.id) {
        return {
          ...w,
          career: {
            ...w.career,
            wins: w.career.wins + (outcome.winner === "D" ? 1 : 0),
            losses: w.career.losses + (outcome.winner === "A" ? 1 : 0),
            kills: w.career.kills + (outcome.by === "Kill" && outcome.winner === "D" ? 1 : 0),
          },
        };
      }
      return w;
    });
  }

  if (winners.length > 1) {
    const nextRound = currentRound + 1;
    for (let i = 0; i < winners.length; i += 2) {
      if (i + 1 < winners.length) {
        bracket.push({
          round: nextRound,
          matchIndex: Math.floor(i / 2),
          a: winners[i],
          d: winners[i + 1],
        });
      } else {
        bracket.push({
          round: nextRound,
          matchIndex: Math.floor(i / 2),
          a: winners[i],
          d: "(bye)",
          winner: "A",
        });
      }
    }
  }

  const remaining = bracket.filter((b) => b.winner === undefined);
  const isComplete = remaining.length === 0 && winners.length <= 1;
  const champion = winners.length === 1 ? winners[0] : undefined;

  const updatedTournament: TournamentEntry = {
    ...currentTournament,
    bracket,
    completed: isComplete,
    champion,
  };

  updatedState.tournaments = updatedState.tournaments.map((t) =>
    t.id === currentTournament.id ? updatedTournament : t
  );

  if (isComplete && champion) {
    const isPlayerChampion = updatedState.roster.some((w) => w.name === champion);

    if (isPlayerChampion) {
      updatedState.roster = updatedState.roster.map((w) =>
        w.name === champion
          ? {
              ...w,
              champion: true,
              fame: w.fame + 5,
              popularity: w.popularity + 3,
              titles: [...w.titles, updatedTournament.name],
            }
          : w
      );

      updatedState.rosterBonus = (updatedState.rosterBonus ?? 0) + 1;
      updatedState.fame = (updatedState.fame ?? 0) + 10;
      updatedState.player = { ...updatedState.player, titles: (updatedState.player.titles ?? 0) + 1 };

      messages.push(`🏆 ${champion} wins the ${updatedTournament.name}! +1 stable slot earned!`);
    } else {
      messages.push(`${champion} (rival) wins the ${updatedTournament.name}.`);
    }

    const tourneyFights = getFightsForTournament(updatedState.arenaHistory, currentTournament.id);
    if (tourneyFights.length > 0) {
      const best = tourneyFights.reduce((a, b) => {
        const sa = (b.flashyTags?.length ?? 0) + (b.by === "Kill" ? 3 : b.by === "KO" ? 2 : 0);
        const sb = (a.flashyTags?.length ?? 0) + (a.by === "Kill" ? 3 : a.by === "KO" ? 2 : 0);
        return sa > sb ? b : a;
      });
      LoreArchive.markFightOfTournament(state.week, best.id);
    }

    updatedState.newsletter = [...updatedState.newsletter, {
      week: state.week,
      title: `${updatedTournament.name} Results`,
      items: [
        `🏆 ${champion} is crowned champion of the ${updatedTournament.name}!`,
        `${tourneyFights.length} bouts fought across ${currentRound} rounds.`,
        ...tourneyFights.reduce((acc, f) => {
        if (f.by === "Kill") {
          acc.push(`☠️ ${f.winner === "A" ? f.a : f.d} slew ${f.winner === "A" ? f.d : f.a} during the tournament.`);
        }
        return acc;
      }, [] as string[]),
      ],
    }];
  } else {
    messages.push(`Round ${currentRound} complete! ${winners.length} advance.`);
  }

  return { updatedState, messages, isComplete, champion };
}
