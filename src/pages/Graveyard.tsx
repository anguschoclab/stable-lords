/**
 * Stable Lords — Graveyard & Retired Warriors
 */
import React from "react";
import { useGameStore } from "@/state/useGameStore";
import { STYLE_DISPLAY_NAMES } from "@/types/game";
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
  const { state } = useGameStore();

  const deadWarriors = state.graveyard.filter(w => w.stableId === state.player.id || !w.stableId);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-border/20 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-[10px] font-black tracking-widest uppercase border-destructive/20 bg-destructive/5 text-destructive">
               MEMORIAL_DATABASE_ACTIVE
            </Badge>
          </div>
          <h1 className="text-4xl font-display font-black tracking-tighter uppercase flex items-center gap-4">
            <Skull className="w-10 h-10 text-destructive shadow-[0_0_15px_rgba(var(--destructive-rgb),0.5)]" />
            Hall of Warriors
          </h1>
          <p className="text-muted-foreground mt-2 text-sm font-bold uppercase tracking-widest opacity-60">"Blood paid. Debts settled. They fight no more."</p>
        </div>
        <div className="flex items-center gap-4 text-right">
           <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">TOTAL_FALLEN</span>
              <span className="text-2xl font-mono font-black text-destructive">{deadWarriors.length}</span>
           </div>
           <Separator orientation="vertical" className="h-10 bg-border/20" />
           <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">TOTAL_RETIRED</span>
              <span className="text-2xl font-mono font-black text-primary">{state.retired.length}</span>
           </div>
        </div>
      </div>

      <Tabs defaultValue="graveyard" className="w-full">
        <TabsList className="bg-secondary/20 p-1 rounded-xl h-12">
          <TabsTrigger value="graveyard" className="flex-1 rounded-lg gap-2 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-destructive data-[state=active]:text-white">
            <Skull className="h-3.5 w-3.5" /> Fallen Assets
          </TabsTrigger>
          <TabsTrigger value="retired" className="flex-1 rounded-lg gap-2 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
            <Armchair className="h-3.5 w-3.5" /> Honoured Veterans
          </TabsTrigger>
        </TabsList>

        <TabsContent value="graveyard" className="mt-8">
          <AnimatePresence mode="wait">
            {deadWarriors.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-32 bg-glass-card rounded-2xl border-2 border-border/20 border-dashed"
              >
                <Shield className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
                <h3 className="text-xl font-display font-black uppercase tracking-tight">The Soil is Unbroken</h3>
                <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">No warriors from your stable have fallen in the arena... yet. Stay vigilant, Commander.</p>
                <Link to="/run-round">
                  <Button variant="outline" className="gap-2 mt-8 px-8 py-6 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-primary hover:text-white transition-all">
                    <Zap className="h-4 w-4" /> Enter the Arena
                  </Button>
                </Link>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {deadWarriors.map((w, idx) => (
                  <motion.div 
                    key={w.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group relative bg-glass-card border border-border/40 rounded-2xl overflow-hidden hover:border-destructive/40 transition-all duration-500 shadow-xl"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-destructive via-destructive/40 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex flex-col">
                          <WarriorLink name={w.name} id={w.id} className="font-display font-black text-xl uppercase tracking-tighter group-hover:text-destructive transition-colors" />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{STYLE_DISPLAY_NAMES[w.style]}</span>
                        </div>
                        <Badge variant="outline" className="text-[9px] font-black tracking-widest text-destructive bg-destructive/10 border-destructive/30 uppercase py-1 px-2">
                           TERMINATED
                        </Badge>
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
                              <span>WK_{w.deathWeek || '??'} · {state.season?.toUpperCase()}</span>
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
                        {w.deathEvent?.memorialTags?.map((tag: string, i: number) => (
                          <span key={i} className="text-[9px] uppercase font-black tracking-widest text-muted-foreground/60 bg-secondary/40 px-2 py-0.5 rounded border border-border/10">
                            {tag}
                          </span>
                        ))}
                        {w.flair?.map((f: string, i: number) => (
                          <span key={`flair-${i}`} className="text-[9px] uppercase font-black tracking-widest text-arena-gold bg-arena-gold/5 px-2 py-0.5 rounded border border-arena-gold/20">
                            {f}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="retired" className="mt-8">
          <AnimatePresence mode="wait">
            {state.retired.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-32 bg-glass-card rounded-2xl border-2 border-border/20 border-dashed"
              >
                <Armchair className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
                <h3 className="text-xl font-display font-black uppercase tracking-tight">No Honored Veterans</h3>
                <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">Warriors who survive their service can be honourably discharged from their detail profile.</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {state.retired.map((w, idx) => (
                  <motion.div 
                    key={w.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="bg-glass-card border border-border/40 rounded-2xl overflow-hidden hover:border-primary/40 transition-all duration-500 shadow-xl">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary/40 to-transparent opacity-60 transition-opacity" />
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <WarriorLink name={w.name} id={w.id} className="font-display font-black text-xl uppercase tracking-tighter" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 block mt-1">
                              {STYLE_DISPLAY_NAMES[w.style]}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-[9px] font-black tracking-widest text-primary bg-primary/10 border-primary/30 uppercase py-1 px-3">
                             RETIRED_WK_{w.retiredWeek}
                          </Badge>
                        </div>
                        <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 mb-2">
                           <div className="flex justify-between items-center text-xs font-mono font-bold text-foreground">
                              <span>LEGACY_RECORD:</span>
                              <span>{w.career.wins}W-{w.career.losses}L-{w.career.kills}K</span>
                           </div>
                           {w.titles && w.titles.length > 0 && (
                             <div className="mt-3 pt-3 border-t border-primary/10 space-y-1.5">
                                {w.titles.map((t, ti) => (
                                  <div key={ti} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-arena-gold">
                                     <Trophy className="h-3 w-3" /> {t}
                                  </div>
                                ))}
                             </div>
                           )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </div>
  );
}

const Separator = ({ className, orientation = "horizontal" }: { className?: string; orientation?: "horizontal" | "vertical" }) => (
  <div className={cn("bg-border shrink-0", orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]", className)} />
);
