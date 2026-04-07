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
import { toast } from 'sonner';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { computeNextSeason } from '@/engine/weekPipeline';
import type { GameState, RivalStableData } from '@/types/state.types';
import { ArenaHistory } from '@/engine/history/arenaHistory';

export default function AdminTools() {
  const allFights = useMemo(() => ArenaHistory.all(), []);
  const { 
    setState, doReset, treasury, fame, week, season, roster, player, rivals, tournaments, ftueComplete 
  } = useGameStore();

  const handleExport = useCallback(() => {
    // Basic export of current store state
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
    const defaultPlayer = {
      id: "admin-0",
      name: "Master Admin",
      stableName: "The Admin Lords",
      fame: 0,
      renown: 0,
      titles: 0,
    };

    setState((prev: GameState) => ({ 
      ...prev, 
      ftueComplete: true, 
      isFTUE: false,
      player: {
        ...defaultPlayer,
        ...(prev.player ?? {})
      }
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
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between border-b border-border/10 pb-6">
        <div>
          <h1 className="text-xl sm:text-3xl font-display font-black flex items-center gap-3 uppercase tracking-tighter text-foreground">
            <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            Admin_Interface
          </h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mt-2 opacity-60">
            Advanced system overrides and telemetry management
          </p>
        </div>
        <Badge variant={ftueComplete ? "outline" : "destructive"} className="font-black uppercase text-[10px] tracking-widest h-6 px-4">
          SYSTEM_{ftueComplete ? "UNLOCKED" : "LOCKED"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-primary/20 bg-glass-card shadow-lg hover:border-primary/40 transition-all">
          <CardHeader className="pb-3 border-b border-primary/10 bg-primary/5">
            <h3 className="text-sm font-display flex items-center gap-2 text-primary uppercase font-bold">
              <Download className="h-4 w-4" /> Save_Core
            </h3>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            <Button onClick={handleExport} className="w-full h-11 gap-2 font-black uppercase text-[10px] tracking-widest shadow-sm" variant="outline">
              Export_Persistent_Save
            </Button>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <Button className="w-full h-11 gap-2 border-border/40 font-black uppercase text-[10px] tracking-widest" variant="outline">
                <Upload className="h-4 w-4" /> Import_State_Data
              </Button>
            </div>
            <Button onClick={doReset} className="w-full h-11 gap-2 font-black uppercase text-[10px] tracking-widest bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all border-none" variant="outline">
              <Trash2 className="h-4 w-4" /> Wipe_All_Data
            </Button>
          </CardContent>
        </Card>

        <Card className="border-accent/20 bg-glass-card shadow-lg hover:border-accent/40 transition-all">
          <CardHeader className="pb-3 border-b border-accent/10 bg-accent/5">
            <h3 className="text-sm font-display flex items-center gap-2 text-accent uppercase font-bold">
              <FastForward className="h-4 w-4" /> temporal_Drift
            </h3>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            <Button onClick={skipWeek} className="w-full h-11 font-black uppercase text-[10px] tracking-widest" variant="secondary">
              Advance 1 Week
            </Button>
            <Button onClick={skipSeason} className="w-full h-11 font-black uppercase text-[10px] tracking-widest" variant="secondary">
              Advance Season (13W)
            </Button>
            <Button onClick={skipFTUE} className="w-full h-11 font-black uppercase text-[10px] tracking-widest" variant="outline">
              Bypass FTUE
            </Button>
          </CardContent>
        </Card>

        <Card className="border-arena-gold/20 bg-glass-card shadow-lg hover:border-arena-gold/40 transition-all">
          <CardHeader className="pb-3 border-b border-arena-gold/10 bg-arena-gold/5">
            <h3 className="text-sm font-display flex items-center gap-2 text-arena-gold uppercase font-bold">
              <Zap className="h-4 w-4 fill-arena-gold" /> Mastery_Toolkit
            </h3>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
              <Button 
                onClick={() => {
                  setState((draft: GameState) => {
                    draft.roster.forEach((w) => {
                      if (w.favorites) {
                        w.favorites.discovered = { 
                          weapon: true, 
                          rhythm: true,
                          weaponHints: 10,
                          rhythmHints: 10
                        };
                      }
                    });
                  });
                  toast.success('Omniscient mastery achieved.');
                }} 
                className="w-full h-11 font-black uppercase text-[10px] tracking-widest border-arena-gold/30 text-arena-gold" 
                variant="outline"
              >
                Force All Mastery
              </Button>
              <Button 
                onClick={resetRivals} 
                className="w-full h-11 font-black uppercase text-[10px] tracking-widest border-primary/30 text-primary" 
                variant="outline"
              >
                Regenerate Rivals
              </Button>
          </CardContent>
        </Card>

        <Card className="border-border/30 bg-glass-card shadow-lg md:col-span-2 lg:col-span-3 overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/10 bg-secondary/10">
            <h3 className="text-xs font-display flex items-center gap-2 text-muted-foreground uppercase tracking-widest font-bold">
              <Activity className="h-4 w-4" /> Telemetry_Output_Stream
            </h3>
          </CardHeader>
          <CardContent className="p-0">
             <div className="bg-background/40 p-6 overflow-x-auto max-h-[400px] text-xs font-mono leading-relaxed thin-scrollbar">
                <pre className="text-primary/70">
                {JSON.stringify({
                    temporal: { week, season },
                    inventory: { treasury, fame },
                    roster: { size: roster.length, championCount: roster.filter(w=>w.champion).length },
                    ecosystem: { rivalCount: rivals?.length || 0, tournamentCount: tournaments.length },
                    player: player
                }, null, 4)}
                </pre>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
