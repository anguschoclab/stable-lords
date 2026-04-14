import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FastForward, Activity, AlertCircle, CheckCircle2 } from "lucide-react";
import type { AutosimResult, AutosimWeekSummary as WeekSummary } from "@/engine/autosim";

interface AutosimConsoleProps {
  isSimulating: boolean;
  progress: { current: number; total: number; lastSummary?: WeekSummary } | null;
  result: AutosimResult | null;
  onStart: (weeks: number) => void;
}

export function AutosimConsole({ isSimulating, progress, result, onStart }: AutosimConsoleProps) {
  const percent = progress ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <Card className="border-accent/40 bg-accent/5 shadow-lg overflow-hidden">
      <CardHeader className="pb-3 border-b border-accent/10 bg-accent/5">
        <CardTitle className="font-display text-sm font-black uppercase tracking-widest flex items-center gap-2 text-accent">
          <FastForward className="h-4 w-4" /> 
          Strategic_Autosim_Matrix
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {!isSimulating && !result && (
          <div className="space-y-4">
             <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 leading-relaxed">
               Execute multiple combat cycles autonomously. The simulation will disengage if casualties or critical injuries are detected.
             </p>
             <div className="grid grid-cols-2 gap-3">
               <Button variant="outline" onClick={() => onStart(4)} className="h-10 font-black uppercase text-[10px] tracking-widest">4_WKS (Short)</Button>
               <Button variant="outline" onClick={() => onStart(8)} className="h-10 font-black uppercase text-[10px] tracking-widest">8_WKS (Medium)</Button>
               <Button variant="default" onClick={() => onStart(13)} className="h-10 font-black uppercase text-[10px] tracking-widest col-span-2 shadow-[0_0_15px_-5px_rgba(var(--accent-rgb),0.5)]">13_WKS (Full Season)</Button>
             </div>
          </div>
        )}

        {isSimulating && progress && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-accent animate-pulse">Processing_Cycle_{progress.current}_of_{progress.total}</span>
                <span className="text-foreground">{percent}%</span>
            </div>
            <Progress value={percent} className="h-2 bg-accent/10" />
            {progress.lastSummary && (
               <div className="bg-background/40 p-3 rounded-xl border border-accent/20 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-3">
                    <Activity className="h-3.5 w-3.5 text-accent" />
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">Wk {progress.lastSummary.week}: {progress.lastSummary.bouts} Bouts</span>
                  </div>
                  <div className="flex gap-3">
                     <span className="text-[10px] font-mono text-destructive">☠️ {progress.lastSummary.deaths}</span>
                     <span className="text-[10px] font-mono text-amber-500">🩹 {progress.lastSummary.injuries}</span>
                  </div>
               </div>
            )}
          </div>
        )}

        {result && (
          <div className="space-y-4 animate-in zoom-in-95 duration-300">
             <div className={cn(
               "p-4 rounded-2xl border flex items-start gap-4",
               result.stopReason === "max_weeks" ? "bg-primary/10 border-primary/30" : "bg-destructive/10 border-destructive/30"
             )}>
                {result.stopReason === "max_weeks" ? <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" /> : <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />}
                <div className="space-y-1">
                   <h4 className="font-display font-black uppercase text-xs tracking-tight">
                     Simulation {result.stopReason === "max_weeks" ? "Concluded" : "Aborted"}
                   </h4>
                   <p className="text-[11px] font-bold text-foreground/80 leading-snug uppercase font-display">
                     {result.stopDetail}
                   </p>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-secondary/20 p-3 rounded-xl border border-border/10">
                   <span className="text-[8px] font-black uppercase text-muted-foreground block mb-1">Total Cycles</span>
                   <span className="font-mono text-sm font-bold">{result.weeksSimmed} Weeks</span>
                </div>
                <div className="bg-secondary/20 p-3 rounded-xl border border-border/10">
                   <span className="text-[8px] font-black uppercase text-muted-foreground block mb-1">Arena Casualties</span>
                   <span className="font-mono text-sm font-bold text-destructive">{result.weekSummaries.reduce((s, w) => s + w.deaths, 0)} Deaths</span>
                </div>
             </div>

             <Button variant="outline" onClick={() => window.location.reload()} className="w-full h-10 font-black uppercase text-[10px] tracking-widest">
                Return_To_Console
             </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function cn(...inputs: import("clsx").ClassValue[]) {
  return inputs.filter(Boolean).join(" ");
}
