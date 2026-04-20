import React, { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useGameStore, useWorldState, type GameStore } from "@/state/useGameStore";
import { useShallow } from 'zustand/react/shallow';
import {
  ATTRIBUTE_LABELS,
  type TrainingAssignment, type Attributes,
} from "@/types/game";
import type { Warrior } from "@/types/state.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dumbbell, Heart, Activity, Target, Zap } from "lucide-react";
import { toast } from "sonner";
import { WarriorTrainingCard } from "@/components/training/WarriorTrainingCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Surface } from "@/components/ui/Surface";
import { StyleMeterTable } from "@/components/charts/StyleMeterTable";

export default function Training() {
  const navigate = useNavigate();
  const state = useWorldState();
  const { setState } = useGameStore();

  const assignmentMap = useMemo(() => {
    const map = new Map<string, TrainingAssignment>();
    for (const a of (state.trainingAssignments ?? [])) map.set(a.warriorId, a);
    return map;
  }, [state.trainingAssignments]);

  const seasonalGainsMap = useMemo(() => {
    const map = new Map<string, Partial<Record<keyof Attributes, number>>>();
    for (const sg of (state.seasonalGrowth ?? [])) {
      if (sg.season === state.season) {
        map.set(sg.warriorId, sg.gains);
      }
    }
    return map;
  }, [state.seasonalGrowth, state.season]);

  const assignments = state.trainingAssignments ?? [];

  const handleAssign = (warriorId: string, attribute: keyof Attributes) => {
    if (attribute === "SZ") return;
    const warrior = state.roster.find((w: Warrior) => w.id === warriorId);
    setState((s: GameStore) => {
      s.trainingAssignments = [
        ...(s.trainingAssignments ?? []).filter((a: TrainingAssignment) => a.warriorId !== warriorId),
        { warriorId, type: "attribute", attribute },
      ];
    });
    toast.success(`${warrior?.name} assigned to train ${ATTRIBUTE_LABELS[attribute]}`);
  };

  const handleAssignRecovery = (warriorId: string) => {
    const warrior = state.roster.find((w: Warrior) => w.id === warriorId);
    setState((s: GameStore) => {
      s.trainingAssignments = [
        ...(s.trainingAssignments ?? []).filter((a: TrainingAssignment) => a.warriorId !== warriorId),
        { warriorId, type: "recovery" },
      ];
    });
    toast.success(`${warrior?.name} assigned to active recovery`);
  };

  const handleClear = (warriorId: string) => {
    setState((s: GameStore) => {
      s.trainingAssignments = (s.trainingAssignments ?? []).filter((a: TrainingAssignment) => a.warriorId !== warriorId);
    });
  };

  const handleClearAll = () => {
    setState((s: GameStore) => { s.trainingAssignments = []; });
    toast("All training assignments cleared.");
  };

  const assignedCount = assignments.length;
  const recoveryCount = assignments.filter((a: TrainingAssignment) => a.type === "recovery").length;
  const trainingCount = assignedCount - recoveryCount;

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-20">
      <PageHeader 
        title="Training Grounds"
        subtitle="ACADEMY // REGIMEN_CONTROL // POTENTIAL_UNLEASHED"
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
                RESET_ALL
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12 items-start">
        <div className="lg:col-span-1">
          <StyleMeterTable />
        </div>
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
         <Surface variant="glass" className="p-6 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-primary">
              <Zap className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Active_Drills</span>
            </div>
            <div className="text-3xl font-display font-black tracking-tighter">{trainingCount}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Warriors pursuing growth</div>
         </Surface>
         <Surface variant="glass" className="p-6 flex flex-col gap-2 border-l-destructive/20">
            <div className="flex items-center gap-2 text-destructive">
              <Heart className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Medical_Bay</span>
            </div>
            <div className="text-3xl font-display font-black tracking-tighter">{recoveryCount}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Warriors in active healing</div>
         </Surface>
         <Surface variant="glass" className="p-6 flex flex-col gap-2 opacity-60">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Target className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Reserve_Pool</span>
            </div>
            <div className="text-3xl font-display font-black tracking-tighter">{state.roster.length - assignedCount}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Idle personnel available</div>
         </Surface>
        </div>
      </div>

      {state.roster.length === 0 ? (
        <Surface variant="glass" className="py-24 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">
            // NO_PERSONNEL_DETECTED // PLEASE_RECRUIT_WARRIORS_TO_COMMENCE_TRAINING
          </p>
          <Button variant="link" className="mt-4 text-xs uppercase tracking-widest font-black" onClick={() => navigate({ to: '/stable/recruit' })}>
            Go to Recruitments
          </Button>
        </Surface>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {state.roster.filter((w: Warrior) => w.status === "Active").map((warrior: Warrior) => (
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
