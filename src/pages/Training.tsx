import { useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGameStore, useWorldState, type GameStore } from '@/state/useGameStore';
import { ATTRIBUTE_LABELS, type TrainingAssignment, type Attributes } from '@/types/game';
import type { Warrior } from '@/types/state.types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dumbbell,
  Heart,
  Activity,
  Zap,
  TrendingUp,
  X,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { WarriorTrainingCard } from '@/components/training/WarriorTrainingCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { Surface } from '@/components/ui/Surface';
import { StyleMeterTable } from '@/components/charts/StyleMeterTable';
import { PageFrame } from '@/components/ui/PageFrame';
import { SectionDivider } from '@/components/ui/SectionDivider';

export default function Training() {
  const navigate = useNavigate();
  const state = useWorldState();
  const { setState } = useGameStore();

  const assignmentMap = useMemo(() => {
    const map = new Map<string, TrainingAssignment>();
    for (const a of state.trainingAssignments ?? []) map.set(a.warriorId, a);
    return map;
  }, [state.trainingAssignments]);

  const seasonalGainsMap = useMemo(() => {
    const map = new Map<string, Partial<Record<keyof Attributes, number>>>();
    for (const sg of state.seasonalGrowth ?? []) {
      if (sg.season === state.season) {
        map.set(sg.warriorId, sg.gains);
      }
    }
    return map;
  }, [state.seasonalGrowth, state.season]);

  const assignments = state.trainingAssignments ?? [];

  const handleAssign = (warriorId: string, attribute: keyof Attributes) => {
    if (attribute === 'SZ') return;
    const warrior = state.roster.find((w: Warrior) => w.id === warriorId);
    setState((s: GameStore) => {
      s.trainingAssignments = [
        ...(s.trainingAssignments ?? []).filter(
          (a: TrainingAssignment) => a.warriorId !== warriorId
        ),
        { warriorId, type: 'attribute', attribute },
      ];
    });
    toast.success(`${warrior?.name} assigned to train ${ATTRIBUTE_LABELS[attribute]}`);
  };

  const handleAssignRecovery = (warriorId: string) => {
    const warrior = state.roster.find((w: Warrior) => w.id === warriorId);
    setState((s: GameStore) => {
      s.trainingAssignments = [
        ...(s.trainingAssignments ?? []).filter(
          (a: TrainingAssignment) => a.warriorId !== warriorId
        ),
        { warriorId, type: 'recovery' },
      ];
    });
    toast.success(`${warrior?.name} assigned to active recovery`);
  };

  const handleClear = (warriorId: string) => {
    setState((s: GameStore) => {
      s.trainingAssignments = (s.trainingAssignments ?? []).filter(
        (a: TrainingAssignment) => a.warriorId !== warriorId
      );
    });
  };

  const handleClearAll = () => {
    setState((s: GameStore) => {
      s.trainingAssignments = [];
    });
    toast('All training assignments cleared.');
  };

  const assignedCount = assignments.length;
  const recoveryCount = assignments.filter((a: TrainingAssignment) => a.type === 'recovery').length;
  const trainingCount = assignedCount - recoveryCount;

  // Training results from the last week pipeline run
  const trainingReportItems = useMemo(() => {
    return (state.newsletter ?? [])
      .filter((n) => n.title === 'Training Report' && n.week === state.week)
      .flatMap((n) => n.items);
  }, [state.newsletter, state.week]);

  const [dismissedWeek, setDismissedWeek] = useState<number | null>(null);
  const showReport = trainingReportItems.length > 0 && dismissedWeek !== state.week;

  function classifyItem(msg: string): 'gain' | 'injury' | 'recovery' {
    const lower = msg.toLowerCase();
    if (lower.includes('injur') || lower.includes('hurt') || lower.includes('strain'))
      return 'injury';
    if (lower.includes('recover') || lower.includes('rest')) return 'recovery';
    return 'gain';
  }

  return (
    <PageFrame size="xl">
      <PageHeader
        eyebrow="STABLE_MANAGEMENT"
        title="Training Grounds"
        subtitle="DRILLS · RECOVERY · POTENTIAL_OPTIMIZATION"
        icon={Dumbbell}
        actions={
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
              <div className="flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-primary" />
                <span>
                  SYNC_LOAD: {Math.round((trainingCount / (state.roster.length || 1)) * 100)}%
                </span>
              </div>
              <div className="h-3 w-px bg-border/40" />
              <div className="flex items-center gap-1.5">
                <Heart className="h-3 w-3 text-destructive" />
                <span>MED_BAY: {recoveryCount} UNITS</span>
              </div>
            </div>
            {assignedCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="h-8 text-[10px] font-black tracking-widest uppercase border-white/5 bg-white/5 hover:bg-white/10 rounded-none"
              >
                RESET_ALL_ASSIGNMENTS
              </Button>
            )}
          </div>
        }
      />

      {/* Weekly Training Results Banner */}
      {showReport && (
        <Surface variant="glass" className="border-primary/20 overflow-hidden mb-12">
          <div className="flex items-center justify-between px-5 py-3 bg-primary/5 border-b border-white/5">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
              <TrendingUp className="h-3.5 w-3.5" />
              PREVIOUS_CYCLE_REPORT
            </div>
            <button
              onClick={() => setDismissedWeek(state.week)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {trainingReportItems.map((msg, i) => {
              const kind = classifyItem(msg);
              return (
                <div
                  key={i}
                  className={cn(
                    'flex items-start gap-2 px-3 py-2 text-[10px] uppercase font-black tracking-tight',
                    kind === 'gain' && 'bg-primary/5 text-primary border border-primary/10',
                    kind === 'injury' &&
                      'bg-arena-gold/5 text-arena-gold border border-arena-gold/10',
                    kind === 'recovery' && 'bg-sky-500/5 text-sky-400 border border-sky-500/10'
                  )}
                >
                  {kind === 'gain' ? (
                    <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0" />
                  ) : kind === 'injury' ? (
                    <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                  ) : (
                    <Heart className="h-3 w-3 mt-0.5 shrink-0" />
                  )}
                  <span className="leading-snug">{msg}</span>
                </div>
              );
            })}
          </div>
        </Surface>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Sidebar: Analytics & Controls */}
        <aside className="lg:col-span-4 space-y-12">
          <section>
            <SectionDivider label="Institutional Composition" />
            <div className="mt-8">
              <StyleMeterTable />
            </div>
          </section>

          <section>
            <SectionDivider label="Logistics Summary" />
            <div className="mt-8 grid grid-cols-1 gap-4">
              <Surface variant="glass" className="p-6 border-white/5 bg-white/[0.01]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Zap className="h-4 w-4" />
                    <span className="text-[9px] font-black uppercase tracking-widest">
                      Active Drills
                    </span>
                  </div>
                  <span className="text-2xl font-display font-black">{trainingCount}</span>
                </div>
                <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                  Attribute synchronization in progress. Higher Intelligence (WT) increases gain
                  probability.
                </p>
              </Surface>

              <Surface variant="glass" className="p-6 border-white/5 bg-white/[0.01]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-destructive">
                    <Heart className="h-4 w-4" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Med Bay</span>
                  </div>
                  <span className="text-2xl font-display font-black">{recoveryCount}</span>
                </div>
                <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                  Units in active recovery heal injuries 100% faster than natural rest.
                </p>
              </Surface>
            </div>
          </section>
        </aside>

        {/* Main: Personnel Registry */}
        <div className="lg:col-span-8 space-y-8">
          <SectionDivider label={`Personnel Registry [${state.roster.length}]`} variant="primary" />

          {state.roster.length === 0 ? (
            <Surface variant="glass" className="py-24 text-center border-dashed border-white/5">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">
                No personnel detected · Please recruit warriors to commence training
              </p>
              <Button
                variant="link"
                className="mt-4 text-xs uppercase tracking-widest font-black text-primary"
                onClick={() => navigate({ to: '/stable/recruit' })}
              >
                ACCESS_RECRUITMENT_TERMINAL ›
              </Button>
            </Surface>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {state.roster
                .filter((w: Warrior) => w.status === 'Active')
                .map((warrior: Warrior) => (
                  <WarriorTrainingCard
                    key={warrior.id}
                    warrior={warrior}
                    assignment={assignmentMap.get(warrior.id)}
                    seasonalGains={seasonalGainsMap.get(warrior.id) ?? {}}
                    trainers={state.trainers ?? []}
                    onAssign={(attr) => handleAssign(warrior.id, attr)}
                    onAssignRecovery={() => handleAssignRecovery(warrior.id)}
                    onClear={() => handleClear(warrior.id)}
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    </PageFrame>
  );
}
