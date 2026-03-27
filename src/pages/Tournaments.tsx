import React, { useState, useCallback, useMemo } from "react";
import { useGameStore } from "@/state/useGameStore";
import { simulateFight, defaultPlanForWarrior, fameFromTags } from "@/engine";
import { killWarrior } from "@/state/gameStore";
import { ArenaHistory } from "@/engine/history/arenaHistory";
import { LoreArchive } from "@/lore/LoreArchive";
import { NewsletterFeed } from "@/engine/newsletter/feed";
import { StyleRollups } from "@/engine/stats/styleRollups";
import type { TournamentEntry, TournamentBout, FightSummary } from "@/types/game";
import { STYLE_DISPLAY_NAMES, } from "@/types/game";
import { BASE_ROSTER_CAP } from "@/data/constants";
import { getFightsForTournament } from "@/engine/core/historyUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WarriorNameTag } from "@/components/ui/WarriorNameTag";
import { StatBadge } from "@/components/ui/StatBadge";
import { Trophy, Swords, Skull, Play, UserPlus, ChevronDown, ChevronUp, FastForward, Shield } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import BoutViewer from "@/components/BoutViewer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const currentTournament = useMemo(
    () => state.tournaments.find((t) => t.season === state.season && !t.completed),
    [state.tournaments, state.season]
  );

  const activeWarriors = useMemo(() => state.roster.filter((w) => w.status === "Active"), [state.roster]);
  const canStart = !currentTournament && activeWarriors.length >= 2;

  const pastTournaments = useMemo(
    () => state.tournaments.filter((t) => t.completed).reverse(),
    [state.tournaments]
  );



  const startTournament = useCallback(() => {
    const active = state.roster.filter((w) => w.status === "Active");
    if (active.length < 2) return;

    // Gather AI rival warriors for the bracket (up to 5 from rivals)
    const rivalWarriors: { name: string; isAI: boolean; stableId: string }[] = [];
    for (const rival of (state.rivals ?? [])) {
      const eligibleRivals = rival.roster.filter((w) => w.status === "Active").slice(0, 2);
      for (const rw of eligibleRivals) {
        rivalWarriors.push({ name: rw.name, isAI: true, stableId: rival.owner.id });
      }
      if (rivalWarriors.length >= 5) break;
    }

    // Combine player + AI warriors
    const allEntrants = [
      ...active.map((w) => ({ name: w.name, isAI: false, stableId: state.player.id })),
      ...rivalWarriors,
    ];

    // Pad to power of 2 for clean bracket (4, 8, 16)
    const targetSize = [4, 8, 16].find((n) => n >= allEntrants.length) ?? allEntrants.length;

    // Build bracket: shuffle and pair
    const shuffled = [...allEntrants].sort(() => Math.random() - 0.5);
    const bracket: TournamentBout[] = [];
    for (let i = 0; i < shuffled.length; i += 2) {
      if (i + 1 < shuffled.length) {
        bracket.push({
          round: 1,
          matchIndex: Math.floor(i / 2),
          a: shuffled[i].name,
          d: shuffled[i + 1].name,
          stableA: shuffled[i].stableId,
          stableD: shuffled[i + 1].stableId,
        });
      } else {
        // Odd entrant gets a bye
        bracket.push({
          round: 1,
          matchIndex: Math.floor(i / 2),
          a: shuffled[i].name,
          d: "(bye)",
          winner: "A",
        });
      }
    }

    const entry: TournamentEntry = {
      id: `t_${Date.now()}`,
      season: state.season,
      week: state.week,
      name: SEASON_NAMES[state.season] ?? "Tournament",
      bracket,
      completed: false,
    };

    setState({
      ...state,
      tournaments: [...state.tournaments, entry],
    });
    toast.success(`${entry.name} has begun!`);
  }, [state, setState]);

  const runNextRound = useCallback(() => {
    if (!currentTournament) return;
    const bracket = [...currentTournament.bracket];
    const unresolved = bracket.filter((b) => b.winner === undefined);
    if (unresolved.length === 0) return;

    // Find the current round
    const currentRound = Math.min(...unresolved.map((b) => b.round));
    const roundBouts = unresolved.filter((b) => b.round === currentRound);

    let updatedState = { ...state };
    const winners: string[] = [];

    // Helper: find warrior by name across player roster + rival rosters
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
      const outcome = simulateFight(planA, planD, wA, wD, undefined, updatedState.trainers);

      bout.winner = outcome.winner;
      bout.by = outcome.by;
      bout.fightId = `tf_${Date.now()}_${bout.matchIndex}`;
      // Cross-reference stable IDs
      const sIdA = bout.stableA;
      const sIdD = bout.stableD;
      const rvKey = sIdA && sIdD ? (sIdA < sIdD ? `${sIdA}|${sIdD}` : `${sIdD}|${sIdA}`) : null;
      const isRivalry = !!rvKey && state.rivalries?.some(r => (r.stableIdA === sIdA && r.stableIdB === sIdD) || (r.stableIdB === sIdA && r.stableIdA === sIdD));

      const winnerName = outcome.winner === "A" ? bout.a : outcome.winner === "D" ? bout.d : null;
      if (winnerName) winners.push(winnerName);

      // Handle kills
      if (outcome.by === "Kill") {
        const deadId = outcome.winner === "A" ? wD.id : wA.id;
        const killerName = outcome.winner === "A" ? wA.name : wD.name;
        updatedState = killWarrior(updatedState, deadId, killerName, `Killed in ${currentTournament.name}`);
      }

      // Fight summary
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

      // Write to localStorage archives so Gazette/Chronicle can see tournament fights
      ArenaHistory.append(summary);
      LoreArchive.signalFight(summary);
      StyleRollups.addFight({ week: state.week, styleA: wA.style, styleD: wD.style, winner: outcome.winner, by: outcome.by });
      NewsletterFeed.appendFightResult({ summary, transcript: outcome.log.map((e) => e.text) });

      // Track metrics
      StyleRollups.addFight({ week: state.week, styleA: wA.style, styleD: wD.style, winner: outcome.winner, by: outcome.by, isTournament: currentTournament.id });

      // Fame accumulation for stable
      if (outcome.winner) {
        const fameData = fameFromTags(tags);
        updatedState.fame = (updatedState.fame ?? 0) + fameData.fame;
        updatedState.player = { ...updatedState.player, fame: (updatedState.player.fame ?? 0) + fameData.fame };
      }

      // Update records
      updatedState = {
        ...updatedState,
        roster: updatedState.roster.map((w) => {
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
        }),
      };
    }

    // Create next round if needed
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
          // Bye — auto-advance
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

    // Check if tournament is done
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
      // Check if champion is a player warrior (not AI)
      const isPlayerChampion = updatedState.roster.some((w) => w.name === champion);

      // Award champion
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

        // +1 stable slot reward
        updatedState.rosterBonus = (updatedState.rosterBonus ?? 0) + 1;
        updatedState.fame = (updatedState.fame ?? 0) + 10;
        updatedState.player = { ...updatedState.player, titles: (updatedState.player.titles ?? 0) + 1 };

        toast.success(`🏆 ${champion} wins the ${updatedTournament.name}! +1 stable slot earned!`);
      } else {
        // AI champion
        toast(`${champion} (rival) wins the ${updatedTournament.name}.`);
      }

      // Mark fight of tournament & close newsletter
      const tourneyFights = getFightsForTournament(updatedState.arenaHistory, currentTournament.id);
      if (tourneyFights.length > 0) {
        const best = tourneyFights.reduce((a, b) => {
          const sa = (b.flashyTags?.length ?? 0) + (b.by === "Kill" ? 3 : b.by === "KO" ? 2 : 0);
          const sb = (a.flashyTags?.length ?? 0) + (a.by === "Kill" ? 3 : a.by === "KO" ? 2 : 0);
          return sa > sb ? b : a;
        });
        LoreArchive.markFightOfTournament(state.week, best.id);
      }

      // Add tournament summary to newsletter
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
      toast.success(`Round ${currentRound} complete! ${winners.length} advance.`);
    }

    setState(updatedState);
  }, [currentTournament, state, setState]);

  /** Auto-resolve AI-vs-AI rounds, stopping when a round has a player warrior */
  const skipToMyBouts = useCallback(() => {
    if (!currentTournament) return;
    const playerNames = new Set(state.roster.map(w => w.name));

    // We'll simulate multiple rounds in a single pass
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

      // Stop if a player warrior is in this round
      const hasPlayerBout = roundBouts.some(b =>
        playerNames.has(b.a) || playerNames.has(b.d)
      );
      if (hasPlayerBout) break;

      // Auto-resolve this AI-only round
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
          bout.winner = wA ? "A" : wD ? "D" : null;
          winners.push(wA?.name ?? wD?.name ?? "");
          continue;
        }

        const planA = wA.plan ?? defaultPlanForWarrior(wA);
        const planD = wD.plan ?? defaultPlanForWarrior(wD);
        const outcome = simulateFight(planA, planD, wA, wD, undefined, updatedState.trainers);

        bout.winner = outcome.winner;
        bout.by = outcome.by;
        bout.fightId = `tf_${Date.now()}_${bout.matchIndex}_${safety}`;

        const winnerName = outcome.winner === "A" ? bout.a : outcome.winner === "D" ? bout.d : null;
        if (winnerName) winners.push(winnerName);

        // Handle kills
        if (outcome.by === "Kill") {
          const deadId = outcome.winner === "A" ? wD.id : wA.id;
          const killerName = outcome.winner === "A" ? wA.name : wD.name;
          updatedState = killWarrior(updatedState, deadId, killerName, `Killed in ${currentTournament.name}`);
        }

        // Fight summary
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
          flashyTags: tags,
          transcript: outcome.log.map(e => e.text),
          createdAt: new Date().toISOString(),
        };
        updatedState.arenaHistory = [...updatedState.arenaHistory, summary];
        ArenaHistory.append(summary);
        LoreArchive.signalFight(summary);
        StyleRollups.addFight({ week: state.week, styleA: wA.style, styleD: wD.style, winner: outcome.winner, by: outcome.by, isTournament: currentTournament.id });
      }

      // Create next round
      if (winners.length > 1) {
        const nextRound = currentRound + 1;
        for (let i = 0; i < winners.length; i += 2) {
          if (i + 1 < winners.length) {
            bracket.push({ round: nextRound, matchIndex: Math.floor(i / 2), a: winners[i], d: winners[i + 1] });
          } else {
            bracket.push({ round: nextRound, matchIndex: Math.floor(i / 2), a: winners[i], d: "(bye)", winner: "A" as const });
          }
        }
      }

      roundsSkipped++;
    }

    if (roundsSkipped === 0) {
      toast("⚔️ Your warriors are already up next!");
      return;
    }

    // Update tournament
    const updatedTournament = { ...currentTournament, bracket };
    updatedState.tournaments = updatedState.tournaments.map(t =>
      t.id === currentTournament.id ? updatedTournament : t
    );

    setState(updatedState);
    toast.success(`⏩ Skipped ${roundsSkipped} AI-only round${roundsSkipped !== 1 ? "s" : ""}. Your warriors are up next!`);
  }, [currentTournament, state, setState]);

  const [expandedBout, setExpandedBout] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold">Seasonal Tournaments</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Compete for glory across the four seasons. Champion reward: <span className="text-primary font-semibold">+1 stable slot</span>
          </p>
          {(state.rosterBonus ?? 0) > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs text-primary border-primary/30">
                <Trophy className="h-3 w-3 mr-1" /> {state.rosterBonus ?? 0} bonus slot{(state.rosterBonus ?? 0) !== 1 ? "s" : ""} earned
              </Badge>
              <span className="text-[10px] text-muted-foreground font-mono">
                Roster cap: {BASE_ROSTER_CAP + (state.rosterBonus ?? 0)}
              </span>
            </div>
          )}
        </div>
        {canStart ? (

          <Dialog open={prepModeOpen} onOpenChange={setPrepModeOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 border-primary/50 text-primary hover:bg-primary/10">
                <Shield className="h-4 w-4" /> Prep Mode
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-display text-xl flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" /> Tournament Prep Mode
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-lg border border-border">
                  Review your active roster before committing to the {SEASON_NAMES[state.season]}.
                  Ensure fame limits (FE Freeze) and equipment classes are set.
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
                  {activeWarriors.map((w) => (
                    <Card key={w.id} className="border-border">
                      <CardHeader className="p-3 pb-2 border-b border-border bg-secondary/10 flex flex-row items-center justify-between">
                        <WarriorNameTag id={w.id} name={w.name} isChampion={w.champion} />
                        <StatBadge styleName={w.style} />
                      </CardHeader>
                      <CardContent className="p-3 space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Fame:</span>
                          <span className={w.fame > 80 ? "text-destructive font-bold flex items-center gap-1" : "font-mono"}>
                             {w.fame} {w.fame > 80 && <TooltipProvider><Tooltip><TooltipTrigger><AlertCircle className="h-3 w-3"/></TooltipTrigger><TooltipContent>Nearing FE Freeze</TooltipContent></Tooltip></TooltipProvider>}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Record:</span>
                          <span className="font-mono">{w.career.wins}W - {w.career.losses}L</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="flex justify-end pt-2">
                  <Button onClick={() => { setPrepModeOpen(false); startTournament(); }} className="gap-2">
                    <Trophy className="h-4 w-4" /> Start {SEASON_NAMES[state.season]}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

        ) : !currentTournament && state.roster.filter((w) => w.status === "Active").length < 2 ? (
          <Link to="/stable/recruit">
            <Button variant="outline" className="gap-2">
              <UserPlus className="h-4 w-4" /> Recruit Warriors
            </Button>
          </Link>
        ) : null}
      </div>

      {/* Active Tournament */}
      {currentTournament && (
        <Card className="border-accent/40 shadow-[0_0_25px_-5px_hsl(var(--accent)/0.4)] backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg flex items-center justify-between text-accent drop-shadow-[0_0_8px_hsl(var(--accent)/0.6)]">
              <span className="flex items-center gap-2">
                <span className="text-xl">{SEASON_ICONS[state.season]}</span>
                {currentTournament.name}
              </span>
              <Badge className="bg-primary text-primary-foreground text-xs animate-pulse glow-neon-green border border-primary/50 shadow-[0_0_10px_hsl(var(--primary)/0.5)]">LIVE</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Bracket visualization - High Density Visual Tree */}
            <div className="relative overflow-x-auto pb-8 pt-4 no-scrollbar">
              <div className="flex gap-16 min-w-max px-4">
                {(() => {
                  const roundsMap = new Map<number, TournamentBout[]>();
                  currentTournament.bracket.forEach((b) => {
                    const arr = roundsMap.get(b.round) || [];
                    arr.push(b);
                    roundsMap.set(b.round, arr);
                  });
                  
                  const sortedRounds = Array.from(roundsMap.entries()).sort(([a], [b]) => a - b);
                  const totalRounds = sortedRounds.length;

                  return sortedRounds.map(([round, bouts], rIdx) => (
                    <div key={round} className="flex flex-col justify-around gap-8 relative py-4">
                      {/* Round Header */}
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                          {round === totalRounds && totalRounds > 1 ? "Championship" : `Round ${round}`}
                        </span>
                      </div>

                      {bouts.map((bout, bIdx) => {
                        const boutKey = `${round}_${bIdx}`;
                        const isExpanded = expandedBout === boutKey;
                        const fightSummary = bout.fightId
                          ? state.arenaHistory.find((f) => f.id === bout.fightId)
                          : null;
                        const hasTranscript = fightSummary?.transcript && fightSummary.transcript.length > 0;
                        
                        const isAChosen = bout.winner === "A";
                        const isDChosen = bout.winner === "D";
                        const isPending = bout.winner === undefined;

                        return (
                          <div key={bIdx} className="relative group">
                            {/* SVG Connection to previous round (if not round 1) */}
                            {rIdx > 0 && (
                                <svg className="absolute -left-16 top-1/2 -translate-y-1/2 w-16 h-12 pointer-events-none stroke-border/20 fill-none overflow-visible">
                                   <path d="M 0 0 L 32 0 L 32 24 L 64 24" className="stroke-2" />
                                   {/* Note: This is a simplified path, real tree logic requires match indexing */}
                                </svg>
                            )}

                            <div className={cn(
                              "w-64 rounded-xl border transition-all duration-300 relative z-10",
                              isPending ? "bg-background/20 border-border/40" : "bg-secondary/10 border-primary/30 shadow-[0_0_15px_-5px_rgba(0,0,0,0.5)]",
                              isExpanded && "ring-2 ring-primary/50 border-primary shadow-[0_0_20px_-5px_hsl(var(--primary)/0.4)]"
                            )}>
                              {/* Match ID / Status Bar */}
                              <div className="px-3 py-1 border-b border-border/20 flex items-center justify-between bg-secondary/20">
                                <span className="text-[8px] font-black text-muted-foreground/60 tracking-widest uppercase">MATCH {bIdx + 1}</span>
                                {isPending ? (
                                    <Badge className="h-3 px-1.5 text-[7px] bg-blue-500/20 text-blue-400 border-none">PENDING</Badge>
                                ) : (
                                    <Badge className="h-3 px-1.5 text-[7px] bg-primary/20 text-primary border-none">RESOLVED</Badge>
                                )}
                              </div>

                              <div className="p-3 space-y-1">
                                {/* Competitor A */}
                                <div className={cn(
                                  "flex items-center justify-between p-2 rounded-lg transition-colors",
                                  isAChosen ? "bg-primary/10 text-primary font-bold shadow-inner" : isDChosen ? "opacity-30 grayscale" : "bg-background/40"
                                )}>
                                  <div className="flex items-center gap-2 truncate">
                                    <div className={cn("w-1 h-4 rounded-full", isAChosen ? "bg-primary" : "bg-muted-foreground/20")} />
                                    <span className="text-xs truncate">{bout.a}</span>
                                  </div>
                                  {isAChosen && <Trophy className="h-3 w-3 animate-bounce shadow-glow text-arena-gold" />}
                                </div>

                                {/* vs Divider */}
                                <div className="flex justify-center -my-2 relative z-10">
                                  <div className="bg-secondary px-2 rounded-full border border-border/20 text-[8px] font-black text-muted-foreground">VS</div>
                                </div>

                                {/* Competitor D */}
                                <div className={cn(
                                  "flex items-center justify-between p-2 rounded-lg transition-colors",
                                  isDChosen ? "bg-primary/10 text-primary font-bold shadow-inner" : isAChosen ? "opacity-30 grayscale" : "bg-background/40"
                                )}>
                                  <div className="flex items-center gap-2 truncate">
                                    <div className={cn("w-1 h-4 rounded-full", isDChosen ? "bg-primary" : "bg-muted-foreground/20")} />
                                    <span className="text-xs truncate">{bout.d}</span>
                                  </div>
                                  {isDChosen && <Trophy className="h-3 w-3 animate-bounce shadow-glow text-arena-gold" />}
                                </div>
                              </div>

                              {/* Action Bar */}
                              {hasTranscript && (
                                <button
                                  onClick={() => setExpandedBout(isExpanded ? null : boutKey)}
                                  className="w-full py-1.5 px-3 border-t border-border/10 flex items-center justify-center gap-1.5 hover:bg-primary/5 transition-colors group"
                                >
                                  <span className="text-[9px] font-black uppercase text-muted-foreground group-hover:text-primary">Engagement Log</span>
                                  {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3 text-primary animate-pulse" />}
                                </button>
                              )}
                            </div>

                            {/* Details Overlay */}
                            {isExpanded && hasTranscript && fightSummary && (
                              <div className="absolute top-0 left-full ml-4 z-50 w-[400px] animate-in fade-in slide-in-from-left-4 duration-300">
                                <Card className="bg-glass-card border-primary/50 shadow-2xl overflow-hidden">
                                  <CardHeader className="p-4 border-b border-border/20 bg-secondary/40">
                                    <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center justify-between">
                                      <span>Bout Archive: {bout.a} vs {bout.d}</span>
                                      <Badge variant="outline" className="text-[10px]">{fightSummary.by}</Badge>
                                    </CardTitle>
                                  </CardHeader>
                                  <div className="p-4 max-h-[500px] overflow-y-auto thin-scrollbar bg-background/60">
                                    <BoutViewer
                                      nameA={fightSummary.a}
                                      nameD={fightSummary.d}
                                      styleA={fightSummary.styleA}
                                      styleD={fightSummary.styleD}
                                      log={fightSummary.transcript!.map((text, idx) => ({ minute: idx + 1, text }))}
                                      winner={fightSummary.winner}
                                      by={fightSummary.by}
                                      isRivalry={fightSummary.isRivalry}
                                    />
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="w-full rounded-none border-t border-border/20"
                                    onClick={() => setExpandedBout(null)}
                                  >
                                    Close Archive
                                  </Button>
                                </Card>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ));
                })()}
              </div>
            </div>

            {currentTournament.bracket.some((b) => b.winner === undefined) && (
              <div className="flex gap-2">
                <Button onClick={runNextRound} className="flex-1 gap-2">
                  <Play className="h-4 w-4" /> Run Next Round
                </Button>
                <Button variant="outline" onClick={skipToMyBouts} className="flex-1 gap-2">
                  <FastForward className="h-4 w-4" /> Skip to My Bouts
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Season Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {["Spring", "Summer", "Fall", "Winter"].map((s) => {
          const pastForSeason = pastTournaments.filter((t) => t.season === s);
          return (
            <Card
              key={s}
              className={s === state.season ? "border-primary/50 shadow-[0_0_20px_hsl(var(--primary)/0.3)] bg-primary/5" : "opacity-60 grayscale hover:grayscale-0 transition-all duration-300"}
            >
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <span className="text-xl">{SEASON_ICONS[s]}</span>
                  {SEASON_NAMES[s]}
                  {s === state.season && (
                    <Badge className="bg-primary text-primary-foreground text-xs ml-auto">
                      Current
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pastForSeason.length > 0 ? (
                  <div className="space-y-1">
                    {pastForSeason.map((t) => (
                      <div key={t.id} className="text-sm flex items-center gap-2">
                        <Trophy className="h-3.5 w-3.5 text-arena-gold" />
                        <span className="text-muted-foreground">Champion:</span>
                        <span className="font-display font-semibold text-arena-gold drop-shadow-[0_0_5px_hsl(var(--arena-gold)/0.5)]">{t.champion ?? "—"}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {s === state.season ? "Start the tournament above!" : "No champions yet."}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
