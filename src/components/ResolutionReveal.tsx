import React, { useState } from "react";
import { useGameStore } from "@/state/useGameStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import BoutViewer from "./BoutViewer";
import { Newspaper, Skull, Activity, Swords, ChevronRight } from "lucide-react";

type RevealStep = "gazette" | "injuries" | "bouts";

export default function ResolutionReveal() {
  const { state, setState } = useGameStore();
  const [step, setStep] = useState<RevealStep>("gazette");

  const latestFight = state.arenaHistory?.[state.arenaHistory.length - 1];
  if (!latestFight?.pendingResolutionData) return null;

  const data = latestFight.pendingResolutionData;

  const doClearResolution = () => {
    // Clear resolution data
    const updated = { ...state, arenaHistory: state.arenaHistory.map((f, i) =>
      i === state.arenaHistory.length - 1 ? { ...f, pendingResolutionData: undefined } : f
    )};
    setState(updated);
  };
  const hasInjuriesOrDeaths = data.injuries.length > 0 || data.deaths.length > 0;

  const handleNext = () => {
    if (step === "gazette") {
      setStep(hasInjuriesOrDeaths ? "injuries" : "bouts");
    } else if (step === "injuries") {
      setStep("bouts");
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
                      {data.gazette.map((article: any, i: number) => (
                        <div key={i} className="space-y-2 border-l-2 border-primary/50 pl-4">
                          <h4 className="text-lg font-bold font-serif leading-tight">{article.headline}</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-line">{article.body}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {article.tags?.map((t: string) => (
                              <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                            ))}
                          </div>
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
                exit={{ opacity: 0, y: -20 }}
                className="h-full p-6 flex flex-col"
              >
                <div className="flex items-center gap-2 mb-6 shrink-0">
                  <Swords className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-semibold">Combat Results</h3>
                </div>
                <ScrollArea className="flex-1 pr-4">
                  {data.bouts.length > 0 ? (
                    <div className="space-y-6">
                      {data.bouts.map((r: any, i: number) => (
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
          </AnimatePresence>
        </CardContent>

        <div className="p-4 bg-secondary/20 border-t shrink-0 flex justify-end">
          <Button onClick={handleNext} className="gap-2" size="lg">
            {step === "bouts" ? "Acknowledge & Begin Planning" : "Next Report"}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
