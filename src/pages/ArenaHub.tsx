import React, { useMemo } from "react";
import { useGameStore } from "@/state/useGameStore";
import { STYLE_DISPLAY_NAMES, type Warrior } from "@/types/game";
import { MOOD_DESCRIPTIONS, MOOD_ICONS, CROWD_MOODS, getMoodModifiers, type CrowdMood } from "@/engine/crowdMood";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatBadge } from "@/components/ui/StatBadge";
import { WarriorNameTag } from "@/components/ui/WarriorNameTag";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { WarriorLink } from "@/components/EntityLink";
import {
  Trophy, Swords, Flame, Star, Skull, Zap, Eye,
  TrendingUp, TrendingDown, Minus, LayoutDashboard,
  Activity, Bell, Target, Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";

// Import new Widgets
import { MedicalWidget } from "@/components/widgets/MedicalWidget";
import { InboxWidget } from "@/components/widgets/InboxWidget";
import { NextBoutWidget } from "@/components/widgets/NextBoutWidget";
import { TreasuryWidget } from "@/components/widgets/TreasuryWidget";

// ─── Crowd Mood Meter ──────────────────────────────────────────────────────

function CrowdMoodWidget() {
  const { state } = useGameStore();
  const mood = state.crowdMood as CrowdMood;
  const mods = getMoodModifiers(mood);

  return (
    <Card className="h-full border-l-4 border-l-accent/50 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-display font-black flex items-center gap-2 uppercase tracking-tighter">
          <Eye className="h-4 w-4 text-accent" /> Crowd Temperament
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
           <span className="text-2xl">{MOOD_ICONS[mood]}</span>
           <div className="text-right">
             <span className="text-[10px] uppercase font-bold text-muted-foreground block">Current State</span>
             <span className="text-xs font-black uppercase text-accent">{mood}</span>
           </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-center pt-1">
          <div className="rounded border border-border/40 p-1.5 bg-secondary/20">
            <div className={`text-xs font-bold font-mono ${mods.fameMultiplier > 1 ? "text-primary" : "text-muted-foreground"}`}>
              ×{mods.fameMultiplier.toFixed(1)}
            </div>
            <div className="text-[8px] text-muted-foreground uppercase font-medium">Fame</div>
          </div>
          <div className="rounded border border-border/40 p-1.5 bg-secondary/20">
            <div className={`text-xs font-bold font-mono ${mods.killChanceBonus > 0 ? "text-destructive" : "text-muted-foreground"}`}>
              {mods.killChanceBonus > 0 ? "+" : ""}{(mods.killChanceBonus * 100).toFixed(0)}%
            </div>
            <div className="text-[8px] text-muted-foreground uppercase font-medium">Lethality</div>
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
    for (const w of state.roster) {
      if (w.status === "Active") warriors.push({ warrior: w, stableName: state.player.stableName, isPlayer: true });
    }
    for (const r of state.rivals ?? []) {
      for (const w of r.roster) {
        if (w.status === "Active") warriors.push({ warrior: w, stableName: r.owner.stableName, isPlayer: false });
      }
    }
    return warriors.sort((a, b) => b.warrior.fame - a.warrior.fame).slice(0, 10);
  }, [state.roster, state.rivals, state.player.stableName]);

  return (
    <Card className="shadow-lg border-t-2 border-t-primary/20">
      <CardHeader className="pb-2 border-b border-border/50">
        <CardTitle className="text-sm font-display font-black flex items-center gap-2 uppercase tracking-tighter">
          <Trophy className="h-4 w-4 text-arena-gold" /> Global Power Rankings
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="h-8 hover:bg-transparent">
              <TableHead className="w-8 pl-4 h-8 text-[10px] font-bold uppercase">#</TableHead>
              <TableHead className="h-8 text-[10px] font-bold uppercase">Warrior</TableHead>
              <TableHead className="h-8 text-[10px] font-bold uppercase">Stable</TableHead>
              <TableHead className="h-8 text-[10px] font-bold uppercase text-center">W-L-K</TableHead>
              <TableHead className="h-8 pr-4 text-[10px] font-bold uppercase text-right">Fame</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allWarriors.map((entry, i) => {
              const w = entry.warrior;
              return (
                <TableRow key={w.id} className={cn("h-10 border-b border-border/20", entry.isPlayer ? "bg-primary/5" : "hover:bg-muted/20")}>
                  <TableCell className="pl-4 font-mono text-[10px] font-black text-muted-foreground">
                    {String(i + 1).padStart(2, '0')}
                  </TableCell>
                  <TableCell>
                    <WarriorNameTag id={w.id} name={w.name} isChampion={w.champion} />
                  </TableCell>
                  <TableCell className="text-[10px] font-medium text-muted-foreground italic">
                    {entry.stableName}
                  </TableCell>
                  <TableCell className="text-center font-mono text-[10px]">
                    <span className="text-primary">{w.career.wins}</span>
                    <span className="mx-0.5 opacity-30">/</span>
                    <span className="text-destructive">{w.career.losses}</span>
                    <span className="mx-0.5 opacity-30">/</span>
                    <span className="text-arena-blood font-bold">{w.career.kills}</span>
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <span className="font-mono font-bold text-arena-fame">{w.fame}</span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ─── Main Hub Page ────────────────────────────────────────────────────────────

export default function ArenaHub() {
  const { state } = useGameStore();

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header Stat Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div>
          <h1 className="text-3xl font-display font-black tracking-tighter uppercase flex items-center gap-3">
             Arena Hub <span className="text-[10px] font-mono font-normal tracking-widest text-muted-foreground/60 align-middle">CORE_COMMAND_V2.0</span>
          </h1>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
            {state.season} · Week {state.week} · {state.player.stableName}
          </p>
        </div>
        <div className="flex items-center gap-4">
           <div className="text-right">
              <div className="text-[10px] text-muted-foreground font-bold uppercase">Treasury</div>
              <div className="text-lg font-display font-bold text-arena-gold">${state.player.funds}</div>
           </div>
           <Separator orientation="vertical" className="h-10" />
           <div className="text-right">
              <div className="text-[10px] text-muted-foreground font-bold uppercase">Roster</div>
              <div className="text-lg font-display font-bold text-primary">{state.roster.filter(w=>w.status==="Active").length} Active</div>
           </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
        {/* News Feed - 3 Columns wide */}
        <div className="lg:col-span-4 h-full">
           <InboxWidget />
        </div>

        {/* Side Column 1 - 2 Columns wide (Stacked on mobile) */}
        <div className="lg:col-span-2 space-y-4">
           <MedicalWidget />
           <CrowdMoodWidget />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
        {/* Global Rankings - 3 Columns wide */}
        <div className="lg:col-span-4">
           <ArenaLeaderboard />
        </div>

        {/* Ops Center - 2 Columns wide */}
        <div className="lg:col-span-2 space-y-4">
           <NextBoutWidget />
           <TreasuryWidget />
        </div>
      </div>

      {/* Narrative Legend Overlay (Subtle) */}
      <div className="flex items-center justify-center gap-8 py-4 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
         <div className="flex items-center gap-1.5 text-[9px] uppercase font-bold">
            <Skull className="h-3 w-3 text-destructive" /> Lethality Active
         </div>
         <div className="flex items-center gap-1.5 text-[9px] uppercase font-bold">
            <TrendingUp className="h-3 w-3 text-primary" /> Economy Stable
         </div>
         <div className="flex items-center gap-1.5 text-[9px] uppercase font-bold">
            <Star className="h-3 w-3 text-arena-gold" /> Fame Multiplier High
         </div>
      </div>
    </div>
  );
}
