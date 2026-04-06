import React, { useState } from "react";
import { useGameStore } from "@/state/useGameStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import BoutViewer from "./BoutViewer";
import { Newspaper, Skull, Activity, Swords, ChevronRight, BarChart3, BrainCircuit } from "lucide-react";
import { audioManager } from "@/lib/AudioManager";
import type { NewsletterItem } from "@/types/shared.types";
import type { Warrior } from "@/types/warrior.types";
import type { GazetteStory } from "@/types/state.types";
import type { BoutResult } from "@/engine/boutProcessor";

type RevealStep = "gazette" | "injuries" | "bouts" | "math" | "memorial";

export default function ResolutionReveal() {
  const { state, setState } = useGameStore();
  const [step, setStep] = useState<RevealStep>("gazette");

  const latestFight = state.arenaHistory?.[state.arenaHistory.length - 1];
  const data = latestFight?.pendingResolutionData;

  const deadWarriors = React.useMemo(() => {
    if (!data) return [];
    return data.deaths.map((name: string) => state.graveyard.find(w => w.name === name)).filter(Boolean);
  }, [data, state.graveyard]);

  if (!data) return null;

  const doClearResolution = () => {
    // Clear resolution data
    const updated = { ...state, arenaHistory: state.arenaHistory.map((f, i) =>
      i === state.arenaHistory.length - 1 ? { ...f, pendingResolutionData: undefined } : f
    )};
    setState(updated);
  };
  const hasInjuriesOrDeaths = data.injuries.length > 0 || data.deaths.length > 0;

  const handleNext = () => {
    audioManager.play("ui_click");
    if (step === "gazette") {
      setStep(hasInjuriesOrDeaths ? "injuries" : "bouts");
    } else if (step === "injuries") {
      setStep("bouts");
    } else if (step === "bouts") {
      setStep("math");
    } else if (step === "math" && data.deaths.length > 0) {
      setStep("memorial");
    } else {
      doClearResolution();
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border-border/50 overflow-hidden">
        <CardHeader className="bg-secondary/30 pb-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-display font-bold">Cycle Resolution</CardTitle>
              <CardDescription>Week {state.week - 1} Results</CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant={step === "gazette" ? "default" : "secondary"}>1. The Gazette</Badge>
              <Badge variant={step === "injuries" ? "default" : "secondary"} className={!hasInjuriesOrDeaths ? "opacity-30" : ""}>
                2. Medical Report
              </Badge>
              <Badge variant={step === "bouts" ? "default" : "secondary"}>3. Combat Logs</Badge>
              <Badge variant={step === "math" ? "default" : "secondary"}>4. Simulation Math</Badge>
              {data.deaths.length > 0 && (
                <Badge variant={step === "memorial" ? "destructive" : "secondary"}>
                  5. The Graveyard
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0 relative">
          <AnimatePresence mode="wait">
            {step === "gazette" && (
              <motion.div
                key="gazette"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full p-6"
              >
                <div className="flex items-center gap-2 mb-6">
                  <Newspaper className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-semibold">The Weekly Gazette</h3>
                </div>
                <ScrollArea className="h-[calc(100%-4rem)] pr-4">
                  {data.gazette.length > 0 ? (
                    <div className="space-y-6">
                      {data.gazette.map((item: NewsletterItem, i: number) => (
                        <div key={i} className="space-y-2 border-l-2 border-primary/50 pl-4">
                          <h4 className="text-lg font-bold font-serif leading-tight">{item.title}</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {item.items.map((line: string, li: number) => (
                              <li key={li} className="text-sm text-muted-foreground">{line}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground italic">
                      A quiet week in the arena. No major headlines.
                    </div>
                  )}
                </ScrollArea>
              </motion.div>
            )}

            {step === "injuries" && (
              <motion.div
                key="injuries"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full p-6 flex flex-col gap-6"
              >
                <div className="flex items-center gap-2">
                  <Activity className="h-6 w-6 text-amber-500" />
                  <h3 className="text-xl font-semibold">Medical & Mortality Report</h3>
                </div>

                {data.deaths.length > 0 && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 text-destructive font-bold">
                      <Skull className="h-5 w-5" />
                      <h4>Fallen Warriors</h4>
                    </div>
                    <ul className="list-disc list-inside text-sm text-destructive-foreground">
                      {data.deaths.map((name: string, i: number) => (
                        <li key={i}>{name}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {data.injuries.length > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 text-amber-500 font-bold">
                      <Activity className="h-5 w-5" />
                      <h4>Injured Roster</h4>
                    </div>
                    <ul className="list-disc list-inside text-sm text-amber-600 dark:text-amber-400">
                      {data.injuries.map((name: string, i: number) => (
                        <li key={i}>{name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}

            {step === "bouts" && (
              <motion.div
                key="bouts"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full p-6 flex flex-col"
              >
                <div className="flex items-center gap-2 mb-6 shrink-0">
                  <Swords className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-semibold">Combat Results</h3>
                </div>
                <ScrollArea className="flex-1 pr-4">
                  {data.bouts.length > 0 ? (
                    <div className="space-y-6">
                      {data.bouts.map((r: BoutResult, i: number) => (
                        <div key={i} className="space-y-2">
                          {r.isRivalry && (
                            <div className="text-xs text-destructive font-semibold uppercase tracking-wider">
                              Rivalry Bout
                            </div>
                          )}
                          <BoutViewer
                            nameA={r.a.name}
                            nameD={r.d.name}
                            styleA={r.a.style}
                            styleD={r.d.style}
                            log={r.outcome.log}
                            winner={r.outcome.winner}
                            by={r.outcome.by}
                            announcement={r.announcement}
                            isRivalry={r.isRivalry}
                          />
                          <Separator className="my-4" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground italic">
                      Your stable did not participate in any official bouts this week.
                    </div>
                  )}
                </ScrollArea>
              </motion.div>
            )}

            {step === "math" && (
              <motion.div
                key="math"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full p-6 space-y-6"
              >
                <div className="flex items-center gap-2">
                  <Activity className="h-6 w-6 text-indigo-500" />
                  <h3 className="text-xl font-semibold">Simulation Math & Metrics</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-secondary/10">
                    <CardHeader className="py-2 px-4">
                      <CardTitle className="text-sm font-medium">Weekly Treasury Delta</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-4">
                      <div className={`text-2xl font-mono font-bold ${state.lastSimulationReport?.treasuryChange && state.lastSimulationReport.treasuryChange >= 0 ? "text-green-500" : "text-amber-500"}`}>
                        {state.lastSimulationReport?.treasuryChange && state.lastSimulationReport.treasuryChange > 0 ? "+" : ""}{state.lastSimulationReport?.treasuryChange ?? 0} GC
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-secondary/10">
                    <CardHeader className="py-2 px-4">
                      <CardTitle className="text-sm font-medium">Training Outcomes</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-4">
                      <div className="text-2xl font-mono font-bold text-primary">
                        {state.lastSimulationReport?.trainingGains.length ?? 0} Improvements
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Granular Breakdown</h4>
                  <ScrollArea className="h-[200px] border rounded-md p-4 bg-muted/30">
                    <div className="space-y-4">
                      {state.lastSimulationReport?.trainingGains.map((g, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="font-medium">{g.warriorName}</span>
                          <div className="flex gap-2 font-mono">
                            <Badge variant="outline" className="text-green-500">+{g.gain} {g.attr}</Badge>
                          </div>
                        </div>
                      ))}
                      {state.lastSimulationReport?.agingEvents.map((e, i) => (
                        <div key={`age-${i}`} className="text-sm text-amber-500">
                          <span className="font-bold mr-2">!</span> {e}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </motion.div>
            )}

            {step === "memorial" && deadWarriors.length > 0 && (
              <motion.div
                key="memorial"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="h-full p-6 flex flex-col items-center justify-center bg-zinc-950 text-zinc-50 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(200,0,0,0.05)_0,transparent_100%)] mix-blend-screen" />
                <div className="z-10 flex flex-col items-center max-w-full">
                  <Skull className="h-16 w-16 mb-4 text-zinc-600 animate-pulse drop-shadow-[0_0_15px_rgba(200,0,0,0.3)]" />
                  <h2 className="text-3xl font-serif text-center mb-8 uppercase tracking-widest text-zinc-300">The Arena Remembers</h2>
                  <div className="flex gap-6 overflow-x-auto pb-4 max-w-[100%]">
                    {deadWarriors.map((w) => {
                      if (!w) return null;
                      return (
                        <div key={w.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg text-center min-w-72 shadow-2xl relative">
                          <h3 className="text-2xl font-display font-bold text-red-500 mb-1 drop-shadow-md">{w.name}</h3>
                          <p className="text-sm text-zinc-400 mb-4 italic leading-relaxed">{w.deathCause || "Fallen in combat."}</p>
                          <Separator className="bg-zinc-800 mb-4" />
                          <div className="grid grid-cols-2 gap-3 text-xs text-zinc-500 text-left">
                            <div className="bg-zinc-950 p-2 rounded">Age: <span className="text-zinc-300 font-mono inline-block ml-1">{w.age}</span></div>
                            <div className="bg-zinc-950 p-2 rounded">Fame: <span className="text-zinc-300 font-mono inline-block ml-1">{w.fame}</span></div>
                            <div className="bg-zinc-950 p-2 rounded">Wins: <span className="text-zinc-300 font-mono inline-block ml-1">{w.career?.wins || 0}</span></div>
                            <div className="bg-zinc-950 p-2 rounded">Kills: <span className="text-red-400 font-mono inline-block ml-1">{w.career?.kills || 0}</span></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>

        <div className="p-4 bg-secondary/20 border-t shrink-0 flex justify-end">
          <Button onClick={handleNext} className="gap-2" size="lg" variant={step === "memorial" ? "destructive" : "default"}>
            {step === "math" && data.deaths.length > 0 ? "Honor the Fallen" : (step === "math" || step === "memorial") ? "Acknowledge & Begin Planning" : "Next Report"}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
