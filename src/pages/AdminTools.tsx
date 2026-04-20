/**
 * Stable Lords — Administration & Telemetry Console
 * Strictly typed utility for save management and simulation bypass.
 */
import React, { useMemo, useCallback } from 'react';
import { useGameStore } from '@/state/useGameStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Download, Upload, Trash2, FastForward, Activity, Zap } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Surface } from '@/components/ui/Surface';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { computeNextSeason } from '@/engine/pipeline/passes/WorldPass';
import type { GameState, RivalStableData } from '@/types/state.types';
import { ArenaHistory } from '@/engine/history/arenaHistory';

export default function AdminTools() {
  const allFights = useMemo(() => ArenaHistory.all(), []);
  const { 
    setState, doReset, treasury, fame, week, season, roster, player, rivals, tournaments, ftueComplete 
  } = useGameStore();

  const [activeCategory, setActiveCategory] = React.useState<'SYSTEM' | 'ECONOMY' | 'WORLD' | 'TELEMETRY'>('SYSTEM');

  const handleExport = useCallback(() => {
    const currentState = useGameStore.getState();
    const data = JSON.stringify({ state: currentState }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stable-lords-export-w${week}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Current session state exported.');
  }, [week]);

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        if (typeof content !== 'string') throw new Error("Invalid file content");
        const data = JSON.parse(content);
        if (data && data.state) {
           setState(() => data.state as GameState);
           toast.success('Temporal state synchronization restored.');
        } else {
           toast.error('Invalid save signature detected.');
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Telemetry reconstruction failed.');
      }
    };
    reader.readAsText(file);
  }, [setState]);

  const skipWeek = useCallback(() => {
    setState((prev: GameState) => {
      const next = advanceWeek(prev);
      toast.success(`Advanced to Week ${next.week}`);
      return next;
    });
  }, [setState]);

  const skipSeason = useCallback(() => {
    setState((prev: GameState) => {
      let newState = { ...prev };
      for(let i=0; i<13; i++) {
          newState = advanceWeek(newState);
      }
      newState.season = computeNextSeason(newState.week);
      return newState;
    });
    toast.success('Seasonal transition forced.');
  }, [setState]);

  const skipFTUE = useCallback(() => {
    const defaultPlayer = { id: "admin-0", name: "Master Admin", stableName: "The Admin Lords", fame: 0, renown: 0, titles: 0 };
    setState((prev: GameState) => ({ 
      ...prev, ftueComplete: true, isFTUE: false, 
      player: { ...defaultPlayer, ...(prev.player ?? {}) } 
    }));
    toast.success('FTUE constraints bypassed.');
  }, [setState]);

  const resetRivals = useCallback(() => {
    import("@/engine/rivals").then(({ generateRivalStables }) => {
      const newRivals = generateRivalStables(23, Date.now()) as RivalStableData[];
      setState((prev: GameState) => ({ ...prev, rivals: newRivals }));
      toast.success('Rival ecosystem regenerated.');
    });
  }, [setState]);

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      <PageHeader
        icon={Settings}
        title="Administration"
        subtitle="IMPERIAL CENSOR · ADMIN · SYSTEM OVERRIDE"
        actions={
          <Badge variant={ftueComplete ? "outline" : "destructive"} className="font-black uppercase text-[10px] tracking-widest h-6 px-4">
            SYSTEM_{ftueComplete ? "UNLOCKED" : "LOCKED"}
          </Badge>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <aside className="lg:col-span-3 space-y-6 sticky top-6">
           <div className="flex items-center gap-3 px-2">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">CONSOLE_LEVEL</span>
           </div>
           
           <Surface variant="glass" className="p-2 space-y-1">
              {[
                { id: 'SYSTEM', icon: Settings, label: 'Core_System' },
                { id: 'ECONOMY', icon: Zap, label: 'Market_Ops' },
                { id: 'WORLD', icon: FastForward, label: 'Temporal_Flux' },
                { id: 'TELEMETRY', icon: Activity, label: 'Data_Stream' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as any)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all",
                    activeCategory === cat.id ? "bg-primary text-black" : "text-muted-foreground hover:bg-white/5"
                  )}
                >
                  <cat.icon className="h-4 w-4" />
                  {cat.label}
                </button>
              ))}
           </Surface>
        </aside>

        <main className="lg:col-span-9 space-y-6">
           {activeCategory === 'SYSTEM' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Surface variant="glass" className="p-0 border-primary/20 overflow-hidden shadow-2xl">
                  <div className="bg-primary/10 px-5 py-3 border-b border-primary/10 flex items-center gap-2">
                    <Download className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Save_Core</span>
                  </div>
                  <div className="p-6 space-y-3">
                    <Button onClick={handleExport} className="w-full h-11 gap-2 font-black uppercase text-[10px] tracking-widest" variant="outline">
                      Export_Persistent_Save
                    </Button>
                    <div className="relative">
                      <input type="file" accept=".json" onChange={handleImport} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <Button className="w-full h-11 gap-2 border-border/40 font-black uppercase text-[10px] tracking-widest" variant="outline">
                        <Upload className="h-4 w-4" /> Import_State_Data
                      </Button>
                    </div>
                    <Button onClick={doReset} className="w-full h-11 gap-2 font-black uppercase text-[10px] tracking-widest bg-destructive/10 text-destructive hover:bg-destructive/20 border-none" variant="outline">
                      <Trash2 className="h-4 w-4" /> Wipe_All_Data
                    </Button>
                  </div>
                </Surface>

                <Surface variant="blood" className="p-6 flex flex-col justify-center">
                   <h3 className="text-sm font-black uppercase tracking-widest text-destructive mb-2 flex items-center gap-2">
                     <Trash2 className="h-4 w-4" /> Hard Reset
                   </h3>
                   <p className="text-[10px] text-destructive/70 mb-6 font-mono">WARNING: This bypasses all safety checks and nukes the local IndexedDB pool.</p>
                   <Button onClick={doReset} variant="destructive" className="w-full h-10 font-black uppercase text-[10px] tracking-widest">EXECUTE_WIPE</Button>
                </Surface>
             </div>
           )}

           {activeCategory === 'WORLD' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Surface variant="glass" className="p-0 border-accent/20 overflow-hidden">
                  <div className="bg-accent/10 px-5 py-3 border-b border-accent/10 flex items-center gap-2">
                    <FastForward className="h-4 w-4 text-accent" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-accent">Temporal_Drift</span>
                  </div>
                  <div className="p-6 space-y-3">
                    <Button onClick={skipWeek} className="w-full h-11 font-black uppercase text-[10px] tracking-widest" variant="secondary">Advance 1 Week</Button>
                    <Button onClick={skipSeason} className="w-full h-11 font-black uppercase text-[10px] tracking-widest" variant="secondary">Advance Season (13W)</Button>
                    <Button onClick={skipFTUE} className="w-full h-11 font-black uppercase text-[10px] tracking-widest" variant="outline">Bypass FTUE</Button>
                  </div>
               </Surface>
             </div>
           )}

           {activeCategory === 'ECONOMY' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Surface variant="glass" className="p-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-arena-gold mb-2 flex items-center gap-2">
                    <Zap className="h-4 w-4 fill-arena-gold" /> Mastery_Toolkit
                  </h3>
                   <Button 
                    onClick={() => {
                      setState((draft: GameState) => {
                        draft.roster.forEach((w) => {
                          if (w.favorites) {
                            w.favorites.discovered = { weapon: true, rhythm: true, weaponHints: 10, rhythmHints: 10 };
                          }
                        });
                      });
                      toast.success('Omniscient mastery achieved.');
                    }} 
                    className="w-full h-11 font-black uppercase text-[10px] tracking-widest border-arena-gold/30 text-arena-gold mb-3" 
                    variant="outline"
                  >
                    Force All Mastery
                  </Button>
                  <Button onClick={resetRivals} className="w-full h-11 font-black uppercase text-[10px] tracking-widest border-primary/30 text-primary" variant="outline">
                    Regenerate Rivals
                  </Button>
               </Surface>
             </div>
           )}

           {activeCategory === 'TELEMETRY' && (
             <Surface variant="glass" className="p-0 overflow-hidden font-mono text-[11px]">
                <div className="bg-secondary/20 px-5 py-3 border-b border-white/5 flex items-center gap-2 text-muted-foreground/60 uppercase font-black tracking-widest">
                  <Activity className="h-4 w-4" /> Raw_Protocol_Dump
                </div>
                <div className="p-6 bg-black/40 overflow-x-auto thin-scrollbar">
                   <pre className="text-primary/60">
                   {JSON.stringify({
                       temporal: { week, season },
                       inventory: { treasury, fame },
                       roster: { size: roster.length },
                       player: player
                   }, null, 4)}
                   </pre>
                </div>
             </Surface>
           )}
        </main>
      </div>
    </div>
  );
}
