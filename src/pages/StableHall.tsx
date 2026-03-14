/**
 * Stable Hall — Player's stable prestige page.
 * Design Bible v3.0 §9.2: Reputation sliders, roster wall, trainer table.
 */
import React, { useMemo } from "react";
import { useGame } from "@/state/GameContext";
import { Link, useNavigate } from "@tanstack/react-router";
import { STYLE_DISPLAY_NAMES, STYLE_ABBREV, ATTRIBUTE_KEYS, type Warrior } from "@/types/game";
import { computeStableReputation } from "@/engine/stableReputation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { WarriorLink } from "@/components/EntityLink";
import {
  Shield, Users, Trophy, Star, Skull, Swords, Heart,
  GraduationCap, Eye, Flame, Sparkles, Crown, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Reputation Sliders ───────────────────────────────────────────────────

const REP_LABELS: { key: keyof ReturnType<typeof computeStableReputation>; label: string; icon: React.ReactNode; color: string; desc: string }[] = [
  { key: "fame", label: "Fame", icon: <Star className="h-3.5 w-3.5" />, color: "bg-arena-gold", desc: "Public acclaim from wins and showmanship" },
  { key: "notoriety", label: "Notoriety", icon: <Skull className="h-3.5 w-3.5" />, color: "bg-destructive", desc: "Feared reputation from kills and rivalries" },
  { key: "honor", label: "Honor", icon: <Shield className="h-3.5 w-3.5" />, color: "bg-primary", desc: "Moral standing — respect from the crowd" },
  { key: "adaptability", label: "Adaptability", icon: <Sparkles className="h-3.5 w-3.5" />, color: "bg-arena-pop", desc: "Strategic responsiveness to the meta" },
];

function ReputationSliders() {
  const { state } = useGame();
  const rep = useMemo(() => computeStableReputation(state), [state]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <Eye className="h-4 w-4 text-accent" /> Stable Reputation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {REP_LABELS.map(({ key, label, icon, color, desc }) => (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                {icon}
                {label}
              </div>
              <span className="text-sm font-mono font-bold">{rep[key]}</span>
            </div>
            <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${color} transition-all duration-700`}
                style={{ width: `${rep[key]}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">{desc}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Roster Wall ──────────────────────────────────────────────────────────

function RosterWall() {
  const { state } = useGame();
  const navigate = useNavigate();

  const sortedRoster = useMemo(
    () => [...state.roster]
      .filter(w => w.status === "Active")
      .sort((a, b) => b.fame - a.fame),
    [state.roster]
  );

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" /> Roster Wall
        </CardTitle>
        <Badge variant="outline" className="text-[10px]">{sortedRoster.length} warriors</Badge>
      </CardHeader>
      <CardContent>
        {sortedRoster.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No active warriors. <Link to="/recruit" className="text-primary hover:underline">Recruit your first.</Link>
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {sortedRoster.map((w, i) => {
              const fights = w.career.wins + w.career.losses;
              const winRate = fights > 0 ? Math.round((w.career.wins / fights) * 100) : 0;
              const injuryCount = (w.injuries ?? []).length;

              return (
                <button
                  key={w.id}
                  onClick={() => navigate({ to: `/warrior/${w.id}` })}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/40 bg-card transition-colors text-left group"
                >
                  {/* Rank badge */}
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-display font-bold shrink-0 ${
                    i === 0 ? "bg-arena-gold text-background" :
                    i === 1 ? "bg-muted text-arena-steel" :
                    "bg-secondary text-muted-foreground"
                  }`}>
                    {i + 1}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-display font-bold text-sm truncate">{w.name}</span>
                      {w.champion && <Crown className="h-3 w-3 text-arena-gold shrink-0" />}
                      {injuryCount > 0 && <Heart className="h-3 w-3 text-destructive shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[10px] font-mono h-4 px-1">
                        {STYLE_ABBREV[w.style]}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {w.career.wins}W-{w.career.losses}L
                        {w.career.kills > 0 && <span className="text-arena-blood ml-0.5">{w.career.kills}K</span>}
                      </span>
                    </div>

                    {/* Attribute mini-bar */}
                    <div className="flex gap-1.5 mt-1.5">
                      {ATTRIBUTE_KEYS.map(k => (
                        <div key={k} className="text-center">
                          <div className="text-[8px] text-muted-foreground">{k}</div>
                          <div className={`text-[10px] font-mono ${
                            w.attributes[k] >= 15 ? "text-primary font-bold" :
                            w.attributes[k] <= 7 ? "text-destructive/70" : "text-foreground/70"
                          }`}>
                            {w.attributes[k]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fame & win rate */}
                  <div className="text-right shrink-0 space-y-1">
                    <div className="text-sm font-bold text-arena-fame">{w.fame}</div>
                    <div className="text-[9px] text-muted-foreground">{w.popularity} pop</div>
                    <div className="flex items-center gap-1">
                      <Progress value={winRate} className="h-1 w-10" />
                      <span className="text-[9px] text-muted-foreground">{winRate}%</span>
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 shrink-0 self-center group-hover:text-primary transition-colors" />
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Trainer Table ────────────────────────────────────────────────────────

function TrainerTable() {
  const { state } = useGame();
  const trainers = (state.trainers ?? []).filter(t => t.contractWeeksLeft > 0);

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary" /> Trainers
        </CardTitle>
        <Link to="/trainers">
          <Button variant="ghost" size="sm" className="text-[10px] gap-1">
            Manage <ChevronRight className="h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {trainers.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            No active trainers. <Link to="/trainers" className="text-primary hover:underline">Hire one.</Link>
          </p>
        ) : (
          <div className="space-y-2">
            {trainers.map(t => {
              const pct = (t.contractWeeksLeft / 52) * 100;
              return (
                <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30 border border-border/50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-display font-semibold truncate">{t.name}</span>
                      <Badge variant="outline" className="text-[10px]">{t.tier}</Badge>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {t.focus}
                      {t.styleBonusStyle && ` · Bonus: ${STYLE_DISPLAY_NAMES[t.styleBonusStyle as keyof typeof STYLE_DISPLAY_NAMES] ?? t.styleBonusStyle}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Progress value={pct} className="h-1.5 w-12" />
                    <span className={`text-xs font-mono ${t.contractWeeksLeft <= 4 ? "text-destructive" : "text-muted-foreground"}`}>
                      {t.contractWeeksLeft}w
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────

export default function StableHall() {
  const { state } = useGame();

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold flex items-center gap-3">
            <Shield className="h-7 w-7 text-primary" />
            {state.player.stableName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hall of Records — your stable's prestige and legacy.
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm text-muted-foreground">Owner</div>
          <div className="font-display font-semibold">{state.player.name}</div>
          <div className="text-xs text-arena-fame mt-0.5">
            {state.fame} fame · {state.player.titles} title{state.player.titles !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Reputation + Trainers row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ReputationSliders />
        <TrainerTable />
      </div>

      {/* Roster Wall */}
      <RosterWall />
    </div>
  );
}
