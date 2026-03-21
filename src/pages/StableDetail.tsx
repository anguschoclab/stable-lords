/**
 * Rival Stable Detail Page — shows stable identity, owner, roster, career records.
 */
import React, { useMemo } from "react";
import { useParams, Link } from "@tanstack/react-router";
import { useGameStore } from "@/state/useGameStore";
import { STYLE_DISPLAY_NAMES, ATTRIBUTE_KEYS, ATTRIBUTE_LABELS } from "@/types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { WarriorLink } from "@/components/EntityLink";
import {
  Shield, Users, Swords, Skull, Trophy, Star,
  ArrowLeft, Quote, Scroll, Dumbbell, Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const TIER_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  Legendary: { label: "Legendary", color: "text-arena-gold border-arena-gold/40 bg-arena-gold/10", icon: Crown },
  Major: { label: "Major", color: "text-primary border-primary/40 bg-primary/10", icon: Trophy },
  Established: { label: "Established", color: "text-arena-fame border-arena-fame/40 bg-arena-fame/10", icon: Shield },
  Minor: { label: "Minor", color: "text-muted-foreground border-border bg-muted/30", icon: Star },
};

export default function StableDetail() {
  const { id } = useParams({ strict: false }) as { id: string };
  const { state } = useGameStore();

  const rival = useMemo(
    () => (state.rivals ?? []).find(r => r.owner.id === id),
    [state.rivals, id]
  );

  if (!rival) {
    return (
      <div className="space-y-4 py-8 text-center">
        <Shield className="h-12 w-12 mx-auto text-muted-foreground/30" />
        <p className="text-muted-foreground">Stable not found.</p>
        <Button variant="outline" asChild><Link to="/scouting">Back to Scouting</Link></Button>
      </div>
    );
  }

  const activeRoster = rival.roster.filter(w => w.status === "Active");
  const deadWarriors = rival.roster.filter(w => w.status === "Dead");
  const { wins: totalWins, losses: totalLosses, kills: totalKills } = rival.roster.reduce(
    (acc, w) => ({
      wins: acc.wins + w.career.wins,
      losses: acc.losses + w.career.losses,
      kills: acc.kills + w.career.kills,
    }),
    { wins: 0, losses: 0, kills: 0 }
  );
  const totalFights = totalWins + totalLosses;
  const winRate = totalFights > 0 ? Math.round((totalWins / totalFights) * 100) : 0;

  const tierCfg = TIER_CONFIG[rival.tier ?? "Minor"] ?? TIER_CONFIG.Minor;
  const TierIcon = tierCfg.icon;

  // Find bouts involving this stable from arena history
  const stableWarriorNames = new Set(rival.roster.map(w => w.name));
  const recentBouts = state.arenaHistory
    .filter(f => stableWarriorNames.has(f.a) || stableWarriorNames.has(f.d))
    .slice(-8)
    .reverse();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link to="/scouting" className="flex items-center gap-1 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Scouting
          </Link>
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold flex items-center gap-3">
              <Shield className="h-7 w-7 text-primary" />
              {rival.owner.stableName}
            </h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="outline" className={`${tierCfg.color} gap-1`}>
                <TierIcon className="h-3 w-3" />
                {tierCfg.label}
              </Badge>
              <Badge variant="outline">{rival.owner.personality}</Badge>
              {rival.philosophy && (
                <Badge variant="secondary" className="text-xs">{rival.philosophy}</Badge>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-sm text-muted-foreground">Owner</div>
            <div className="font-display font-semibold">{rival.owner.name}</div>
            <div className="text-xs text-arena-fame mt-0.5">
              {rival.owner.fame} fame · {rival.owner.titles} title{rival.owner.titles !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>

      {/* Motto & Origin */}
      {(rival.motto || rival.origin) && (
        <Card>
          <CardContent className="py-4 space-y-3">
            {rival.motto && (
              <div className="flex items-start gap-2">
                <Quote className="h-4 w-4 text-arena-gold shrink-0 mt-0.5" />
                <p className="italic text-sm font-display text-foreground">"{rival.motto}"</p>
              </div>
            )}
            {rival.origin && (
              <div className="flex items-start gap-2">
                <Scroll className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground leading-relaxed">{rival.origin}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card>
          <CardContent className="py-3 px-4 text-center">
            <div className="text-2xl font-display font-bold">{activeRoster.length}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4 text-center">
            <div className="text-2xl font-display font-bold text-arena-pop">{totalWins}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Wins</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4 text-center">
            <div className="text-2xl font-display font-bold text-destructive">{totalLosses}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Losses</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4 text-center">
            <div className="text-2xl font-display font-bold text-arena-blood">{totalKills}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Kills</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4 text-center">
            <div className="text-2xl font-display font-bold">{winRate}%</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Win Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Roster */}
      <div>
        <h2 className="text-lg font-display font-bold flex items-center gap-2 mb-3">
          <Users className="h-5 w-5 text-primary" /> Roster ({activeRoster.length} active)
        </h2>

        <div className="grid gap-3 sm:grid-cols-2">
          {activeRoster
            .sort((a, b) => b.fame - a.fame)
            .map(w => {
              const fights = w.career.wins + w.career.losses;
              const wr = fights > 0 ? Math.round((w.career.wins / fights) * 100) : 0;
              return (
                <Card key={w.id} className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <WarriorLink name={w.name} id={w.id} className="font-display font-bold text-sm">
                          {w.name}
                        </WarriorLink>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-[10px] h-5">
                            {STYLE_DISPLAY_NAMES[w.style]}
                          </Badge>
                          {w.age && (
                            <span className="text-[10px] text-muted-foreground">Age {w.age}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-arena-fame font-semibold">{w.fame} fame</div>
                        <div className="text-[10px] text-muted-foreground">{w.popularity} pop</div>
                      </div>
                    </div>

                    <Separator className="my-2" />

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Swords className="h-3 w-3 text-primary" />
                          <span className="text-arena-pop">{w.career.wins}W</span>
                          <span className="text-destructive">{w.career.losses}L</span>
                        </span>
                        {w.career.kills > 0 && (
                          <span className="flex items-center gap-0.5 text-arena-blood">
                            <Skull className="h-3 w-3" /> {w.career.kills}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Progress value={wr} className="h-1.5 w-16" />
                        <span className="text-muted-foreground w-8 text-right">{wr}%</span>
                      </div>
                    </div>

                    {/* Attribute bars */}
                    <div className="grid grid-cols-7 gap-1 mt-2">
                      {ATTRIBUTE_KEYS.map(k => (
                        <div key={k} className="text-center">
                          <div className="text-[9px] text-muted-foreground uppercase">{k}</div>
                          <div className="text-[11px] font-mono font-semibold">{w.attributes[k]}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>

        {/* Dead warriors */}
        {deadWarriors.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-display font-semibold text-destructive flex items-center gap-1.5 mb-2">
              <Skull className="h-4 w-4" /> Fallen ({deadWarriors.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {deadWarriors.map(w => (
                <Badge key={w.id} variant="outline" className="text-destructive/70 border-destructive/20">
                  <WarriorLink name={w.name} id={w.id}>{w.name}</WarriorLink>
                  <span className="ml-1 text-muted-foreground">
                    {w.career.wins}W-{w.career.losses}L
                    {w.career.kills > 0 ? ` ${w.career.kills}K` : ""}
                  </span>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Bouts */}
      {recentBouts.length > 0 && (
        <div>
          <h2 className="text-lg font-display font-bold flex items-center gap-2 mb-3">
            <Swords className="h-5 w-5 text-primary" /> Recent Arena History
          </h2>
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {recentBouts.map(f => {
                const isStableA = stableWarriorNames.has(f.a);
                const won = (f.winner === "A" && isStableA) || (f.winner === "D" && !isStableA);
                return (
                  <div key={f.id} className="px-4 py-2.5 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${won ? "bg-arena-pop" : f.winner ? "bg-destructive" : "bg-muted-foreground"}`} />
                      <span>
                        <WarriorLink name={f.a} className="font-medium" /> vs <WarriorLink name={f.d} className="font-medium" />
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Wk {f.week}</span>
                      {f.by && <Badge variant="outline" className="text-[10px] h-5">{f.by}</Badge>}
                      {f.by === "Kill" && <Skull className="h-3 w-3 text-arena-blood" />}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
