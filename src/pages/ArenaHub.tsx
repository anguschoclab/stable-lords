import React, { useMemo } from "react";
import { useGameStore } from "@/state/useGameStore";
import { STYLE_DISPLAY_NAMES, type Warrior } from "@/types/game";
import { MOOD_DESCRIPTIONS, MOOD_ICONS, CROWD_MOODS, getMoodModifiers, type CrowdMood } from "@/engine/crowdMood";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WarriorBadge } from "@/components/ui/WarriorBadges";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { WarriorLink } from "@/components/EntityLink";
import {
  Trophy, Swords, Flame, Star, Skull, Zap, Eye,
  TrendingUp, TrendingDown, Minus, LayoutDashboard,
  Activity, Bell, Target, Wallet, Info
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Import new Widgets
import { MedicalWidget } from "@/components/widgets/MedicalWidget";
import { InboxWidget } from "@/components/widgets/InboxWidget";
import { NextBoutWidget } from "@/components/widgets/NextBoutWidget";
import { TreasuryWidget } from "@/components/widgets/TreasuryWidget";
import { MetaDriftWidget } from "@/components/widgets/MetaDriftWidget";

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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="rounded border border-border/40 p-1.5 bg-secondary/20 cursor-help transition-colors hover:bg-secondary/40">
                  <div className={`text-xs font-bold font-mono ${mods.fameMultiplier > 1 ? "text-primary" : "text-muted-foreground"}`}>
                    ×{mods.fameMultiplier.toFixed(1)}
                  </div>
                  <div className="text-[8px] text-muted-foreground uppercase font-medium">Fame</div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="text-[10px]">Multiplies all fame gains from this week's bouts.</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="rounded border border-border/40 p-1.5 bg-secondary/20 cursor-help transition-colors hover:bg-secondary/40">
                  <div className={`text-xs font-bold font-mono ${mods.killChanceBonus > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                    {mods.killChanceBonus > 0 ? "+" : ""}{(mods.killChanceBonus * 100).toFixed(0)}%
                  </div>
                  <div className="text-[8px] text-muted-foreground uppercase font-medium">Lethality</div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="text-[10px]">Probability bonus added to all fatal blow checks.</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-[9px] text-muted-foreground italic leading-tight text-center pt-1">
          {MOOD_DESCRIPTIONS[mood]}
        </p>
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
                    <WarriorBadge variant="name" id={w.id} name={w.name} isChampion={w.champion} />
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
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome & Context Strip */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-display font-black tracking-tighter uppercase text-glow-gold">
             Command Center
          </h1>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-[0.3em] flex items-center gap-2">
            <Activity className="h-3 w-3 text-primary" /> System Status: Operational · <span className="text-accent">{state.phase.toUpperCase()} PHASE</span>
          </p>
        </div>
        
        <div className="flex gap-2">
           <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black uppercase tracking-widest text-[10px] px-3 py-1">
             {state.roster.filter(w=>w.status==="Active").length} Warriors Active
           </Badge>
           <Badge variant="outline" className="bg-arena-gold/5 text-arena-gold border-arena-gold/20 font-black uppercase tracking-widest text-[10px] px-3 py-1">
             Ranked #{Math.floor(Math.random() * 5) + 1} Global
           </Badge>
        </div>
      </div>

      {/* Primary Intelligence Layer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* News & Communications (Critical) */}
        <div className="lg:col-span-8 space-y-6">
           <div className="bg-glass-card rounded-3xl overflow-hidden border-neon transition-all hover:shadow-primary/5">
             <InboxWidget />
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-glass-card rounded-2xl p-1 border-neon">
                 <NextBoutWidget />
              </div>
              <div className="bg-glass-card rounded-2xl p-1 border-neon">
                 <MedicalWidget />
              </div>
           </div>
        </div>

        {/* Tactical Intel Side Pane */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-glass-card rounded-2xl p-1 border-neon-gold border-2">
              <CrowdMoodWidget />
           </div>
           <div className="bg-glass-card rounded-2xl p-1 border-neon">
              <MetaDriftWidget />
           </div>
           
           {/* Quick Stats / Ticker */}
           <Card className="bg-secondary/20 border-border/40 overflow-hidden">
             <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                  <span>Arena Analytics</span>
                  <Activity className="h-3 w-3" />
                </div>
                <div className="space-y-2">
                   <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Stable Renown</span>
                      <span className="font-mono font-bold text-arena-fame">{state.player.renown}</span>
                   </div>
                   <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Lifetime Kills</span>
                      <span className="font-mono font-bold text-destructive">{state.roster.reduce((s,w)=>s+w.career.kills,0)}</span>
                   </div>
                   <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Win Ratio</span>
                      <span className="font-mono font-bold text-primary">64%</span>
                   </div>
                </div>
             </CardContent>
           </Card>
        </div>
      </div>

      {/* Secondary Data Layer */}
      <div className="grid grid-cols-1 gap-6">
         <div className="bg-glass-card rounded-3xl overflow-hidden border-border/40">
           <ArenaLeaderboard />
         </div>
      </div>

      {/* Immersive Legend Footer */}
      <div className="pb-12 pt-4 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 opacity-50 overflow-hidden px-6">
         <div className="flex items-center gap-2 text-[9px] uppercase font-black tracking-[0.2em] whitespace-nowrap group cursor-default">
            <Skull className="h-4 w-4 text-destructive group-hover:scale-125 transition-transform" /> Bloodshed Protocols Enabled
         </div>
         <div className="flex items-center gap-2 text-[9px] uppercase font-black tracking-[0.2em] whitespace-nowrap group cursor-default">
            <TrendingUp className="h-4 w-4 text-primary group-hover:scale-125 transition-transform" /> Market Adaptation Level: High
         </div>
         <div className="flex items-center gap-2 text-[9px] uppercase font-black tracking-[0.2em] whitespace-nowrap group cursor-default">
            <Star className="h-4 w-4 text-arena-gold group-hover:scale-125 transition-transform" /> Global Fame Coefficient: 1.2x
         </div>
         <div className="flex items-center gap-3 text-[9px] uppercase font-black tracking-[0.2em] whitespace-nowrap group cursor-default">
            <Activity className="h-4 w-4 text-accent group-hover:scale-125 transition-transform animate-pulse" /> Neural Feed: Synchronized
         </div>
      </div>
    </div>
  );
}
