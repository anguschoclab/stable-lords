/**
 * Stable Lords — Graveyard & Retired Warriors
 */
import React from "react";
import { useGameStore } from "@/state/useGameStore";
import { STYLE_DISPLAY_NAMES, FightingStyle, type Warrior } from "@/types/game";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skull, Armchair, Zap, Crosshair, Swords, Trophy, Shield, Activity } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Surface } from "@/components/ui/Surface";
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
      <PageHeader
        icon={Skull}
        title="The Graveyard"
        subtitle="IMPERIAL · FALLEN · MEMORIAL ARCHIVE"
        actions={
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">WORLD_FALLEN</span>
              <span className="text-2xl font-mono font-black text-destructive">{worldFallen.length}</span>
            </div>
            <Separator orientation="vertical" className="h-10 bg-border/20" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">STABLE_MEMORIAL</span>
              <span className="text-2xl font-mono font-black text-primary">{myFallen.length}</span>
            </div>
          </div>
        }
      />

      <Tabs defaultValue="memorial" className="w-full">
        <TabsList className="bg-secondary/20 p-1 rounded-none h-12">
          <TabsTrigger value="memorial" className="flex-1 rounded-none gap-2 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
            <Zap className="h-3.5 w-3.5" /> Private Memorial
          </TabsTrigger>
          <TabsTrigger value="world" className="flex-1 rounded-none gap-2 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-destructive data-[state=active]:text-white transition-all">
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

function FallenGrid({ warriors, season, emptyTitle, emptyDesc }: { warriors: Warrior[], season: string, emptyTitle: string, emptyDesc: string }) {
  if (warriors.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Surface variant="glass" className="text-center py-32 border-2 border-border/20 border-dashed flex flex-col items-center">
          <Shield className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
          <h3 className="text-xl font-display font-black uppercase tracking-tight">{emptyTitle}</h3>
          <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">{emptyDesc}</p>
        </Surface>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {warriors.map((w, idx) => (
        <motion.div 
          key={w.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
        >
          <Surface 
            variant="glass" 
            padding="none" 
            className="group relative border-border/40 overflow-hidden hover:border-destructive/40 transition-all duration-500 shadow-2xl h-full flex flex-col"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-destructive via-destructive/40 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

            <div className="p-8 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-8">
                <div className="flex flex-col">
                  <WarriorLink name={w.name} id={w.id} className="font-display font-black text-2xl uppercase tracking-tighter group-hover:text-destructive transition-colors" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/50 mt-1">{STYLE_DISPLAY_NAMES[w.style as FightingStyle]}</span>
                </div>
                <div className="flex flex-col items-end gap-2">
                   <Badge variant="outline" className="text-[9px] font-black tracking-widest text-destructive bg-destructive/10 border-destructive/30 uppercase py-1 px-3">
                      TERMINATED
                   </Badge>
                   {w.career?.medals?.gold > 0 && <Badge className="bg-arena-gold text-black text-[8px] font-black tracking-widest px-2">CHAMPION</Badge>}
                </div>
              </div>

              <Surface variant="blood" className="p-5 mb-8 relative border-destructive/10">
                <Skull className="absolute top-3 right-3 w-12 h-12 text-destructive/5 pointer-events-none" />
                <p className="text-xs text-foreground/90 italic font-medium leading-relaxed mb-4 pr-8">
                  "{w.deathEvent?.deathSummary || w.causeOfDeath || w.deathCause || 'Fatal injury sustained during tactical engagement.'}"
                </p>
                <div className="space-y-3 border-t border-destructive/10 pt-4 mt-auto">
                   <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                      <Crosshair className="w-3.5 h-3.5 text-destructive" />
                      {w.killedBy ? (
                        <>FATAL_STRIKE_BY: <span className="text-foreground">{w.killedBy}</span></>
                      ) : (
                        <>KILLED_IN_ARENA_COMBAT</>
                      )}
                   </div>
                   <div className="flex items-center justify-between text-[10px] font-mono font-black text-muted-foreground/30">
                      <span>SEASONAL_WK_{w.deathWeek || '??'} · {season?.toUpperCase()}</span>
                      <span className="flex items-center gap-1.5"><Activity className="h-3 w-3" /> CORPSE_RETRIEVED_PROTOCOL</span>
                   </div>
                </div>
              </Surface>

              <div className="grid grid-cols-2 gap-4 mt-auto">
                <div className="bg-white/[0.02] p-4 border border-white/5 text-center">
                   <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 block mb-1">SERVICE_RECORD</span>
                   <span className="text-sm font-mono font-black">{(w.career?.wins || 0)}W-{(w.career?.losses || 0)}L-{(w.career?.kills || 0)}K</span>
                </div>
                <div className="bg-white/[0.02] p-4 border border-white/5 text-center">
                   <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 block mb-1">FINAL_FAME</span>
                   <span className="text-sm font-mono font-black text-arena-gold">{w.fame}G</span>
                </div>
              </div>

              {w.career?.medals && (w.career.medals.gold > 0 || w.career.medals.silver > 0 || w.career.medals.bronze > 0) && (
                <div className="flex flex-wrap gap-2 pt-6 mt-6 border-t border-white/5">
                  {w.career.medals.gold > 0 && <span className="text-[9px] uppercase font-black tracking-widest text-arena-gold bg-arena-gold/10 px-2.5 py-1.5 border border-arena-gold/20">🥇 GOLD_VALOR</span>}
                  {w.career.medals.silver > 0 && <span className="text-[9px] uppercase font-black tracking-widest text-muted-foreground bg-white/5 px-2.5 py-1.5 border border-white/10">🥈 SILVER_TOKEN</span>}
                  {w.career.medals.bronze > 0 && <span className="text-[9px] uppercase font-black tracking-widest text-orange-500 bg-orange-500/10 px-2.5 py-1.5 border border-orange-500/20">🥉 BRONZE_ELITE</span>}
                </div>
              )}
            </div>
          </Surface>
        </motion.div>
      ))}
    </div>
  );
}

const Separator = ({ className, orientation = "horizontal" }: { className?: string; orientation?: "horizontal" | "vertical" }) => (
  <div className={cn("bg-border shrink-0", orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]", className)} />
);
