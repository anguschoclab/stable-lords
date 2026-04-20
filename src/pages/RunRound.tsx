/**
 * Stable Lords — Run Round (Refactored)
 * Modularized for better maintainability and strict type safety.
 */
import React, { useState, useMemo, useCallback } from "react";
import { useGameStore, reconstructGameState, type GameStore } from "@/state/useGameStore";
import { type GameState, type Warrior, type RivalStableData } from "@/types/game";

import { generatePairings } from "@/engine/bout/core/pairings";
import { isFightReady } from "@/engine/warriorStatus";
import { processWeekBouts, type BoutResult } from "@/engine/boutProcessor";
import { runAutosim, type AutosimResult } from "@/engine/autosim";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { Swords, Zap, Skull, Shield, FastForward, Trophy, Heart } from "lucide-react";
import { toast } from "sonner";
import { useShallow } from 'zustand/react/shallow';

// Modular Components
import { MatchCard } from "@/components/run-round/MatchCard";
import { AutosimConsole } from "@/components/run-round/AutosimConsole";
import { RunResults } from "@/components/run-round/RunResults";

export default function RunRound() {
  const store = useGameStore();
  const { setState, doAdvanceDay, doAdvanceWeek, setSimulating } = store;
  const state = useMemo(() => reconstructGameState(store), [store]);
  const [results, setResults] = useState<BoutResult[]>([]);
  const [running, setRunning] = useState(false);
  const [autosimming, setAutosimming] = useState(false);
  const [autosimProgress, setAutosimProgress] = useState<{ current: number; total: number } | null>(null);
  const [autosimResult, setAutosimResult] = useState<AutosimResult | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fightReady = useMemo(() => state.roster.filter((w: Warrior) => isFightReady(w)), [state.roster]);
  const matchCard = useMemo(() => {
    return generatePairings(state).map(p => ({
      playerWarrior: p.a,
      rivalWarrior: p.d,
      rivalStable: state.rivals.find((r: RivalStableData) => r.owner.id === p.rivalStableId) || { owner: { id: p.rivalStableId, stableName: p.rivalStable } } as RivalStableData,
      isRivalryBout: p.isRivalry
    }));
  }, [state]);

  const handleExecuteCycle = useCallback(() => {
    if (running) return;
    setRunning(true);

    if (matchCard.length === 0 && fightReady.length < 2) {
      setRunning(false);
      toast.error("No valid pairings available for this mission.");
      return;
    }

    const processed = processWeekBouts(state);
    
    // Update local state results for display
    setResults(processed.results);

    // Persist to store based on cycle type
    if (state.isTournamentWeek) {
      doAdvanceDay(processed.state, processed.results, processed.summary.deathNames, processed.summary.injuryNames);
      toast.success(`Empire Day ${state.day + 1} concluded.`);
    } else {
      doAdvanceWeek(processed.state, processed.results, processed.summary.deathNames, processed.summary.injuryNames);
      toast.success(`Week ${state.week} concluded.`);
    }

    setRunning(false);
    setExpandedId(null);
  }, [state, running, matchCard, fightReady.length, doAdvanceDay, doAdvanceWeek]);

  const handleStartAutosim = useCallback(async (weeks: number) => {
    if (autosimming) return;
    setAutosimming(true);
    setSimulating(true);
    setAutosimResult(null);

    try {
      const result = await runAutosim(state, weeks, (currentWeek: number) => {
        setAutosimProgress({ current: currentWeek, total: weeks });
      });

      setAutosimResult(result);
      setState((draft: GameStore) => {
        Object.assign(draft, result.finalState);
      });
    } catch (err) {
      console.error("Autosim failed", err);
      toast.error("Auto-simulation encountered a temporal rift.");
    } finally {
      setAutosimming(false);
      setSimulating(false);
    }
  }, [state, setState, autosimming, setSimulating]);

  return (
    <div className="space-y-8 pb-20 max-w-5xl mx-auto">
      <PageHeader
        icon={Swords}
        title="Engagement Console"
        subtitle={`WEEK ${state.week} · ${state.season} · ${state.crowdMood} CROWD`}
      />

      {/* Band 2 — Stable Readiness Strip */}
      <Surface variant="glass" className="flex items-center gap-12 p-5 border-l-4 border-l-primary/50">
        <div className="flex items-center gap-3">
          <Activity className="h-4 w-4 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Stable_Readiness</span>
        </div>
        
        <div className="flex items-center gap-10">
           <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">Mission_Ready</span>
                <span className="font-display font-black text-xl text-primary leading-none mt-1">{fightReady.length}</span>
              </div>
              <div className="h-8 w-px bg-white/5" />
           </div>

           <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">Combat_Paired</span>
                <span className="font-display font-black text-xl text-arena-gold leading-none mt-1">{matchCard.length}</span>
              </div>
              <div className="h-8 w-px bg-white/5" />
           </div>

           <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">Injured_Medbay</span>
                <span className="font-display font-black text-xl text-destructive leading-none mt-1">
                  {state.roster.filter(w => w.fatigue > 70 || w.status === "Injured").length}
                </span>
              </div>
           </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {!autosimming && !autosimResult && results.length === 0 && (
            <Button
              onClick={handleExecuteCycle}
              disabled={running || (matchCard.length === 0 && fightReady.length < 2)}
              className="h-10 px-8 gap-3 font-black uppercase text-[12px] tracking-[0.2em] bg-primary text-black hover:bg-primary/90"
            >
              <Zap className="h-4 w-4 fill-current" />
              {state.isTournamentWeek ? `EXECUTE DAY ${state.day + 1} ›` : `EXECUTE WEEK ${state.week} ›`}
            </Button>
          )}
        </div>
      </Surface>

      {/* Main Focus Canvas — Archetype F */}
      <div className="max-w-3xl mx-auto space-y-8">
        {results.length > 0 ? (
          <RunResults 
            results={results} 
            expandedId={expandedId} 
            onToggleExpand={setExpandedId} 
          />
        ) : (
          <Surface variant="glass" className="p-0 border-accent/20">
            <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-accent" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Active_Combat_Manifest</span>
              </div>
              <Badge variant="outline" className="text-[9px] font-mono border-white/10">{matchCard.length} PAIRINGS</Badge>
            </div>
            
            <div className="p-6 space-y-4">
              {matchCard.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {matchCard.map((p, i) => (
                    <MatchCard 
                      key={i} 
                      pairing={{
                        a: p.playerWarrior,
                        d: p.rivalWarrior,
                        rivalStable: p.rivalStable?.owner?.stableName || "Rival Stable",
                        isRivalry: p.isRivalryBout
                      }} 
                      crowdMood={state.crowdMood} 
                    />
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center text-muted-foreground/30">
                  <Skull className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="text-[11px] font-black uppercase tracking-widest leading-relaxed">
                    Zero_Engagement_Pairs_Detected<br/>
                    <span className="text-[9px] opacity-60">Warriors_May_Be_Resting_Or_In_Training</span>
                  </p>
                </div>
              )}
            </div>
          </Surface>
        )}

        {/* Autosim moved below main content in Archetype F */}
        <div className="pt-8 border-t border-white/5">
          <div className="flex items-center gap-3 px-2 mb-6">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Auto_Simulation_Bridge</h3>
            <div className="h-px flex-1 bg-border/20" />
          </div>
          <AutosimConsole 
            isSimulating={autosimming}
            progress={autosimProgress}
            result={autosimResult}
            onStart={handleStartAutosim}
          />
        </div>
      </div>
    </div>
  );
}
