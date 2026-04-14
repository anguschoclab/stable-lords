import React, { useMemo } from "react";
import { useGameStore } from "@/state/useGameStore";
import type { Warrior } from "@/types/warrior.types";
import { STYLE_DISPLAY_NAMES, FightingStyle } from "@/types/shared.types";
import { MOOD_DESCRIPTIONS, MOOD_ICONS, getMoodModifiers, type CrowdMood } from "@/engine/crowdMood";
import { Badge } from "@/components/ui/badge";
import { WarriorNameTag } from "@/components/ui/WarriorBadges";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Trophy, Swords, Flame, Star, Skull, Zap, Eye,
  TrendingUp, Activity, Target, Shield, Info, BarChart3
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Surface } from "@/components/ui/Surface";
import { PageHeader } from "@/components/ui/PageHeader";

// Unified Widgets
import { MedicalAuditWidget } from "@/components/dashboard/MedicalAuditWidget";
import { IntelligenceHubWidget } from "@/components/dashboard/IntelligenceHubWidget";
import { NextBoutWidget } from "@/components/widgets/NextBoutWidget";
import { MetaDriftWidget } from "@/components/widgets/MetaDriftWidget";
import { WeatherWidget } from "@/components/widgets/WeatherWidget";

// ─── Crowd Mood Meter ──────────────────────────────────────────────────────

function CrowdMoodWidget() {
  const { crowdMood } = useGameStore();
  const mood = crowdMood as CrowdMood;
  const mods = getMoodModifiers(mood);

  return (
    <Surface variant="glass" className="h-full flex flex-col p-5 border-l-4 border-l-accent/50 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-accent" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Crowd_Temperament</span>
        </div>
        <Badge variant="outline" className="border-accent/40 bg-accent/5 text-accent text-[9px] font-black tracking-widest">{mood.toUpperCase()}</Badge>
      </div>

      <div className="flex items-center justify-between mb-4">
         <span className="text-4xl drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{MOOD_ICONS[mood]}</span>
         <div className="text-right">
           <div className="text-[8px] text-muted-foreground uppercase font-black tracking-widest mb-1">Impact_Matrix</div>
           <p className="text-[10px] text-muted-foreground italic leading-tight max-w-[140px] border-r-2 border-accent/20 pr-3">
            {MOOD_DESCRIPTIONS[mood]}
           </p>
         </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="rounded-md border border-white/5 p-2 bg-white/[0.02] cursor-help transition-all hover:bg-white/[0.05] hover:border-white/10">
              <div className={cn("text-lg font-display font-black tracking-tighter", mods.fameMultiplier > 1 ? "text-primary" : "text-muted-foreground")}>
                ×{mods.fameMultiplier.toFixed(1)}
              </div>
              <div className="text-[8px] text-muted-foreground uppercase font-black tracking-widest">FAME_MULT</div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="text-[10px] uppercase font-black tracking-widest">Multiplies all fame gains from this week's bouts.</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="rounded-md border border-white/5 p-2 bg-white/[0.02] cursor-help transition-all hover:bg-white/[0.05] hover:border-white/10">
              <div className={cn("text-lg font-display font-black tracking-tighter", mods.killChanceBonus > 0 ? "text-destructive" : "text-muted-foreground")}>
                {mods.killChanceBonus > 0 ? "+" : ""}{(mods.killChanceBonus * 100).toFixed(0)}%
              </div>
              <div className="text-[8px] text-muted-foreground uppercase font-black tracking-widest">LETHALITY</div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="text-[10px] uppercase font-black tracking-widest">Probability bonus added to all fatal blow checks.</TooltipContent>
        </Tooltip>
      </div>
    </Surface>
  );
}

// ─── Arena Leaderboard ────────────────────────────────────────────────────

function ArenaLeaderboard() {
  const { roster, rivals, player } = useGameStore();

  const allWarriors = useMemo(() => {
    type Entry = { warrior: Warrior; stableName: string; isPlayer: boolean };
    const top10: Entry[] = [];

    const insert = (entry: Entry) => {
      const fame = entry.warrior.fame;
      if (top10.length === 10 && fame <= top10[9].warrior.fame) {
          return;
      }

      let i = top10.length - 1;
      while (i >= 0 && top10[i].warrior.fame < fame) {
        i--;
      }

      top10.splice(i + 1, 0, entry);
      if (top10.length > 10) {
        top10.pop();
      }
    };

    const playerStable = player.stableName;
    for (let i = 0; i < roster.length; i++) {
      const w = roster[i];
      if (w.status === "Active") {
         insert({ warrior: w, stableName: playerStable, isPlayer: true });
      }
    }

    if (rivals) {
        for (let i = 0; i < rivals.length; i++) {
            const r = rivals[i];
            const rivalStable = r.owner.stableName;
            for (let j = 0; j < r.roster.length; j++) {
                const w = r.roster[j];
                if (w.status === "Active") {
                    insert({ warrior: w, stableName: rivalStable, isPlayer: false });
                }
            }
        }
    }

    return top10;
  }, [roster, rivals, player.stableName]);

  return (
    <Surface variant="glass" className="overflow-hidden p-0 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
      <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-arena-gold" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Global_Power_Rankings</span>
        </div>
        <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-2">
          <Activity className="h-3 w-3 text-primary" /> LIVE_ARENA_FEED
        </div>
      </div>
      <Table>
        <TableHeader className="bg-white/[0.03]">
          <TableRow className="h-10 hover:bg-transparent border-white/5">
            <TableHead className="w-12 pl-6 text-[9px] font-black uppercase tracking-widest">RANK</TableHead>
            <TableHead className="text-[9px] font-black uppercase tracking-widest">WARRIOR</TableHead>
            <TableHead className="text-[9px] font-black uppercase tracking-widest">STABLE</TableHead>
            <TableHead className="text-center text-[9px] font-black uppercase tracking-widest">W_L_K</TableHead>
            <TableHead className="pr-6 text-right text-[9px] font-black uppercase tracking-widest">FAME</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allWarriors.map((entry, i) => {
            const w = entry.warrior;
            return (
              <TableRow key={w.id} className={cn("h-12 border-white/5 transition-colors", entry.isPlayer ? "bg-primary/[0.03] border-l-2 border-l-primary" : "hover:bg-white/[0.02]")}>
                <TableCell className="pl-6 font-mono text-[10px] font-black text-muted-foreground">
                  {String(i + 1).padStart(2, '0')}
                </TableCell>
                <TableCell>
                  <WarriorNameTag id={w.id} name={w.name} isChampion={w.champion} />
                </TableCell>
                <TableCell className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 italic">
                  {entry.stableName}
                </TableCell>
                <TableCell className="text-center font-mono text-[10px]">
                  <span className="text-primary font-bold">{w.career.wins}</span>
                  <span className="mx-1 opacity-20">/</span>
                  <span className="text-destructive font-bold">{w.career.losses}</span>
                  <span className="mx-1 opacity-20">/</span>
                  <span className="text-arena-blood font-black">{w.career.kills}</span>
                </TableCell>
                <TableCell className="pr-6 text-right">
                  <span className="font-display font-black text-arena-fame text-lg tracking-tighter">{w.fame}</span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Surface>
  );
}

// ─── Main Hub Page ────────────────────────────────────────────────────────────

export default function ArenaHub() {
  const { roster, player } = useGameStore();

  const lifetimeKills = useMemo(() => roster.reduce((s,w)=>s+(w.career?.kills || 0),0), [roster]);

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-20">
      <PageHeader 
        title="Arena Command Hub"
        subtitle="VIRTUAL_COLOSSEUM // SPECTACLE_ENGINE // WORLD_STATE"
        icon={Swords}
        actions={
          <div className="flex gap-3">
             <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black uppercase tracking-widest text-[9px] px-3 py-1">
               {roster.filter(w=>w.status==="Active").length}_UNITS_ACTIVE
             </Badge>
             <Badge variant="outline" className="bg-arena-gold/5 text-arena-gold border-arena-gold/20 font-black uppercase tracking-widest text-[9px] px-3 py-1">
               PREMIUM_ACCESS
             </Badge>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Primary Intel Channel */}
        <div className="lg:col-span-8 space-y-8">
           <IntelligenceHubWidget />
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <NextBoutWidget />
              <MedicalAuditWidget />
           </div>
        </div>

        {/* Tactical Feed Side Pane */}
        <div className="lg:col-span-4 space-y-8">
           <CrowdMoodWidget />
           <WeatherWidget />
           <MetaDriftWidget />
           
           <Surface variant="glass" className="p-6 space-y-6 bg-gradient-to-br from-white/[0.01] to-white/[0.03]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Arena_Analytics</span>
                </div>
                <Activity className="h-3 w-3 text-primary animate-pulse" />
              </div>
              
              <div className="space-y-4">
                 <div className="flex justify-between items-center group">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-white/80 transition-colors">Stable_Renown</span>
                    <span className="font-display font-black text-xl text-arena-fame tracking-tighter">{player.renown}</span>
                 </div>
                 <div className="flex justify-between items-center group">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-white/80 transition-colors">Lifetime_Kills</span>
                    <span className="font-display font-black text-xl text-destructive tracking-tighter">{lifetimeKills}</span>
                 </div>
                 <div className="flex justify-between items-center group">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-white/80 transition-colors">Combat_Yield</span>
                    <span className="font-display font-black text-xl text-primary tracking-tighter">72%</span>
                 </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <p className="text-[9px] text-muted-foreground/60 leading-relaxed uppercase tracking-wider font-mono">
                  All metrics updated in real-time. Combat performance influences world-state drift.
                </p>
              </div>
           </Surface>
        </div>
      </div>

      {/* Global Rankings Channel */}
      <ArenaLeaderboard />

      {/* Immersive Operational Strip */}
      <div className="py-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-30 px-6 border-t border-white/5">
         <div className="flex items-center gap-2.5 text-[9px] font-black uppercase tracking-[0.3em] whitespace-nowrap">
            <Skull className="h-3.5 w-3.5 text-destructive" /> Blood_Shed_Protocols: V1.4
         </div>
         <div className="flex items-center gap-2.5 text-[9px] font-black uppercase tracking-[0.3em] whitespace-nowrap">
            <TrendingUp className="h-3.5 w-3.5 text-primary" /> Market_Drift: Synchronized
         </div>
         <div className="flex items-center gap-2.5 text-[9px] font-black uppercase tracking-[0.3em] whitespace-nowrap">
            <Star className="h-3.5 w-3.5 text-arena-gold" /> Fame_Coefficient_Active
         </div>
         <div className="flex items-center gap-2.5 text-[9px] font-black uppercase tracking-[0.3em] whitespace-nowrap">
            <Shield className="h-3.5 w-3.5 text-accent" /> Integrity_Hash_Verified
         </div>
      </div>
    </div>
  );
}
