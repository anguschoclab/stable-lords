import React, { useMemo } from "react";
import { useGameStore } from "@/state/useGameStore";
import { useShallow } from 'zustand/react/shallow';
import {
  ATTRIBUTE_LABELS,
  type TrainingAssignment, type Attributes,
} from "@/types/game";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dumbbell, Heart } from "lucide-react";
import { toast } from "sonner";
import { WarriorTrainingCard } from "@/components/training/WarriorTrainingCard";

export default function Training() {
  const { state, setState } = useGameStore(
    useShallow((s) => ({ state: s.state, setState: s.setState }))
  );

  const assignmentMap = useMemo(() => {
    const map = new Map<string, TrainingAssignment>();
    for (const a of (state.trainingAssignments ?? [])) map.set(a.warriorId, a);
    return map;
  }, [state.trainingAssignments]);

  // Seasonal growth lookup
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
    const warrior = state.roster.find(w => w.id === warriorId);
    const next: TrainingAssignment[] = [
      ...assignments.filter(a => a.warriorId !== warriorId),
      { warriorId, type: "attribute", attribute },
    ];
    setState({ ...state, trainingAssignments: next });
    toast.success(`${warrior?.name} assigned to train ${ATTRIBUTE_LABELS[attribute]}`);
  };

  const handleAssignRecovery = (warriorId: string) => {
    const warrior = state.roster.find(w => w.id === warriorId);
    const next: TrainingAssignment[] = [
      ...assignments.filter(a => a.warriorId !== warriorId),
      { warriorId, type: "recovery" },
    ];
    setState({ ...state, trainingAssignments: next });
    toast.success(`${warrior?.name} assigned to active recovery`);
  };

  const handleClear = (warriorId: string) => {
    const next = assignments.filter(a => a.warriorId !== warriorId);
    setState({ ...state, trainingAssignments: next });
  };

  const handleClearAll = () => {
    setState({ ...state, trainingAssignments: [] });
    toast("All training assignments cleared.");
  };

  const assignedCount = assignments.length;
  const recoveryCount = assignments.filter(a => a.type === "recovery").length;
  const trainingCount = assignedCount - recoveryCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-secondary via-card to-secondary p-6 sm:p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 glow-neon-blue rounded-xl mix-blend-overlay" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-wide">Training Grounds</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-xl">
            Assign warriors to train attributes or recover from injuries. Training has a chance to improve stats each week, 
            modified by trainers, wit, and age. <span className="text-foreground/70">Size cannot be trained.</span> Each attribute 
            can gain at most <span className="text-foreground font-medium">3 points per season</span>.
          </p>
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            <Badge variant="outline" className="gap-1">
              <Dumbbell className="h-3 w-3" /> {trainingCount} training
            </Badge>
            {recoveryCount > 0 && (
              <Badge variant="outline" className="gap-1 text-arena-pop border-arena-pop/30">
                <Heart className="h-3 w-3" /> {recoveryCount} recovering
              </Badge>
            )}
            <Badge variant="outline" className="text-muted-foreground">
              {state.roster.length - assignedCount} idle
            </Badge>
            {assignedCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-xs text-muted-foreground">
                Clear all
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Warrior Cards */}
      {state.roster.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No warriors in your stable. Recruit some first!
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {state.roster.reduce<React.ReactNode[]>((acc, warrior) => {
            if (warrior.status === "Active") {
              acc.push(
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
              );
            }
            return acc;
          }, [])}
        </div>
      )}
    </div>
  );
}
