import React, { useState, useCallback, useMemo } from "react";
import { useGame } from "@/state/GameContext";
import { simulateFight, defaultPlanForWarrior, fameFromTags } from "@/engine";
import { killWarrior } from "@/state/gameStore";
import type { TournamentEntry, TournamentBout, FightSummary } from "@/types/game";
import { STYLE_DISPLAY_NAMES } from "@/types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Swords, Skull, Play, UserPlus, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import BoutViewer from "@/components/BoutViewer";

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
  const { state, setState } = useGame();

  const currentTournament = useMemo(
    () => state.tournaments.find((t) => t.season === state.season && !t.completed),
    [state.tournaments, state.season]
  );

  const pastTournaments = useMemo(
    () => state.tournaments.filter((t) => t.completed).reverse(),
    [state.tournaments]
  );

  const canStart = !currentTournament && state.roster.filter((w) => w.status === "Active").length >= 2;

  const startTournament = useCallback(() => {
    const active = state.roster.filter((w) => w.status === "Active");
    if (active.length < 2) return;

    // Build bracket: pair warriors
    const shuffled = [...active].sort(() => Math.random() - 0.5);
    const bracket: TournamentBout[] = [];
    for (let i = 0; i < shuffled.length; i += 2) {
      if (i + 1 < shuffled.length) {
        bracket.push({
          round: 1,
          matchIndex: Math.floor(i / 2),
          a: shuffled[i].name,
          d: shuffled[i + 1].name,
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

    for (const bout of roundBouts) {
      const wA = updatedState.roster.find((w) => w.name === bout.a);
      const wD = updatedState.roster.find((w) => w.name === bout.d);
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
        tournamentId: currentTournament.id,
        title: `${bout.a} vs ${bout.d}`,
        a: bout.a,
        d: bout.d,
        winner: outcome.winner,
        by: outcome.by,
        styleA: wA.style,
        styleD: wD.style,
        flashyTags: tags,
        transcript: outcome.log.map((e) => e.text),
        createdAt: new Date().toISOString(),
      };
      updatedState.arenaHistory = [...updatedState.arenaHistory, summary];

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
      // Award champion
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
      toast.success(`🏆 ${champion} wins the ${updatedTournament.name}!`);
    } else {
      toast.success(`Round ${currentRound} complete! ${winners.length} advance.`);
    }

    setState(updatedState);
  }, [currentTournament, state, setState]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold">Seasonal Tournaments</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Compete for glory across the four seasons. Current: {state.season}
          </p>
        </div>
        {canStart ? (
          <Button onClick={startTournament} className="gap-2">
            <Trophy className="h-4 w-4" /> Start {SEASON_NAMES[state.season]}
          </Button>
        ) : !currentTournament && state.roster.filter((w) => w.status === "Active").length < 2 ? (
          <Link to="/recruit">
            <Button variant="outline" className="gap-2">
              <UserPlus className="h-4 w-4" /> Recruit Warriors
            </Button>
          </Link>
        ) : null}
      </div>

      {/* Active Tournament */}
      {currentTournament && (
        <Card className="border-primary/50 glow-primary">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="text-xl">{SEASON_ICONS[state.season]}</span>
                {currentTournament.name}
              </span>
              <Badge className="bg-primary text-primary-foreground text-xs">Active</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Bracket visualization */}
            {(() => {
              const rounds = new Map<number, TournamentBout[]>();
              currentTournament.bracket.forEach((b) => {
                const arr = rounds.get(b.round) || [];
                arr.push(b);
                rounds.set(b.round, arr);
              });
              return Array.from(rounds.entries())
                .sort(([a], [b]) => a - b)
                .map(([round, bouts]) => (
                  <div key={round}>
                    <div className="text-xs text-muted-foreground font-semibold mb-2">
                      Round {round}
                    </div>
                    <div className="space-y-2">
                      {bouts.map((bout, i) => (
                        <div
                          key={i}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 py-2 px-3 rounded-lg bg-secondary/50 border border-border"
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <Swords className="h-4 w-4 text-arena-gold shrink-0" />
                            <span className={`font-medium text-sm ${bout.winner === "A" ? "text-arena-gold" : ""}`}>
                              {bout.a}
                            </span>
                            <span className="text-muted-foreground text-xs">vs</span>
                            <span className={`font-medium text-sm ${bout.winner === "D" ? "text-arena-gold" : ""}`}>
                              {bout.d}
                            </span>
                          </div>
                          {bout.winner !== undefined ? (
                            <Badge
                              variant="outline"
                              className={bout.by === "Kill" ? "text-destructive" : ""}
                            >
                              {bout.by === "Kill" && <Skull className="h-3 w-3 mr-1" />}
                              {bout.winner === "A" ? bout.a : bout.winner === "D" ? bout.d : "Draw"}
                              {bout.by && bout.by !== "Draw" ? ` (${bout.by})` : ""}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Pending</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ));
            })()}

            {currentTournament.bracket.some((b) => b.winner === undefined) && (
              <Button onClick={runNextRound} className="w-full gap-2">
                <Play className="h-4 w-4" /> Run Next Round
              </Button>
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
              className={s === state.season ? "border-primary/50 glow-primary" : "opacity-70"}
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
                        <span className="font-semibold">{t.champion ?? "—"}</span>
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
