/**
 * Hall of Fights — displays arena history and crowd-remembered epics.
 * Uses the main game state arenaHistory and LoreArchive for hall entries.
 */
import React, { useMemo } from "react";
import { useGameStore, useWorldState } from "@/state/useGameStore";
import { LoreArchive } from "./LoreArchive";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Swords, Skull, Sparkles, ScrollText, Zap, Newspaper } from "lucide-react";
import { STYLE_DISPLAY_NAMES } from "@/types/game";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { WarriorLink } from "@/components/EntityLink";
import Gazette from "@/pages/Gazette";
import Graveyard from "@/pages/Graveyard";

export const HallOfFights: React.FC = () => {
  const state = useWorldState();

  // Hall entries from LoreArchive
  const hallEntries = useMemo(() => {
    // state.week is used as a dependency to ensure hall entries are refreshed when time advances
    void state.week;
    return LoreArchive.allHall().slice().reverse();
  }, [state.week]);

  // Build fight lookup from game state
  const fightMap = useMemo(
    () => new Map(state.arenaHistory.map((f) => [f.id, f])),
    [state.arenaHistory]
  );

  // Recent fights grouped by week
  const fightsByWeek = useMemo(() => {
    const groups = new Map<number, typeof state.arenaHistory>();
    for (const f of state.arenaHistory.slice(-50)) {
      const list = groups.get(f.week) ?? [];
      list.push(f);
      groups.set(f.week, list);
    }
    return [...groups.entries()].sort(([a], [b]) => b - a);

  }, [state]);

  // Style stats from all history
  const styleStats = useMemo(() => {
    const stats: Record<string, { wins: number; losses: number; kills: number; fights: number }> = {};
    for (const f of state.arenaHistory) {
      const ensure = (s: string) => {
        if (!stats[s]) stats[s] = { wins: 0, losses: 0, kills: 0, fights: 0 };
      };
      ensure(f.styleA);
      ensure(f.styleD);
      stats[f.styleA].fights++;
      stats[f.styleD].fights++;
      if (f.winner === "A") { stats[f.styleA].wins++; stats[f.styleD].losses++; }
      if (f.winner === "D") { stats[f.styleD].wins++; stats[f.styleA].losses++; }
      if (f.by === "Kill") {
        if (f.winner === "A") stats[f.styleA].kills++;
        if (f.winner === "D") stats[f.styleD].kills++;
      }
    }
    return Object.entries(stats)
      .map(([style, s]) => ({ style, ...s, winRate: s.fights ? Math.round((s.wins / s.fights) * 100) : 0 }))
      .sort((a, b) => b.winRate - a.winRate);
  }, [state.arenaHistory]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Chronicle</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Arena history, legendary bouts, and style analytics.
        </p>
      </div>

      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history" className="gap-1.5">
            <ScrollText className="h-3.5 w-3.5" /> Fight Log
          </TabsTrigger>
          <TabsTrigger value="legends" className="gap-1.5">
            <Trophy className="h-3.5 w-3.5" /> Legends
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Style Stats
          </TabsTrigger>
          <TabsTrigger value="gazette" className="gap-1.5">
            <Newspaper className="h-3.5 w-3.5" /> Gazette
          </TabsTrigger>
          <TabsTrigger value="graveyard" className="gap-1.5">
            <Skull className="h-3.5 w-3.5" /> Graveyard
          </TabsTrigger>
        </TabsList>

        {/* Fight History */}
        <TabsContent value="history" className="space-y-4 mt-4">
          {fightsByWeek.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center space-y-3">
                <ScrollText className="h-10 w-10 mx-auto text-muted-foreground/50" />
                <p className="text-muted-foreground">No fights recorded yet. Run some rounds to fill the archives.</p>
                <Link to="/command/combat">
                  <Button variant="outline" className="gap-2 mt-2">
                    <Zap className="h-4 w-4" /> Run a Round
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            fightsByWeek.map(([week, fights]) => (
              <Card key={week}>
                <CardHeader className="pb-2">
                  <CardTitle className="font-display text-sm text-muted-foreground">
                    Week {week}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {fights.map((f) => {
                    const isKill = f.by === "Kill";
                    const isKO = f.by === "KO";
                    return (
                      <div
                        key={f.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 py-2 border-b border-border last:border-0"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isKill ? (
                            <Skull className="h-4 w-4 text-destructive shrink-0" />
                          ) : (
                            <Swords className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                          <WarriorLink name={f.a} className="text-sm font-medium" />
                          <span className="text-xs text-muted-foreground">vs</span>
                          <WarriorLink name={f.d} className="text-sm font-medium" />
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 ml-6 sm:ml-0 flex-wrap">
                          {f.flashyTags?.map((t) => (
                            <Badge key={t} variant="secondary" className="text-[10px]">
                              {t}
                            </Badge>
                          ))}
                          <Badge
                            variant={isKill ? "destructive" : isKO ? "default" : "outline"}
                            className="text-xs whitespace-nowrap"
                          >
                            {f.winner
                              ? `${f.winner === "A" ? f.a : f.d} — ${f.by}`
                              : "Draw"}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Legends — Hall of Fame fights */}
        <TabsContent value="legends" className="space-y-4 mt-4">
          {hallEntries.length === 0 ? (
            <p className="text-muted-foreground italic">No legendary fights recorded yet.</p>
          ) : (
            hallEntries.map((h) => {
              const f = fightMap.get(h.fightId);
              if (!f) return null;
              return (
                <Card key={`${h.fightId}_${h.label}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-arena-gold" />
                        <span className="font-display font-semibold text-sm">{h.label}</span>
                        <Badge variant="outline" className="text-xs">Week {h.week}</Badge>
                      </div>
                    </div>
                    <div className="text-sm">
                      <WarriorLink name={f.a} className="font-medium" />
                      {" vs "}
                      <WarriorLink name={f.d} className="font-medium" />
                      {f.by && ` — ${f.winner === "A" ? f.a : f.d} by ${f.by}`}
                    </div>
                    {f.flashyTags && f.flashyTags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {f.flashyTags.map((t) => (
                          <Badge key={t} variant="secondary" className="text-xs">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Style Stats */}
        <TabsContent value="stats" className="mt-4">
          {styleStats.length === 0 ? (
            <p className="text-muted-foreground italic">No data yet.</p>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/50">
                      <tr className="text-left text-muted-foreground">
                        <th className="px-4 py-3 font-medium">Style</th>
                        <th className="px-4 py-3 font-medium text-right">Fights</th>
                        <th className="px-4 py-3 font-medium text-right">Wins</th>
                        <th className="px-4 py-3 font-medium text-right">Losses</th>
                        <th className="px-4 py-3 font-medium text-right">Kills</th>
                        <th className="px-4 py-3 font-medium text-right">Win %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {styleStats.map((s) => (
                        <tr key={s.style} className="border-t border-border">
                          <td className="px-4 py-2.5 font-medium">
                            {STYLE_DISPLAY_NAMES[s.style as keyof typeof STYLE_DISPLAY_NAMES] ?? s.style}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono">{s.fights}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-arena-pop">{s.wins}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-destructive">{s.losses}</td>
                          <td className="px-4 py-2.5 text-right font-mono">{s.kills}</td>
                          <td className="px-4 py-2.5 text-right font-mono font-semibold">{s.winRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Gazette */}
        <TabsContent value="gazette" className="mt-4">
          <Gazette />
        </TabsContent>

        {/* Graveyard */}
        <TabsContent value="graveyard" className="mt-4">
          <Graveyard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HallOfFights;
