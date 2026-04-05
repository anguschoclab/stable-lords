/**
 * Stable Lords — Seasonal Tournaments (Refactored)
 * Modularized for better maintainability and strict type safety.
 */
import React, { useState, useCallback, useMemo } from "react";
import { useGameStore } from "@/state/useGameStore";
import { simulateFight, defaultPlanForWarrior, fameFromTags, aiPlanForWarrior } from "@/engine";
import { killWarrior } from "@/state/gameStore";
import { ArenaHistory } from "@/engine/history/arenaHistory";
import { LoreArchive } from "@/lore/LoreArchive";
import { NewsletterFeed } from "@/engine/newsletter/feed";
import { StyleRollups } from "@/engine/stats/styleRollups";
import { type TournamentEntry, type TournamentBout, type FightSummary, type Warrior, FightingStyle } from "@/types/game";
import { BASE_ROSTER_CAP } from "@/data/constants";
import { getFightsForTournament } from "@/engine/core/historyUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Play, UserPlus, FastForward, Shield } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

// Modular Components
import { TournamentBracket } from "@/components/tournaments/TournamentBracket";
import { TournamentPrepDialog } from "@/components/tournaments/TournamentPrepDialog";
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
  const { state, setState } = useGameStore();
  const [prepModeOpen, setPrepModeOpen] = useState(false);
  const [expandedBout, setExpandedBout] = useState<string | null>(null);

  const currentTournament = useMemo(
    () => state.tournaments.find((t) => t.season === state.season && !t.completed),
    [state.tournaments, state.season]
  );

  const activeWarriors = useMemo(() => state.roster.filter((w) => w.status === "Active"), [state.roster]);

  const pastTournaments = useMemo(
    () => state.tournaments.filter((t) => t.completed).reverse(),
    [state.tournaments]
  );

  const runNextRound = useCallback(() => {
    if (!currentTournament) return;
    const bracket = [...currentTournament.bracket];

    let currentRound = Infinity;
    let roundBouts: typeof bracket = [];

    for (let i = 0; i < bracket.length; i++) {
      const b = bracket[i];
      if (b.winner === undefined) {
        if (b.round < currentRound) {
          currentRound = b.round;
          roundBouts = [b];
        } else if (b.round === currentRound) {
          roundBouts.push(b);
        }
      }
    }

    if (roundBouts.length === 0) return;

    let updatedState = { ...state };
    const winners: string[] = [];

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
        bout.winner = wA ? "A" : "D";
        winners.push(wA?.name ?? wD?.name ?? "");
        continue;
      }

      const findRivalByWarrior = (name: string) => {
        return (updatedState.rivals ?? []).find(r => r.roster.some(w => w.name === name));
      };

      const getAIPlan = (w: Warrior) => {
        const rival = findRivalByWarrior(w.name);
        if (!rival) return defaultPlanForWarrior(w);
        return aiPlanForWarrior(w, rival.owner.personality || "Pragmatic", rival.philosophy || "Opportunist", undefined, rival.strategy?.intent);
      };

      const planA = wA.plan ?? (state.roster.some(w => w.name === bout.a) ? defaultPlanForWarrior(wA) : getAIPlan(wA));
      const planD = wD.plan ?? (state.roster.some(w => w.name === bout.d) ? defaultPlanForWarrior(wD) : getAIPlan(wD));
      const outcome = simulateFight(planA, planD, wA, wD, undefined, updatedState.trainers, state.weather);

      bout.winner = outcome.winner;
      bout.by = outcome.by;
      bout.fightId = `tf_${Date.now()}_${bout.matchIndex}`;
      
      const winnerName = outcome.winner === "A" ? bout.a : outcome.winner === "D" ? bout.d : null;
      if (winnerName) winners.push(winnerName);

      if (outcome.by === "Kill") {
        const deadId = outcome.winner === "A" ? wD.id : wA.id;
        const killerName = outcome.winner === "A" ? wA.name : wD.name;
        updatedState = killWarrior(updatedState, deadId, killerName, `Killed in ${currentTournament.name}`);
      }

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
        flashyTags: outcome.post?.tags ?? [],
        transcript: outcome.log.map((e) => e.text),
        createdAt: new Date().toISOString(),
      };
      updatedState.arenaHistory = [...updatedState.arenaHistory, summary];
      ArenaHistory.append(summary);
      LoreArchive.signalFight(summary);
      StyleRollups.addFight({ 
        week: state.week, 
        styleA: wA.style, 
        styleD: wD.style, 
        winner: outcome.winner, 
        by: outcome.by,
        isTournament: currentTournament.id 
      });
      NewsletterFeed.appendFightResult({ summary, transcript: outcome.log.map((e) => e.text) });

      if (outcome.winner) {
        const fameData = fameFromTags(outcome.post?.tags ?? []);
        updatedState.fame = (updatedState.fame ?? 0) + fameData.fame;
      }

      updatedState = {
        ...updatedState,
        roster: updatedState.roster.map((w) => {
          if (w.id === wA.id || w.id === wD.id) {
            const isWinner = (w.id === wA.id && outcome.winner === "A") || (w.id === wD.id && outcome.winner === "D");
            const isLoser = (w.id === wA.id && outcome.winner === "D") || (w.id === wD.id && outcome.winner === "A");
            const didKill = (w.id === wA.id && outcome.winner === "A" && outcome.by === "Kill") || (w.id === wD.id && outcome.winner === "D" && outcome.by === "Kill");
            return {
              ...w,
              career: {
                ...w.career,
                wins: w.career.wins + (isWinner ? 1 : 0),
                losses: w.career.losses + (isLoser ? 1 : 0),
                kills: w.career.kills + (didKill ? 1 : 0),
              },
            };
          }
          return w;
        }),
      };
    }

    if (winners.length > 1) {
      const nextRound = currentRound + 1;
      for (let i = 0; i < winners.length; i += 2) {
        if (i + 1 < winners.length) {
          bracket.push({ round: nextRound, matchIndex: Math.floor(i / 2), a: winners[i], d: winners[i + 1] });
        } else {
          bracket.push({ round: nextRound, matchIndex: Math.floor(i / 2), a: winners[i], d: "(bye)", winner: "A" });
        }
      }
    }

    const isComplete = bracket.filter((b) => b.winner === undefined).length === 0 && winners.length <= 1;
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
          w.name === champion ? { ...w, champion: true, fame: w.fame + 5, popularity: w.popularity + 3, titles: [...w.titles, updatedTournament.name] } : w
        );
        updatedState.rosterBonus = (updatedState.rosterBonus ?? 0) + 1;
        updatedState.fame = (updatedState.fame ?? 0) + 10;
        toast.success(`🏆 ${champion} has won the ${updatedTournament.name}!`);
      }
    } else {
      toast.success(`Round ${currentRound} complete.`);
    }

    setState(updatedState);
  }, [currentTournament, state, setState]);

  const skipToMyBouts = useCallback(() => {
    if (!currentTournament) return;
    const playerNames = new Set(state.roster.map(w => w.name));
    let updatedState = { ...state };
    const bracket = [...currentTournament.bracket];
    let roundsSkipped = 0;

    const findWarrior = (name: string) => {
      const player = updatedState.roster.find(w => w.name === name);
      if (player) return player;
      for (const rival of (updatedState.rivals ?? [])) {
        const rw = rival.roster.find(w => w.name === name);
        if (rw) return rw;
      }
      return undefined;
    };

    for (let safety = 0; safety < 20; safety++) {
      const unresolved = bracket.filter(b => b.winner === undefined);
      if (unresolved.length === 0) break;
      const currentRound = Math.min(...unresolved.map(b => b.round));
      const roundBouts = unresolved.filter(b => b.round === currentRound);

      if (roundBouts.some(b => playerNames.has(b.a) || playerNames.has(b.d))) break;

      const winners: string[] = [];
      for (const bout of roundBouts) {
        if (bout.d === "(bye)") {
          bout.winner = "A";
          winners.push(bout.a);
          continue;
        }
        const wA = findWarrior(bout.a);
        const wD = findWarrior(bout.d);
        if (!wA || !wD) {
          bout.winner = wA ? "A" : "D";
          winners.push(wA?.name ?? wD?.name ?? "");
          continue;
        }

        const findRivalByWarrior = (name: string) => {
          return (updatedState.rivals ?? []).find(r => r.roster.some(w => w.name === name));
        };

        const getAIPlan = (w: Warrior) => {
          const rival = findRivalByWarrior(w.name);
          if (!rival) return defaultPlanForWarrior(w);
          return aiPlanForWarrior(w, rival.owner.personality || "Pragmatic", rival.philosophy || "Opportunist", undefined, rival.strategy?.intent);
        };

        const planA = wA.plan ?? getAIPlan(wA);
        const planD = wD.plan ?? getAIPlan(wD);
        const outcome = simulateFight(planA, planD, wA, wD, undefined, updatedState.trainers, state.weather);

        bout.winner = outcome.winner;
        bout.by = outcome.by;
        bout.fightId = `tf_${Date.now()}_${bout.matchIndex}_${safety}`;

        if (outcome.winner === "A") winners.push(bout.a);
        else if (outcome.winner === "D") winners.push(bout.d);

        if (outcome.by === "Kill") {
          const deadId = outcome.winner === "A" ? wD.id : wA.id;
          const killerName = outcome.winner === "A" ? wA.name : wD.name;
          updatedState = killWarrior(updatedState, deadId, killerName, `Killed manually in ${currentTournament.name}`);
        }
        
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
          transcript: outcome.log.map(e => e.text),
          createdAt: new Date().toISOString(),
        };
        updatedState.arenaHistory = [...updatedState.arenaHistory, summary];
        ArenaHistory.append(summary);
      }

      if (winners.length > 1) {
        const nextRound = currentRound + 1;
        for (let i = 0; i < winners.length; i += 2) {
          if (i + 1 < winners.length) bracket.push({ round: nextRound, matchIndex: Math.floor(i / 2), a: winners[i], d: winners[i + 1] });
          else bracket.push({ round: nextRound, matchIndex: Math.floor(i / 2), a: winners[i], d: "(bye)", winner: "A" });
        }
      }
      roundsSkipped++;
    }

    if (roundsSkipped > 0) {
      updatedState.tournaments = updatedState.tournaments.map(t => t.id === currentTournament.id ? { ...currentTournament, bracket } : t);
      setState(updatedState);
      toast.success(`Skipped ${roundsSkipped} AI-only rounds.`);
    }
  }, [currentTournament, state, setState]);

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
                <span className="text-2xl drop-shadow-sm">{SEASON_ICONS[state.season]}</span>
                {currentTournament.name}
              </span>
              <Badge className="bg-primary text-primary-foreground font-black uppercase text-[9px] tracking-[0.2em] px-3 animate-pulse">PROTOCOL_LIVE</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <TournamentBracket
              bouts={currentTournament.bracket}
              arenaHistory={state.arenaHistory}
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
          currentSeason={state.season}
        />
      </div>

    </div>
  );
}
