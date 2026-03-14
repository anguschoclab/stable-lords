import React, { useMemo } from "react";
import { useGame } from "@/state/GameContext";
import {
  ATTRIBUTE_KEYS, ATTRIBUTE_LABELS, STYLE_DISPLAY_NAMES,
  type Warrior, type TrainingAssignment, type Attributes,
} from "@/types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dumbbell, Check, X, Trophy, Heart, AlertTriangle, Lock } from "lucide-react";
import { toast } from "sonner";
import { computeGainChance } from "@/engine/training";
import { WarriorLink } from "@/components/EntityLink";

function WarriorTrainingCard({ warrior, assignment, seasonalGains, trainers, onAssign, onAssignRecovery, onClear }: {
  warrior: Warrior;
  assignment?: TrainingAssignment;
  seasonalGains: Partial<Record<keyof Attributes, number>>;
  trainers: any[];
  onAssign: (attr: keyof Attributes) => void;
  onAssignRecovery: () => void;
  onClear: () => void;
}) {
  const total = ATTRIBUTE_KEYS.reduce((sum, k) => sum + warrior.attributes[k], 0);
  const atCap = total >= 80;
  const hasInjury = warrior.injuries.length > 0;
  const isRecovery = assignment?.type === "recovery";
  const isTraining = assignment?.type === "attribute";

  return (
    <Card className="overflow-hidden border-border/40 bg-background shadow-sm hover:border-primary/50 transition-colors flex flex-col">
      <CardHeader className="pb-3 border-b border-border/20 bg-secondary/10 px-4 py-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 font-display text-sm font-bold text-foreground">
              <WarriorLink name={warrior.name} id={warrior.id}>{warrior.name}</WarriorLink>
              {warrior.champion && <Trophy className="h-3 w-3 text-arena-gold" />}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-muted-foreground">
                <span className="text-[10px] font-bold uppercase tracking-wider">{STYLE_DISPLAY_NAMES[warrior.style]}</span>
                <span className="text-border/60">|</span>
                <span className="text-[10px] font-mono">AGE {warrior.age}</span>
            </div>
          </div>
          {hasInjury && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger>
                  <div className="bg-destructive/10 text-destructive px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-destructive/20 shadow-sm">
                     <AlertTriangle className="h-3 w-3" /> Injured
                  </div>
                </TooltipTrigger>
                <TooltipContent className="text-xs max-w-xs font-mono">
                  {warrior.injuries.map(i => typeof i === "string" ? i : i.name).join(", ")}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-4 bg-secondary/5 flex-1">
        {atCap && !assignment && (
          <p className="text-xs text-muted-foreground italic">Attribute cap reached (80). No further training possible.</p>
        )}

        {/* Recovery option */}
        {hasInjury && !isTraining && (
          <button
            onClick={isRecovery ? onClear : onAssignRecovery}
            className={`w-full flex items-center gap-2 rounded-md px-2.5 py-2 text-left transition-colors border ${
              isRecovery
                ? "border-arena-pop bg-arena-pop/10 text-foreground"
                : "border-border hover:border-arena-pop/50 hover:bg-secondary/50 cursor-pointer"
            }`}
          >
            <Heart className="h-3.5 w-3.5 text-arena-pop" />
            <div className="flex-1">
              <span className="text-xs font-medium">Active Recovery</span>
              <span className="text-[10px] text-muted-foreground ml-1.5">
                — accelerated healing, no risk
              </span>
            </div>
            {isRecovery && <Check className="h-3.5 w-3.5 text-arena-pop" />}
          </button>
        )}

        {/* Attribute grid */}
        {!isRecovery && (
          <div className="grid grid-cols-1 gap-1.5">
            {ATTRIBUTE_KEYS.map((key) => {
              const val = warrior.attributes[key];
              const isSelected = isTraining && assignment?.attribute === key;
              const maxed = val >= 25;
              const isSZ = key === "SZ";
              const seasonCapped = (seasonalGains[key] ?? 0) >= 3;
              const disabled = !!assignment || maxed || atCap || isSZ || seasonCapped;

              // Gain chance preview
              const chance = (!isSZ && !maxed && !atCap && !seasonCapped)
                ? Math.round(computeGainChance(warrior, key, trainers) * 100)
                : 0;

              return (
                <TooltipProvider key={key} delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        disabled={disabled}
                        onClick={() => onAssign(key)}
                        className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left transition-colors border ${
                          isSelected
                            ? "border-primary bg-primary/10 text-foreground"
                            : disabled
                            ? "border-border bg-muted/30 text-muted-foreground cursor-not-allowed"
                            : "border-border hover:border-primary/50 hover:bg-secondary/50 cursor-pointer"
                        }`}
                      >
                        <span className="text-xs w-20 font-medium flex items-center gap-1">
                          {isSZ && <Lock className="h-2.5 w-2.5" />}
                          {ATTRIBUTE_LABELS[key]}
                        </span>
                        <div className="flex-1">
                          <Progress value={(val / 25) * 100} className="h-1.5" />
                        </div>
                        <span className="text-xs font-mono w-5 text-right">{val}</span>
                        {!disabled && !isSelected && (
                          <span className="text-[9px] text-muted-foreground w-8 text-right">{chance}%</span>
                        )}
                        {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                        {maxed && <span className="text-[10px] text-muted-foreground">MAX</span>}
                        {seasonCapped && !maxed && !isSZ && (
                          <span className="text-[9px] text-arena-gold">3/3</span>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="text-xs max-w-[200px]">
                      {isSZ ? "Size cannot be trained — fixed at creation." :
                       maxed ? "Already at maximum (25)." :
                       seasonCapped ? `Seasonal cap reached (${ATTRIBUTE_LABELS[key]} gained 3 this season).` :
                       `${chance}% chance to gain +1. Season: ${seasonalGains[key] ?? 0}/3`}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        )}

        {/* Status bar */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-muted-foreground font-mono">
            Total: {total}/80
          </span>
          {assignment ? (
            <Button variant="ghost" size="sm" onClick={onClear} className="h-7 gap-1 text-xs text-muted-foreground hover:text-destructive">
              <X className="h-3 w-3" /> Clear
            </Button>
          ) : (
            <span className="text-[11px] text-muted-foreground">
              {atCap ? "" : "Click an attribute to train"}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Training() {
  const { state, setState } = useGame();

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
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5" />
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
