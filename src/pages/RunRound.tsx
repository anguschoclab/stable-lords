/**
 * Stable Lords — Run Round (Refactored)
 * Modularized for better maintainability and strict type safety.
 */
import React, { useState, useMemo, useCallback } from "react";
import { useGameStore } from "@/state/useGameStore";
import { advanceWeek } from "@/state/gameStore";
import { generateMatchCard } from "@/engine/matchmaking/bracketEngine";
import { isFightReady } from "@/engine/warriorStatus";
import { processWeekBouts, type BoutResult } from "@/engine/boutProcessor";
import { runAutosim, type AutosimResult, type WeekSummary } from "@/engine/autosim";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Swords, Zap, Skull, Shield, FastForward, Trophy, Heart } from "lucide-react";
import { toast } from "sonner";
import { useShallow } from 'zustand/react/shallow';

// Modular Components
import { MatchCard } from "@/components/run-round/MatchCard";
import { AutosimConsole } from "@/components/run-round/AutosimConsole";
import { RunResults } from "@/components/run-round/RunResults";

export default function RunRound() {
  const { state, setState } = useGameStore(
    useShallow((s) => ({ state: s.state, setState: s.setState }))
  );
  const [results, setResults] = useState<BoutResult[]>([]);
  const [running, setRunning] = useState(false);
  const [autosimming, setAutosimming] = useState(false);
  const [autosimProgress, setAutosimProgress] = useState<{ current: number; total: number; lastSummary?: WeekSummary } | null>(null);
  const [autosimResult, setAutosimResult] = useState<AutosimResult | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fightReady = useMemo(() => state.roster.filter(isFightReady), [state.roster]);
  const matchCard = useMemo(() => generateMatchCard(state), [state]);

  const handleRunWeek = useCallback(() => {
    if (running) return;
    setRunning(true);

    if (matchCard.length === 0 && fightReady.length < 2) {
      setRunning(false);
      toast.error("No valid pairings available this week.");
      return;
    }

    const processed = processWeekBouts(state);

    let updatedState = {
      ...processed.state,
      trainers: (processed.state.trainers ?? []).map(t => ({
        ...t, contractWeeksLeft: Math.max(0, t.contractWeeksLeft - 1),
      })).filter(t => t.contractWeeksLeft > 0),
    };

    updatedState = advanceWeek(updatedState);
    
    // Type-safe handling of promotions and summaries
    const playerPromotions: string[] = []; 
    
    updatedState = {
      ...updatedState,
      phase: "resolution",
      pendingResolutionData: {
        bouts: processed.results.map(r => ({
          a: r.a.name,
          d: r.d.name,
          winner: r.outcome.winner,
          by: r.outcome.by
        })),
        deaths: processed.summary.deathNames,
        injuries: processed.summary.injuryNames,
        promotions: playerPromotions,
        gazette: updatedState.newsletter.filter(n => n.week === state.week),
      }
    };

    setResults(processed.results);
    setState(updatedState);
    setRunning(false);
    toast.success(`Week ${state.week} concluded.`);
  }, [state, setState, running, matchCard, fightReady.length]);

  const handleStartAutosim = useCallback(async (weeks: number) => {
    if (autosimming) return;
    setAutosimming(true);
    setAutosimResult(null);

    const result = await runAutosim(state, weeks, (current, total, lastSummary) => {
      setAutosimProgress({ current, total, lastSummary });
    });

    setAutosimming(false);
    setAutosimResult(result);
    setState(result.finalState);
  }, [state, setState, autosimming]);

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h1 className="text-xl sm:text-3xl font-display font-black flex items-center gap-3 uppercase tracking-tighter text-foreground">
            <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
              <Swords className="h-6 w-6 text-primary" />
            </div>
            Engagement Console
          </h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mt-2 opacity-60">
            Current Temporal Sync: Week {state.week} // Mood: {state.crowdMood}
          </p>
        </div>

        {!autosimming && !autosimResult && results.length === 0 && (
          <Button 
            onClick={handleRunWeek} 
            disabled={running || (matchCard.length === 0 && fightReady.length < 2)}
            className="h-12 px-8 gap-3 font-black uppercase text-[11px] tracking-[0.2em] shadow-lg data-[running=true]:animate-pulse"
          >
            <Zap className="h-4 w-4 fill-current" /> EXECUTE_WEEK_CYCLE
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {results.length > 0 ? (
            <RunResults 
              results={results} 
              expandedId={expandedId} 
              onToggleExpand={setExpandedId} 
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Active_Combat_Manifest</h3>
                <div className="h-px flex-1 bg-border/20" />
              </div>
              {matchCard.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {matchCard.map((p, i) => (
                    <MatchCard key={i} pairing={p} crowdMood={state.crowdMood} />
                  ))}
                </div>
              ) : (
                <Card className="border-dashed bg-glass-card border-border/40">
                  <CardContent className="py-20 text-center text-muted-foreground/30">
                    <Skull className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="text-[11px] font-black uppercase tracking-widest leading-relaxed">
                      Zero_Engagement_Pairs_Detected<br/>
                      <span className="text-[9px] opacity-60">Warriors_May_Be_Resting_Or_In_Training</span>
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
           <div className="flex items-center gap-3 px-2">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Auto_Simulation_Bridge</h3>
            <div className="h-px flex-1 bg-border/20" />
          </div>
          <AutosimConsole 
            isSimulating={autosimming}
            progress={autosimProgress}
            result={autosimResult}
            onStart={handleStartAutosim}
          />

          <Card className="border-border/40 bg-glass-card overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/10 bg-secondary/10">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Stable_Readiness</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
               <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-foreground/80 flex items-center gap-2">
                    <Heart className="h-3.5 w-3.5 text-primary" /> MISSION_READY
                  </span>
                  <Badge variant="outline" className="font-mono text-xs">{fightReady.length}</Badge>
               </div>
               <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-foreground/80 flex items-center gap-2">
                    <Trophy className="h-3.5 w-3.5 text-arena-gold" /> COMBAT_PAIRED
                  </span>
                  <Badge variant="outline" className="font-mono text-xs">{matchCard.length}</Badge>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
