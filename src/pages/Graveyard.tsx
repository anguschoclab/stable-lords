/**
 * Stable Lords — Graveyard & Retired Warriors
 */
import React from "react";
import { useGameStore } from "@/state/useGameStore";
import { STYLE_DISPLAY_NAMES, FightingStyle } from "@/types/game";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skull, Armchair, Zap, Crosshair, Swords, Trophy, Shield, Activity } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { WarriorLink } from "@/components/EntityLink";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function Graveyard() {
  const { graveyard, player, season } = useGameStore();

  const myFallen = graveyard.filter(w => w.stableId === player.id);
  const worldFallen = graveyard;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-border/20 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-[10px] font-black tracking-widest uppercase border-destructive/20 bg-destructive/5 text-destructive">
               ARCHIVAL_RECORDS_ONLINE
            </Badge>
          </div>
          <h1 className="text-4xl font-display font-black tracking-tighter uppercase flex items-center gap-4">
            <Skull className="w-10 h-10 text-destructive shadow-[0_0_15px_rgba(var(--destructive-rgb),0.5)]" />
            The Graveyard
          </h1>
          <p className="text-muted-foreground mt-2 text-sm font-bold uppercase tracking-widest opacity-60">"In the end, we all become dust on the arena floor."</p>
        </div>
        <div className="flex items-center gap-4 text-right">
           <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">WORLD_FALLEN</span>
              <span className="text-2xl font-mono font-black text-destructive">{worldFallen.length}</span>
           </div>
           <Separator orientation="vertical" className="h-10 bg-border/20" />
           <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">STABLE_MEMORIAL</span>
              <span className="text-2xl font-mono font-black text-primary">{myFallen.length}</span>
           </div>
        </div>
      </div>

      <Tabs defaultValue="memorial" className="w-full">
        <TabsList className="bg-secondary/20 p-1 rounded-xl h-12">
          <TabsTrigger value="memorial" className="flex-1 rounded-lg gap-2 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
            <Zap className="h-3.5 w-3.5" /> Private Memorial
          </TabsTrigger>
          <TabsTrigger value="world" className="flex-1 rounded-lg gap-2 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-destructive data-[state=active]:text-white transition-all">
            <Skull className="h-3.5 w-3.5" /> World Cemetery
          </TabsTrigger>
        </TabsList>
 
        <TabsContent value="memorial" className="mt-8">
           <FallenGrid warriors={myFallen} season={season} emptyTitle="The Soil is Unbroken" emptyDesc="None of your warriors have fallen... yet." />
        </TabsContent>

        <TabsContent value="world" className="mt-8">
           <FallenGrid warriors={worldFallen} season={season} emptyTitle="Sands of Peace" emptyDesc="No blood has been spilled in this realm." />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FallenGrid({ warriors, season, emptyTitle, emptyDesc }: { warriors: any[], season: string, emptyTitle: string, emptyDesc: string }) {
  if (warriors.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-32 bg-glass-card rounded-2xl border-2 border-border/20 border-dashed"
      >
        <Shield className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
        <h3 className="text-xl font-display font-black uppercase tracking-tight">{emptyTitle}</h3>
        <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">{emptyDesc}</p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {warriors.map((w, idx) => (
        <motion.div 
          key={w.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="group relative bg-glass-card border border-border/40 rounded-2xl overflow-hidden hover:border-destructive/40 transition-all duration-500 shadow-xl"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-destructive via-destructive/40 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex flex-col">
                <WarriorLink name={w.name} id={w.id} className="font-display font-black text-xl uppercase tracking-tighter group-hover:text-destructive transition-colors" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{STYLE_DISPLAY_NAMES[w.style as FightingStyle]}</span>
              </div>
              <div className="flex flex-col items-end gap-1">
                 <Badge variant="outline" className="text-[9px] font-black tracking-widest text-destructive bg-destructive/10 border-destructive/30 uppercase py-1 px-2">
                    TERMINATED
                 </Badge>
                 {w.career?.medals?.gold && w.career.medals.gold > 0 ? <Badge className="bg-arena-gold text-black text-[8px] font-black mt-1">CHAMPION</Badge> : null}
              </div>
            </div>

            <div className="bg-destructive/5 rounded-xl p-4 mb-6 border border-destructive/10 relative">
              <Skull className="absolute top-2 right-2 w-10 h-10 text-destructive/5 pointer-events-none" />
              <p className="text-xs text-foreground/80 italic font-medium leading-relaxed mb-1 pr-6">
                "{w.deathEvent?.deathSummary || w.causeOfDeath || w.deathCause || 'Fatal injury sustained during tactical engagement.'}"
              </p>
              <div className="mt-4 space-y-2 border-t border-destructive/10 pt-4">
                 <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    <Crosshair className="w-3.5 h-3.5 text-destructive" />
                    {w.killedBy ? (
                      <>FATAL_STRIKE_BY: <span className="text-foreground">{w.killedBy}</span></>
                    ) : (
                      <>KILLED_IN_ARENA_COMBAT</>
                    )}
                 </div>
                 <div className="flex items-center justify-between text-[10px] font-mono font-black text-muted-foreground/40">
                    <span>WK_{w.deathWeek || '??'} · {season?.toUpperCase()}</span>
                    <span className="flex items-center gap-1"><Activity className="h-3 w-3" /> CORPSE_RETRIEVED</span>
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-secondary/20 p-3 rounded-xl border border-border/20 text-center">
                 <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 block mb-1">SERVICE_RECORD</span>
                 <span className="text-sm font-mono font-bold">{(w.career?.wins || 0)}W-{(w.career?.losses || 0)}L-{(w.career?.kills || 0)}K</span>
              </div>
              <div className="bg-secondary/20 p-3 rounded-xl border border-border/20 text-center">
                 <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 block mb-1">FINAL_FAME</span>
                 <span className="text-sm font-mono font-bold text-arena-gold">{w.fame}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-4 border-t border-border/20">
              {w.career?.medals?.gold > 0 && <span className="text-[9px] uppercase font-black tracking-widest text-arena-gold bg-arena-gold/10 px-2 py-1 rounded">🥇 GOLD_MEDALIST</span>}
              {w.career?.medals?.silver > 0 && <span className="text-[9px] uppercase font-black tracking-widest text-muted-foreground bg-muted/10 px-2 py-1 rounded">🥈 SILVER_TOKEN</span>}
              {w.career?.medals?.bronze > 0 && <span className="text-[9px] uppercase font-black tracking-widest text-orange-500 bg-orange-500/10 px-2 py-1 rounded">🥉 BRONZE_ELITE</span>}
              {w.flair?.map((f: string, i: number) => (
                <span key={`flair-${i}`} className="text-[9px] uppercase font-black tracking-widest text-arena-gold bg-arena-gold/5 px-2 py-1 rounded border border-arena-gold/20">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

const Separator = ({ className, orientation = "horizontal" }: { className?: string; orientation?: "horizontal" | "vertical" }) => (
  <div className={cn("bg-border shrink-0", orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]", className)} />
);
