import React, { useCallback } from 'react';
import { useGameStore, reconstructGameState } from '@/state/useGameStore';
import { Button } from '@/components/ui/button';
import {
  Settings,
  Download,
  Upload,
  Trash2,
  FastForward,
  Activity,
  Zap,
  SlidersHorizontal,
  Terminal,
} from 'lucide-react';
import ArenaSettings from '@/components/settings/ArenaSettings';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageFrame } from '@/components/ui/PageFrame';
import { Surface } from '@/components/ui/Surface';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { computeNextSeason } from '@/engine/pipeline/passes/WorldPass';
import type { GameState, RivalStableData } from '@/types/state.types';

export default function AdminTools() {
  const { setState, doReset, doAdvanceWeek, treasury, fame, week, season, roster, player, ftueComplete } =
    useGameStore();

  const [activeCategory, setActiveCategory] = React.useState<
    'SYSTEM' | 'ECONOMY' | 'WORLD' | 'TELEMETRY' | 'PREFERENCES'
  >('SYSTEM');

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

  const handleImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result;
          if (typeof content !== 'string') throw new Error('Invalid file content');
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
    },
    [setState]
  );

  const skipWeek = useCallback(async () => {
    await doAdvanceWeek();
    toast.success(`Advanced 1 Week`);
  }, [doAdvanceWeek]);

  const skipSeason = useCallback(() => {
    const store = useGameStore.getState();
    let currentState = reconstructGameState(store);
    for (let i = 0; i < 13; i++) {
      currentState = advanceWeek(currentState);
    }
    currentState.season = computeNextSeason(currentState.week);
    store.loadGame(store.activeSlotId || 'autosave', currentState);
    toast.success('Seasonal transition forced.');
  }, []);

  const skipFTUE = useCallback(() => {
    setState((draft) => {
      const defaultPlayer = {
        id: 'admin-0',
        name: 'Master Admin',
        stableName: 'The Admin Lords',
        fame: 0,
        renown: 0,
        titles: 0,
      };
      draft.ftueComplete = true;
      draft.isFTUE = false;
      draft.player = { ...defaultPlayer, ...(draft.player || {}) } as any;
    });
    toast.success('FTUE constraints bypassed.');
  }, [setState]);

  const resetRivals = useCallback(() => {
    import('@/engine/rivals').then(({ generateRivalStables }) => {
      const newRivals = generateRivalStables(23, Date.now()) as RivalStableData[];
      setState((draft) => {
        draft.rivals = newRivals;
      });
      toast.success('Rival ecosystem regenerated.');
    });
  }, [setState]);

  return (
    <PageFrame maxWidth="lg" className="pb-32">
      <PageHeader
        icon={Terminal}
        eyebrow="Console // Root Access"
        title="Administration"
        subtitle="IMPERIAL CENSOR · SYSTEM OVERRIDE · DATA ARCHIVAL"
        actions={
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end px-4 border-r border-white/5">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">
                Authorization
              </span>
              <span
                className={cn(
                  'text-[10px] font-black uppercase tracking-widest',
                  ftueComplete ? 'text-primary' : 'text-destructive'
                )}
              >
                SYSTEM_{ftueComplete ? 'UNLOCKED' : 'LOCKED'}
              </span>
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <aside className="lg:col-span-3 space-y-8 sticky top-6">
          <SectionDivider label="Access Level" />
          <Surface variant="glass" className="p-2 space-y-1 border-white/5">
            {[
              { id: 'SYSTEM', icon: Settings, label: 'Core_System' },
              { id: 'ECONOMY', icon: Zap, label: 'Market_Ops' },
              { id: 'WORLD', icon: FastForward, label: 'Temporal_Flux' },
              { id: 'TELEMETRY', icon: Activity, label: 'Data_Stream' },
              { id: 'PREFERENCES', icon: SlidersHorizontal, label: 'Arena_Prefs' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as 'SYSTEM' | 'ECONOMY' | 'WORLD' | 'TELEMETRY' | 'PREFERENCES')}
                className={cn(
                  'w-full flex items-center gap-4 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all duration-300 group',
                  activeCategory === cat.id
                    ? 'bg-primary text-black'
                    : 'text-muted-foreground/60 hover:bg-white/5 hover:text-foreground'
                )}
              >
                <cat.icon
                  className={cn(
                    'h-4 w-4 transition-colors',
                    activeCategory === cat.id
                      ? 'text-black'
                      : 'text-muted-foreground/40 group-hover:text-primary'
                  )}
                />
                {cat.label}
              </button>
            ))}
          </Surface>
        </aside>

        <main className="lg:col-span-9 space-y-12">
          {activeCategory === 'SYSTEM' && (
            <div className="space-y-12">
              <SectionDivider label="Save Operations" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Surface variant="glass" className="border-white/5 overflow-hidden">
                  <div className="bg-white/[0.01] px-6 py-4 border-b border-white/5 flex items-center gap-4">
                    <ImperialRing size="sm" variant="bronze">
                      <Download className="h-3 w-3 text-muted-foreground" />
                    </ImperialRing>
                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                      Save Core
                    </span>
                  </div>
                  <div className="p-8 space-y-4">
                    <Button
                      onClick={handleExport}
                      className="w-full h-12 gap-3 font-black uppercase text-[10px] tracking-widest rounded-none border-white/10"
                      variant="outline"
                    >
                      Export Persistent Save
                    </Button>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <Button
                        className="w-full h-12 gap-3 font-black uppercase text-[10px] tracking-widest rounded-none border-white/10"
                        variant="outline"
                      >
                        <Upload className="h-4 w-4" /> Import State Data
                      </Button>
                    </div>
                  </div>
                </Surface>

                <Surface variant="blood" className="border-primary/20 overflow-hidden">
                  <div className="bg-primary/5 px-6 py-4 border-b border-primary/10 flex items-center gap-4">
                    <ImperialRing size="sm" variant="blood">
                      <Trash2 className="h-3 w-3 text-primary" />
                    </ImperialRing>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                      Destructive Reset
                    </span>
                  </div>
                  <div className="p-8 space-y-6">
                    <p className="text-[10px] text-primary/60 font-mono leading-relaxed">
                      WARNING: This bypasses all safety checks and nukes the local IndexedDB pool.
                      All progress will be lost.
                    </p>
                    <Button
                      onClick={doReset}
                      variant="destructive"
                      className="w-full h-12 font-black uppercase text-[10px] tracking-widest rounded-none"
                    >
                      Execute System Wipe
                    </Button>
                  </div>
                </Surface>
              </div>
            </div>
          )}

          {activeCategory === 'WORLD' && (
            <div className="space-y-12">
              <SectionDivider label="Temporal Control" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Surface variant="glass" className="border-white/5 overflow-hidden">
                  <div className="bg-white/[0.01] px-6 py-4 border-b border-white/5 flex items-center gap-4">
                    <ImperialRing size="sm" variant="gold">
                      <FastForward className="h-3 w-3 text-arena-gold" />
                    </ImperialRing>
                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                      Time Dilation
                    </span>
                  </div>
                  <div className="p-8 space-y-4">
                    <Button
                      onClick={skipWeek}
                      className="w-full h-12 font-black uppercase text-[10px] tracking-widest rounded-none"
                      variant="secondary"
                    >
                      Advance 1 Week
                    </Button>
                    <Button
                      onClick={skipSeason}
                      className="w-full h-12 font-black uppercase text-[10px] tracking-widest rounded-none"
                      variant="secondary"
                    >
                      Advance Season (13W)
                    </Button>
                    <Button
                      onClick={skipFTUE}
                      className="w-full h-12 font-black uppercase text-[10px] tracking-widest rounded-none border-white/10"
                      variant="outline"
                    >
                      Bypass FTUE Constraints
                    </Button>
                  </div>
                </Surface>
              </div>
            </div>
          )}

          {activeCategory === 'ECONOMY' && (
            <div className="space-y-12">
              <SectionDivider label="Operational Mastery" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Surface variant="glass" className="border-white/5 overflow-hidden">
                  <div className="bg-white/[0.01] px-6 py-4 border-b border-white/5 flex items-center gap-4">
                    <ImperialRing size="sm" variant="gold">
                      <Zap className="h-3 w-3 text-arena-gold" />
                    </ImperialRing>
                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                      God Mode Tools
                    </span>
                  </div>
                  <div className="p-8 space-y-4">
                    <Button
                      onClick={() => {
                        setState((draft: GameState) => {
                          draft.roster.forEach((w) => {
                            if (w.favorites) {
                              w.favorites.discovered = {
                                weapon: true,
                                rhythm: true,
                                weaponHints: 10,
                                rhythmHints: 10,
                              };
                            }
                          });
                        });
                        toast.success('Omniscient mastery achieved.');
                      }}
                      className="w-full h-12 font-black uppercase text-[10px] tracking-widest rounded-none border-arena-gold/30 text-arena-gold"
                      variant="outline"
                    >
                      Force All Mastery
                    </Button>
                    <Button
                      onClick={resetRivals}
                      className="w-full h-12 font-black uppercase text-[10px] tracking-widest rounded-none border-primary/30 text-primary"
                      variant="outline"
                    >
                      Regenerate Rival Stables
                    </Button>
                  </div>
                </Surface>
              </div>
            </div>
          )}

          {activeCategory === 'TELEMETRY' && (
            <div className="space-y-12">
              <SectionDivider label="Data Visualization" />
              <Surface
                variant="glass"
                className="border-white/5 overflow-hidden font-mono text-[11px]"
              >
                <div className="bg-white/[0.01] px-6 py-4 border-b border-white/5 flex items-center gap-4 text-muted-foreground/40 uppercase font-black tracking-widest">
                  <Activity className="h-4 w-4" /> Protocol Dump // V2.4.0
                </div>
                <div className="p-8 bg-black/40 overflow-x-auto thin-scrollbar">
                  <pre className="text-primary/60">
                    {JSON.stringify(
                      {
                        temporal: { week, season },
                        inventory: { treasury, fame },
                        roster: { size: roster.length },
                        player: player,
                      },
                      null,
                      4
                    )}
                  </pre>
                </div>
              </Surface>
            </div>
          )}

          {activeCategory === 'PREFERENCES' && (
            <div className="space-y-12">
              <SectionDivider label="Arena Parameters" />
              <div className="max-w-2xl">
                <ArenaSettings />
              </div>
            </div>
          )}
        </main>
      </div>
    </PageFrame>
  );
}
