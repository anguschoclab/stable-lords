/**
 * Arena Hub — Full arena view with cross-arena leaderboard, crowd mood meter,
 * and spotlight feed. Design Bible v3.0 §9.1
 */
import React, { useMemo } from "react";
import { useGameStore } from "@/state/useGameStore";
import { Link } from "@tanstack/react-router";
import { STYLE_DISPLAY_NAMES, STYLE_ABBREV, type Warrior } from "@/types/game";
import { MOOD_DESCRIPTIONS, MOOD_ICONS, CROWD_MOODS, getMoodModifiers, type CrowdMood } from "@/engine/crowdMood";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { WarriorLink, StableLink } from "@/components/EntityLink";
import {
  Trophy, Swords, Flame, Star, Skull, Zap, Eye,
  TrendingUp, TrendingDown, Minus,
} from "lucide-react";

// ─── Crowd Mood Meter ──────────────────────────────────────────────────────

function CrowdMoodMeter() {
  const { state } = useGameStore();
  const mood = state.crowdMood as CrowdMood;
  const mods = getMoodModifiers(mood);
  const desc = MOOD_DESCRIPTIONS[mood] ?? "";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <Eye className="h-4 w-4 text-accent" /> Crowd Temperament
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mood selector display */}
        <div className="flex items-center justify-center gap-3">
          {CROWD_MOODS.map(m => (
            <div
              key={m}
              className={`flex flex-col items-center gap-1 transition-all ${
                m === mood ? "scale-125 opacity-100" : "opacity-30"
              }`}
            >
              <span className="text-2xl">{MOOD_ICONS[m]}</span>
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">
                {m}
              </span>
            </div>
          ))}
        </div>

        {/* Description */}
        <p className="text-sm text-center text-muted-foreground italic">{desc}</p>

        {/* Modifiers */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-secondary/60 p-2 border border-border/50">
            <div className={`text-sm font-bold ${mods.fameMultiplier > 1 ? "text-arena-fame" : mods.fameMultiplier < 1 ? "text-destructive" : ""}`}>
              ×{mods.fameMultiplier.toFixed(1)}
            </div>
            <div className="text-[10px] text-muted-foreground">Fame</div>
          </div>
          <div className="rounded-lg bg-secondary/60 p-2 border border-border/50">
            <div className={`text-sm font-bold ${mods.popMultiplier > 1 ? "text-arena-pop" : mods.popMultiplier < 1 ? "text-destructive" : ""}`}>
              ×{mods.popMultiplier.toFixed(1)}
            </div>
            <div className="text-[10px] text-muted-foreground">Popularity</div>
          </div>
          <div className="rounded-lg bg-secondary/60 p-2 border border-border/50">
            <div className={`text-sm font-bold ${mods.killChanceBonus > 0 ? "text-destructive" : mods.killChanceBonus < 0 ? "text-arena-pop" : ""}`}>
              {mods.killChanceBonus > 0 ? "+" : ""}{(mods.killChanceBonus * 100).toFixed(0)}%
            </div>
            <div className="text-[10px] text-muted-foreground">Kill Chance</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Arena Leaderboard ────────────────────────────────────────────────────

function ArenaLeaderboard() {
  const { state } = useGameStore();

  const allWarriors = useMemo(() => {
    const warriors: { warrior: Warrior; stableName: string; isPlayer: boolean }[] = [];

    // Player roster
    for (const w of state.roster) {
      if (w.status === "Active") {
        warriors.push({ warrior: w, stableName: state.player.stableName, isPlayer: true });
      }
    }

    // Rival rosters
    for (const r of state.rivals ?? []) {
      for (const w of r.roster) {
        if (w.status === "Active") {
          warriors.push({ warrior: w, stableName: r.owner.stableName, isPlayer: false });
        }
      }
    }

    return warriors.sort((a, b) => b.warrior.fame - a.warrior.fame).slice(0, 15);
  }, [state.roster, state.rivals, state.player.stableName]);

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-arena-gold" /> Arena Rankings — Week {state.week}, {state.season}
        </CardTitle>
        <Badge variant="outline" className="text-[10px]">
          Top 15
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Warrior</TableHead>
              <TableHead>Stable</TableHead>
              <TableHead className="text-center">Style</TableHead>
              <TableHead className="text-center">W-L-K</TableHead>
              <TableHead className="text-right">Fame</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allWarriors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No warriors active yet.
                </TableCell>
              </TableRow>
            ) : (
              allWarriors.map((entry, i) => {
                const w = entry.warrior;
                const fameTrend = w.fame > 5 ? "up" : w.fame < 2 ? "down" : "flat";
                return (
                  <TableRow key={w.id} className={entry.isPlayer ? "bg-primary/5" : ""}>
                    <TableCell className={`font-mono font-bold ${
                      i === 0 ? "text-arena-gold" : i === 1 ? "text-arena-steel" : i === 2 ? "text-amber-700" : "text-muted-foreground"
                    }`}>
                      {i + 1}
                    </TableCell>
                    <TableCell>
                      <WarriorLink name={w.name} id={w.id} className="font-display font-semibold text-sm" />
                      {w.champion && <Trophy className="h-3 w-3 text-arena-gold inline ml-1" />}
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs ${entry.isPlayer ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                        {entry.stableName}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {STYLE_ABBREV[w.style]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs">
                      <span className="text-arena-pop">{w.career.wins}</span>
                      -
                      <span className="text-destructive">{w.career.losses}</span>
                      -
                      <span className="text-arena-blood">{w.career.kills}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="flex items-center justify-end gap-1">
                        <span className="font-bold text-arena-fame">{w.fame}</span>
                        {fameTrend === "up" && <TrendingUp className="h-3 w-3 text-arena-pop" />}
                        {fameTrend === "down" && <TrendingDown className="h-3 w-3 text-destructive" />}
                        {fameTrend === "flat" && <Minus className="h-3 w-3 text-muted-foreground" />}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ─── Spotlight Feed ───────────────────────────────────────────────────────

function SpotlightFeed() {
  const { state } = useGameStore();

  const spotlights = useMemo(() => {
    const items: { text: string; icon: string; week: number; type: string }[] = [];

    // Recent kills
    for (const f of state.arenaHistory.slice(-20).reverse()) {
      if (f.by === "Kill") {
        const killer = f.winner === "A" ? f.a : f.d;
        const victim = f.winner === "A" ? f.d : f.a;
        items.push({
          text: `${killer} slew ${victim} in week ${f.week}!`,
          icon: "☠️",
          week: f.week,
          type: "kill",
        });
      }
      if (f.flashyTags?.includes("Flashy")) {
        const star = f.winner === "A" ? f.a : f.d;
        items.push({
          text: `${star} put on a spectacular show in week ${f.week}.`,
          icon: "✨",
          week: f.week,
          type: "flashy",
        });
      }
    }

    // Rivalries
    for (const r of state.rivalries ?? []) {
      items.push({
        text: `Blood feud: ${r.reason} (Intensity ${"🔥".repeat(Math.min(r.intensity, 5))})`,
        icon: "⚔️",
        week: r.startWeek,
        type: "rivalry",
      });
    }

    return items.slice(0, 8);
  }, [state.arenaHistory, state.rivalries]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <Star className="h-4 w-4 text-arena-gold" /> Spotlight Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        {spotlights.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            No notable events yet. Run some rounds to generate arena drama!
          </p>
        ) : (
          <div className="space-y-2">
            {spotlights.map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-base shrink-0">{s.icon}</span>
                <div className="flex-1">
                  <p className="text-xs text-foreground/80">{s.text}</p>
                  <span className="text-[10px] text-muted-foreground font-mono">Wk {s.week}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Active Rivalries ─────────────────────────────────────────────────────

function RivalryPanel() {
  const { state } = useGameStore();
  const rivalries = (state.rivalries ?? []).filter(r => r.intensity > 0);

  if (rivalries.length === 0) return null;

  return (
    <Card className="border-destructive/30">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <Flame className="h-4 w-4 text-destructive" /> Active Rivalries
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {rivalries.map((r, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{r.reason}</span>
                <Badge variant="destructive" className="text-[10px]">
                  {"🔥".repeat(Math.min(r.intensity, 5))}
                </Badge>
              </div>
              <Progress value={r.intensity * 20} className="h-1.5" />
              <span className="text-[10px] text-muted-foreground">Since week {r.startWeek}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────

export default function ArenaHub() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Swords className="h-6 w-6 text-primary" /> Arena Hub
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          The beating heart of the arena — rankings, mood, and drama.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <CrowdMoodMeter />
        <SpotlightFeed />
        <RivalryPanel />
      </div>

      <ArenaLeaderboard />
    </div>
  );
}
