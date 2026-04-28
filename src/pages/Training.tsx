import { useMemo, useState } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { useGameStore, useWorldState, type GameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { ATTRIBUTE_LABELS, type TrainingAssignment, type Attributes } from '@/types/game';
import type { Warrior } from '@/types/state.types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dumbbell,
  Heart,
  Activity,
  Target,
  Zap,
  TrendingUp,
  AlertTriangle,
  X,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { WarriorTrainingCard } from '@/components/training/WarriorTrainingCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { Surface } from '@/components/ui/Surface';
import { StyleMeterTable } from '@/components/charts/StyleMeterTable';

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
    <div className="space-y-12 max-w-7xl mx-auto pb-20">
      <PageHeader
        title="Training Grounds"
        subtitle="COMMAND · TRAINING · POTENTIAL UNLEASHED"
        icon={Dumbbell}
        actions={
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
              <div className="flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-primary" />
                <span>LOAD: {Math.round((trainingCount / (state.roster.length || 1)) * 100)}%</span>
              </div>
              <div className="h-3 w-px bg-border/40" />
              <div className="flex items-center gap-1.5">
                <Heart className="h-3 w-3 text-destructive" />
                <span>RECOV: {recoveryCount}</span>
              </div>
            </div>
            {assignedCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="h-8 text-[10px] font-black tracking-widest uppercase border-white/5 bg-white/5 hover:bg-white/10"
              >
                RESET ALL
              </Button>
            )}
          </div>
        }
      />

      {/* Weekly Training Results Banner */}
      {showReport && (
        <Surface variant="glass" className="border-primary/20 overflow-hidden -mt-6">
          <div className="flex items-center justify-between px-5 py-3 bg-primary/10 border-b border-primary/10">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
              <TrendingUp className="h-3.5 w-3.5" />
              Last Week — Training Report
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
                    'flex items-start gap-2 px-3 py-2 rounded text-[11px]',
                    kind === 'gain' && 'bg-primary/10 text-primary',
                    kind === 'injury' && 'bg-arena-gold/10 text-arena-gold',
                    kind === 'recovery' && 'bg-sky-500/10 text-sky-300'
                  )}
                >
                  {kind === 'gain' ? (
                    <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  ) : kind === 'injury' ? (
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  ) : (
                    <Heart className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  )}
                  <span className="leading-snug">{msg}</span>
                </div>
              );
            })}
          </div>
        </Surface>
      )}

      {/* Training Tab Bar */}
      <div className="flex items-center border-b border-white/5 -mt-8">
        <Link
          to="/command/training"
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 text-[11px] font-black uppercase tracking-wider border-b-2 -mb-px transition-colors',
            'text-foreground border-primary'
          )}
        >
          <Dumbbell className="h-3.5 w-3.5 text-primary" />
          Assignments
        </Link>
        <Link
          to="/command/tactics"
          className="flex items-center gap-2 px-5 py-2.5 text-[11px] font-black uppercase tracking-wider border-b-2 border-transparent -mb-px text-muted-foreground/50 hover:text-foreground transition-colors"
        >
          <Target className="h-3.5 w-3.5" />
          Planning
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12 items-start">
        <div className="lg:col-span-1">
          <StyleMeterTable />
        </div>
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Surface variant="glass" className="p-6 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-primary">
              <Zap className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Active Drills
              </span>
            </div>
            <div className="text-3xl font-display font-black tracking-tighter">{trainingCount}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Warriors pursuing growth
            </div>
            <div className="text-[10px] text-muted-foreground/60 normal-case tracking-normal leading-snug mt-1">
              Gain attribute points each week. Assign a trainer to improve ST, WT, SP, or DF.
            </div>
          </Surface>
          <Surface variant="glass" className="p-6 flex flex-col gap-2 border-l-destructive/20">
            <div className="flex items-center gap-2 text-destructive">
              <Heart className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Medical Bay</span>
            </div>
            <div className="text-3xl font-display font-black tracking-tighter">{recoveryCount}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Warriors in active healing
            </div>
            <div className="text-[10px] text-muted-foreground/60 normal-case tracking-normal leading-snug mt-1">
              Recover fatigue faster between bouts. High fatigue reduces combat performance.
            </div>
          </Surface>
          <Surface variant="glass" className="p-6 flex flex-col gap-2 opacity-60">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Target className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Reserve Pool</span>
            </div>
            <div className="text-3xl font-display font-black tracking-tighter">
              {state.roster.length - assignedCount}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Idle personnel available
            </div>
            <div className="text-[10px] text-muted-foreground/60 normal-case tracking-normal leading-snug mt-1">
              Unassigned warriors. Use the cards below to assign them to drills or recovery.
            </div>
          </Surface>
        </div>
      </div>

      {state.roster.length === 0 ? (
        <Surface variant="glass" className="py-24 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">
            No personnel detected · Please recruit warriors to commence training
          </p>
          <Button
            variant="link"
            className="mt-4 text-xs uppercase tracking-widest font-black"
            onClick={() => navigate({ to: '/stable/recruit' })}
          >
            Go to Recruitments
          </Button>
        </Surface>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
  );
}
