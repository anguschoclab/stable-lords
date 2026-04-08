/**
 * Stable Lords — Seasonal Tournaments (Refactored)
 * Modularized for better maintainability and strict type safety.
 */
import React, { useState, useCallback, useMemo } from "react";
import { useGameStore } from "@/state/useGameStore";
import { simulateFight, defaultPlanForWarrior, fameFromTags, aiPlanForWarrior } from "@/engine";
import { type TournamentEntry, type TournamentBout, type FightSummary, type Warrior, FightingStyle } from "@/types/game";
import { generateId, hashStr } from "@/utils/idUtils";
import { SeededRNG } from "@/utils/random";
import { ArenaHistory } from "@/engine/history/arenaHistory";
import { LoreArchive } from "@/lore/LoreArchive";
import { NewsletterFeed } from "@/engine/newsletter/feed";
import { StyleRollups } from "@/engine/stats/styleRollups";
import { getFightsForTournament } from "@/engine/core/historyUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Play, UserPlus, FastForward } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

// Modular Components
import { TournamentBracket } from "@/components/tournaments/TournamentBracket";
import { TournamentHistory } from "@/components/tournaments/TournamentHistory";

const SEASON_NAMES: Record<string, string> = {
  Spring: "Spring Classic",
  Summer: "Summer Cup",
  Fall: "Fall Clash",
  Winter: "Winter Crown",
};

const SEASON_ICONS: Record<string, string> = {
  Spring: "🌿",
  Summer: "☀️",
  Fall: "🍂",
  Winter: "❄️",
};

export default function Tournaments() {
  const {
    tournaments,
    season,
    roster,
    rivals,
    trainers,
    weather,
    week,
    year,
    arenaHistory,
    player,
    rosterBonus,
    setState
  } = useGameStore();

  const [expandedBout, setExpandedBout] = useState<string | null>(null);

  const currentTournament = useMemo(
    () => tournaments.find((t) => t.season === season && !t.completed),
    [tournaments, season]
  );

  const activeWarriors = useMemo(() => roster.filter((w) => w.status === "Active"), [roster]);

  const pastTournaments = useMemo(
    () => tournaments.filter((t) => t.completed).reverse(),
    [tournaments]
  );

  const runNextRound = useCallback(() => {
    if (!currentTournament) return;
    
    // 1. Identify the current round to resolve
    const unresolved = currentTournament.bracket.filter(b => b.winner === undefined);
    if (unresolved.length === 0) return;
    
    const currentRoundNum = Math.min(...unresolved.map(b => b.round));
    const roundBoutsToProcess = unresolved.filter(b => b.round === currentRoundNum);

    setState((draft) => {
      const winners: string[] = [];

      const findWarrior = (name: string) => {
        const player = draft.roster.find((w: any) => w.name === name);
        if (player) return player;
        for (const rival of (draft.rivals ?? [])) {
          const rw = rival.roster.find((w: any) => w.name === name);
          if (rw) return rw;
        }
        return undefined;
      };

      const tournament = draft.tournaments.find((t: any) => t.id === currentTournament.id);
      if (!tournament) return;

      for (const boutData of roundBoutsToProcess) {
        const draftBout = tournament.bracket.find((b: any) => b.round === boutData.round && b.matchIndex === boutData.matchIndex);
        if (!draftBout) continue;

        if (draftBout.d === "(bye)") {
          draftBout.winner = "A";
          winners.push(draftBout.a);
          continue;
        }

        const wA = findWarrior(draftBout.a);
        const wD = findWarrior(draftBout.d);
        if (!wA || !wD) {
          draftBout.winner = wA ? "A" : "D";
          winners.push(wA?.name ?? wD?.name ?? "");
          continue;
        }

        const findRivalByWarrior = (name: string) => {
          return (draft.rivals ?? []).find((r: any) => r.roster.some((w: any) => w.name === name));
        };

        const getAIPlan = (w: Warrior) => {
          const rival = findRivalByWarrior(w.name);
          if (!rival) return defaultPlanForWarrior(w);
          return aiPlanForWarrior(w, rival.owner.personality || "Pragmatic", rival.philosophy || "Opportunist", undefined, rival.strategy?.intent);
        };

        const planA = wA.plan ?? (draft.roster.some((w: any) => w.name === draftBout.a) ? defaultPlanForWarrior(wA) : getAIPlan(wA));
        const planD = wD.plan ?? (draft.roster.some((w: any) => w.name === draftBout.d) ? defaultPlanForWarrior(wD) : getAIPlan(wD));
        
        const boutRng = new SeededRNG(hashStr(`${tournament.id}-${draftBout.round}-${draftBout.matchIndex}`));
        const outcome = simulateFight(planA, planD, wA, wD, () => boutRng.next(), draft.trainers, draft.weather);

        draftBout.winner = outcome.winner;
        draftBout.by = outcome.by;
        draftBout.fightId = generateId(boutRng, "bout");
        draftBout.warriorIdA = wA.id;
        draftBout.warriorIdD = wD.id;

        const winnerName = outcome.winner === "A" ? draftBout.a : outcome.winner === "D" ? draftBout.d : null;
        if (winnerName) winners.push(winnerName);

        if (outcome.by === "Kill") {
          const deadId = outcome.winner === "A" ? wD.id : wA.id;
          const killerName = outcome.winner === "A" ? wA.name : wD.name;
          
          const victim = draft.roster.find((w: any) => w.id === deadId);
          if (victim) {
            victim.status = "Dead";
            victim.isDead = true;
            victim.deathWeek = draft.week;
            victim.killedBy = killerName;
            draft.graveyard.push({ ...victim });
            draft.roster = draft.roster.filter((w: any) => w.id !== deadId);
          } else {
             for (const rival of draft.rivals) {
               const rvIndex = rival.roster.findIndex((w: any) => w.id === deadId);
               if (rvIndex !== -1) {
                 rival.roster.splice(rvIndex, 1);
                 break;
               }
             }
          }
        }

        const summary: FightSummary = {
          id: draftBout.fightId,
          week: draft.week,
          phase: "resolution",
          tournamentId: tournament.id,
          title: `${draftBout.a} vs ${draftBout.d}`,
          a: draftBout.a,
          d: draftBout.d,
          warriorIdA: wA.id,
          warriorIdD: wD.id,
          winner: outcome.winner,
          by: outcome.by,
          styleA: wA.style,
          styleD: wD.style,
          flashyTags: outcome.post?.tags ?? [],
          transcript: outcome.log.map((e: any) => e.text),
          createdAt: "Year " + draft.year + " Week " + draft.week,
        };
        draft.arenaHistory.push(summary);
        ArenaHistory.append(summary);
        LoreArchive.signalFight(summary);
        StyleRollups.addFight({
          week: draft.week,
          styleA: wA.style,
          styleD: wD.style,
          winner: outcome.winner,
          by: outcome.by,
          isTournament: tournament.id
        });
        NewsletterFeed.appendFightResult({ summary, transcript: outcome.log.map((e: any) => e.text) });

        if (outcome.winner) {
          const fameData = fameFromTags(outcome.post?.tags ?? []);
          const isPlayerSide = draft.roster.some((w: any) => w.id === wA.id || w.id === wD.id);
          if (isPlayerSide) {
             draft.player.fame = (draft.player.fame ?? 0) + fameData.fame;
          }
        }

        const updateCareer = (w: any) => {
           if (w.id === wA.id || w.id === wD.id) {
            const isWinner = (w.id === wA.id && outcome.winner === "A") || (w.id === wD.id && outcome.winner === "D");
            const isLoser = (w.id === wA.id && outcome.winner === "D") || (w.id === wD.id && outcome.winner === "A");
            const didKill = (w.id === wA.id && outcome.winner === "A" && outcome.by === "Kill") || (w.id === wD.id && outcome.winner === "D" && outcome.by === "Kill");
            w.career.wins += (isWinner ? 1 : 0);
            w.career.losses += (isLoser ? 1 : 0);
            w.career.kills += (didKill ? 1 : 0);
          }
        };
        draft.roster.forEach(updateCareer);
        draft.rivals.forEach((r: any) => r.roster.forEach(updateCareer));
      }

      if (winners.length > 1) {
        const nextRound = currentRoundNum + 1;
        for (let i = 0; i < winners.length; i += 2) {
          if (i + 1 < winners.length) {
            tournament.bracket.push({ round: nextRound, matchIndex: Math.floor(i / 2), a: winners[i], d: winners[i + 1], warriorIdA: "", warriorIdD: "" });
          } else {
            tournament.bracket.push({ round: nextRound, matchIndex: Math.floor(i / 2), a: winners[i], d: "(bye)", winner: "A", warriorIdA: "", warriorIdD: "" });
          }
        }
      }

      const isComplete = tournament.bracket.filter((b: any) => b.winner === undefined).length === 0 && winners.length <= 1;
      const champion = winners.length === 1 ? winners[0] : undefined;
      tournament.completed = isComplete;
      tournament.champion = champion;

      if (isComplete && champion) {
        const champWarrior = draft.roster.find((w: any) => w.name === champion);
        if (champWarrior) {
          champWarrior.champion = true;
          champWarrior.fame = (champWarrior.fame || 0) + 5;
          champWarrior.popularity = (champWarrior.popularity || 0) + 3;
          champWarrior.titles = [...(champWarrior.titles || []), tournament.name];
          draft.rosterBonus = (draft.rosterBonus ?? 0) + 1;
          draft.player.fame = (draft.player.fame ?? 0) + 10;
          toast.success(`🏆 ${champion} has won the ${tournament.name}!`);
        }
      } else {
        toast.success(`Round ${currentRoundNum} complete.`);
      }
    });
  }, [currentTournament, setState]);

  const skipToMyBouts = useCallback(() => {
    if (!currentTournament) return;
    const playerNames = new Set(roster.map(w => w.name));

    setState((draft) => {
      const tournament = draft.tournaments.find((t: any) => t.id === currentTournament.id);
      if (!tournament) return;

      const findWarriorAtDraft = (name: string) => {
        const player = draft.roster.find((w: any) => w.name === name);
        if (player) return player;
        for (const rival of (draft.rivals ?? [])) {
          const rw = rival.roster.find((w: any) => w.name === name);
          if (rw) return rw;
        }
        return undefined;
      };

      let roundsSkipped = 0;
      for (let safety = 0; safety < 20; safety++) {
        const unresolved = tournament.bracket.filter((b: any) => b.winner === undefined);
        if (unresolved.length === 0) break;
        const currentRound = Math.min(...unresolved.map((b: any) => b.round));
        const roundBouts = unresolved.filter((b: any) => b.round === currentRound);

        if (roundBouts.some((b: any) => playerNames.has(b.a) || playerNames.has(b.d))) break;

        const winners: string[] = [];
        for (const bout of roundBouts) {
          if (bout.d === "(bye)") {
            bout.winner = "A";
            winners.push(bout.a);
            continue;
          }
          const wA = findWarriorAtDraft(bout.a);
          const wD = findWarriorAtDraft(bout.d);
          if (!wA || !wD) {
            bout.winner = wA ? "A" : "D";
            winners.push(wA?.name ?? wD?.name ?? "");
            continue;
          }

          const findRivalByWarrior = (name: string) => {
            return (draft.rivals ?? []).find((r: any) => r.roster.some((w: any) => w.name === name));
          };

          const getAIPlan = (w: Warrior) => {
            const rival = findRivalByWarrior(w.name);
            if (!rival) return defaultPlanForWarrior(w);
            return aiPlanForWarrior(w, rival.owner.personality || "Pragmatic", rival.philosophy || "Opportunist", undefined, rival.strategy?.intent);
          };

          const planA = wA.plan ?? getAIPlan(wA);
          const planD = wD.plan ?? getAIPlan(wD);
          const boutRng = new SeededRNG(hashStr(`${tournament.id}-${safety}-${bout.round}-${bout.matchIndex}`));
          const outcome = simulateFight(planA, planD, wA, wD, () => boutRng.next(), draft.trainers, draft.weather);

          bout.winner = outcome.winner;
          bout.by = outcome.by;
          bout.fightId = generateId(boutRng, "bout");
          bout.warriorIdA = wA.id;
          bout.warriorIdD = wD.id;

          if (outcome.winner === "A") winners.push(bout.a);
          else if (outcome.winner === "D") winners.push(bout.d);

          if (outcome.by === "Kill") {
            const deadId = outcome.winner === "A" ? wD.id : wA.id;
            const killerName = outcome.winner === "A" ? wA.name : wD.name;
            const victim = draft.roster.find((w: any) => w.id === deadId);
            if (victim) {
              victim.status = "Dead";
              victim.isDead = true;
              victim.deathWeek = draft.week;
              victim.killedBy = killerName;
              draft.graveyard.push({ ...victim });
              draft.roster = draft.roster.filter((w: any) => w.id !== deadId);
            } else {
               for (const rival of draft.rivals) {
                 const rvIndex = rival.roster.findIndex((w: any) => w.id === deadId);
                 if (rvIndex !== -1) {
                   rival.roster.splice(rvIndex, 1);
                   break;
                 }
               }
            }
          }
          
          const summary: FightSummary = {
            id: bout.fightId,
            week: draft.week,
            phase: "resolution",
            tournamentId: tournament.id,
            title: `${bout.a} vs ${bout.d}`,
            a: bout.a,
            d: bout.d,
            warriorIdA: wA.id,
            warriorIdD: wD.id,
            winner: outcome.winner,
            by: outcome.by,
            styleA: wA.style,
            styleD: wD.style,
            transcript: outcome.log.map((e: any) => e.text),
            createdAt: "Year " + draft.year + " Week " + draft.week,
          };
          draft.arenaHistory.push(summary);
          ArenaHistory.append(summary);
        }

        if (winners.length > 1) {
          const nextRound = currentRound + 1;
          for (let i = 0; i < winners.length; i += 2) {
            if (i + 1 < winners.length) tournament.bracket.push({ round: nextRound, matchIndex: Math.floor(i / 2), a: winners[i], d: winners[i + 1], warriorIdA: "", warriorIdD: "" });
            else tournament.bracket.push({ round: nextRound, matchIndex: Math.floor(i / 2), a: winners[i], d: "(bye)", winner: "A", warriorIdA: "", warriorIdD: "" });
          }
        }
        roundsSkipped++;
      }

      if (roundsSkipped > 0) {
        toast.success(`Skipped ${roundsSkipped} AI-only rounds.`);
      }
    });
  }, [currentTournament, roster, setState]);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h1 className="text-xl sm:text-3xl font-display font-black flex items-center gap-3 uppercase tracking-tighter text-foreground">
            <div className="p-2 bg-accent/10 rounded-xl border border-accent/20">
              <Trophy className="h-6 w-6 text-accent shadow-glow" />
            </div>
            Seasonal Campaigns
           </h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mt-2 opacity-60">
            Legendary tournaments for glory and absolute roster expansion
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {!currentTournament && activeWarriors.length < 2 && (
             <Link to="/stable/recruit">
              <Button variant="outline" className="h-11 font-black uppercase text-[10px] tracking-widest gap-2">
                <UserPlus className="h-4 w-4" /> RECRUIT_OPERATIVES
              </Button>
            </Link>
          )}
        </div>
      </div>

      {currentTournament && (
        <Card className="border-accent/40 shadow-[0_0_30px_-10px_hsla(var(--accent),0.3)] bg-glass-card overflow-hidden">
          <CardHeader className="pb-4 bg-accent/5 border-b border-border/10">
            <CardTitle className="font-display text-xl font-black flex items-center justify-between text-accent uppercase tracking-tighter">
              <span className="flex items-center gap-3">
                <span className="text-2xl drop-shadow-sm">{SEASON_ICONS[season]}</span>
                {currentTournament.name}
              </span>
              <Badge className="bg-primary text-primary-foreground font-black uppercase text-[9px] tracking-[0.2em] px-3 animate-pulse">PROTOCOL_LIVE</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <TournamentBracket
              bouts={currentTournament.bracket}
              arenaHistory={arenaHistory}
              expandedBout={expandedBout}
              onToggleExpand={setExpandedBout}
            />

            {currentTournament.bracket.some((b) => b.winner === undefined) && (
              <div className="flex gap-4 p-6 border-t border-border/10 bg-secondary/10">
                <Button onClick={runNextRound} className="flex-1 h-12 font-black uppercase text-[11px] tracking-widest shadow-lg">
                  <Play className="h-4 w-4 mr-2 fill-current" /> EXECUTE_NEXT_BOUT
                </Button>
                <Button variant="outline" onClick={skipToMyBouts} className="flex-1 h-12 font-black uppercase text-[11px] tracking-widest border-border/40 hover:bg-secondary/50">
                  <FastForward className="h-4 w-4 mr-2 text-primary" /> SKIP_TO_STABLE_BOUTS
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-3 px-2">
          <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Tournament_History_Matrices</h3>
          <div className="h-px flex-1 bg-border/20" />
        </div>
        <TournamentHistory
          pastTournaments={pastTournaments}
          seasonIcons={SEASON_ICONS}
          seasonNames={SEASON_NAMES}
          currentSeason={season}
        />
      </div>

    </div>
  );
}
