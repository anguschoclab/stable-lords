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
import { Skull, Armchair, Zap, Crosshair, Swords, Trophy, Shield } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { WarriorLink } from "@/components/EntityLink";

export default function Graveyard() {
  const { state } = useGameStore();

  const deadWarriors = state.graveyard.filter(w => w.stableId === state.player.id || !w.stableId);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-end justify-between border-b border-neutral-800 pb-4">
        <div>
          <h1 className="text-3xl font-serif text-neutral-100 flex items-center gap-3">
            <Skull className="w-7 h-7 text-red-900" />
            Hall of Warriors
          </h1>
          <p className="text-neutral-400 mt-1 text-sm font-medium">"Blood paid. Debts settled. They fight no more."</p>
        </div>
      </div>

      <Tabs defaultValue="graveyard">
        <TabsList>
          <TabsTrigger value="graveyard" className="gap-1.5 font-bold tracking-wide uppercase text-xs">
            <Skull className="h-3.5 w-3.5" /> Fallen ({deadWarriors.length})
          </TabsTrigger>
          <TabsTrigger value="retired" className="gap-1.5 font-bold tracking-wide uppercase text-xs">
            <Armchair className="h-3.5 w-3.5" /> Retired ({state.retired.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="graveyard" className="mt-6">
          {deadWarriors.length === 0 ? (
            <div className="text-center py-24 bg-neutral-900/20 rounded-xl border border-neutral-800/50 border-dashed">
              <Shield className="w-12 h-12 text-neutral-800 mx-auto mb-4" />
              <h3 className="text-lg text-neutral-300 font-serif">The Soil is Unbroken</h3>
              <p className="text-neutral-500 text-sm mt-2">No blood from your stable currently waters the sands.</p>
              <Link to="/run-round">
                <Button variant="outline" size="sm" className="gap-2 mt-6">
                  <Zap className="h-4 w-4" /> Run a Round
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {deadWarriors.map((w) => (
                <div key={w.id} className="group relative bg-[#0a0a0a] border border-neutral-800 rounded-xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 hover:border-neutral-700 shadow-xl">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-900 via-red-950 to-[#0a0a0a]" />

                  <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col">
                        <WarriorLink name={w.name} id={w.id} className="font-serif text-xl text-neutral-200" />
                        <span className="text-xs text-neutral-500">{STYLE_DISPLAY_NAMES[w.style]}</span>
                      </div>
                      <span className="text-[10px] font-mono text-red-500 bg-red-950/30 border border-red-900/30 px-2 py-1 rounded">DECEASED</span>
                    </div>

                    <div className="bg-neutral-900/40 rounded-lg p-3.5 mb-5 border border-neutral-800/50">
                      <p className="text-sm text-neutral-300 italic font-serif leading-relaxed mb-2">
                        "{w.deathEvent?.deathSummary || w.causeOfDeath || w.deathCause || 'Fell in combat.'}"
                      </p>
                      <div className="mt-4 flex flex-col gap-2 text-xs text-neutral-500 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Crosshair className="w-3.5 h-3.5 text-red-900" />
                          {w.killedBy ? (
                            <>Slew by <span className="text-red-400/80">{w.killedBy}</span></>
                          ) : w.deathEvent?.killerId ? (
                            <>Slew by <WarriorLink name={w.deathEvent.killerId} className="text-red-400/80" /></>
                          ) : (
                            <>Killed in the Arena</>
                          )}
                        </span>
                        <div className="flex items-center justify-between">
                            <span className="bg-neutral-900 px-2 py-1 rounded">
                                {w.dateOfDeath || `Week ${w.deathWeek || '?'}`}
                            </span>
                            <span className="text-[10px] opacity-60">{state.season}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs mb-5">
                      <div className="flex items-center gap-2.5 text-neutral-400 bg-neutral-900/30 p-2.5 rounded border border-neutral-800/30">
                        <Swords className="w-4 h-4 text-neutral-600" />
                        <span className="font-medium">{(w.career?.wins || 0)}W-{(w.career?.losses || 0)}L-{(w.career?.kills || 0)}K</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-neutral-400 bg-neutral-900/30 p-2.5 rounded border border-neutral-800/30">
                        <Trophy className="w-4 h-4 text-amber-600/40" />
                        <span className="font-medium">Fame: {w.fame}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-4 border-t border-neutral-800/50">
                      {w.deathEvent?.memorialTags?.map((tag: string, i: number) => (
                        <span key={i} className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 bg-neutral-900 px-2 py-1 rounded border border-neutral-800">
                          {tag}
                        </span>
                      ))}
                      {w.flair?.map((f: string, i: number) => (
                        <span key={`flair-${i}`} className="text-[10px] uppercase font-bold tracking-widest text-amber-500/60 bg-neutral-900 px-2 py-1 rounded border border-neutral-800">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="retired" className="mt-6">
          {state.retired.length === 0 ? (
            <div className="text-center py-24 bg-neutral-900/20 rounded-xl border border-neutral-800/50 border-dashed">
              <Armchair className="w-12 h-12 text-neutral-800 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg text-neutral-300 font-serif">No Honored Veterans</h3>
              <p className="text-neutral-500 text-sm mt-2">Warriors can be retired from their detail page.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {state.retired.map((w) => (
                <Card key={w.id} className="bg-[#0a0a0a] border border-neutral-800 rounded-xl overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <WarriorLink name={w.name} id={w.id} className="font-serif text-xl text-neutral-200" />
                        <span className="text-xs text-neutral-500 block">
                          {STYLE_DISPLAY_NAMES[w.style]}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-xs bg-neutral-800 text-neutral-300 border-none">
                        Retired Wk {w.retiredWeek}
                      </Badge>
                    </div>
                    <div className="text-sm text-neutral-400 bg-neutral-900/30 p-3 rounded-lg border border-neutral-800/30">
                      {w.career.wins}W-{w.career.losses}L-{w.career.kills}K
                      {w.titles && w.titles.length > 0 && <span className="block mt-2 pt-2 border-t border-neutral-800/50">🏆 {w.titles.join(", ")}</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
