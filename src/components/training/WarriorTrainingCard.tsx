import {
  ATTRIBUTE_KEYS, ATTRIBUTE_LABELS, STYLE_DISPLAY_NAMES,
  type Warrior, type TrainingAssignment, type Attributes,
} from "@/types/game";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, X, Trophy, Heart, AlertTriangle, Lock } from "lucide-react";
import { computeGainChance } from "@/engine/training";
import { WarriorNameTag } from "@/components/ui/WarriorBadges";

export function WarriorTrainingCard({ warrior, assignment, seasonalGains, trainers, onAssign, onAssignRecovery, onClear }: {
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
              <WarriorNameTag id={warrior.id} name={warrior.name} isChampion={warrior.champion} />
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
                ? "border-destructive bg-destructive/20 text-foreground glow-neon-red"
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
            {isRecovery && <Check className="h-3.5 w-3.5 text-destructive drop-shadow-[0_0_5px_hsl(var(--destructive))]" />}
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

              const isRevealed = !!warrior.potentialRevealed?.[key];
              const potVal = warrior.potential?.[key] ?? 25;
              const displayVal = isRevealed ? `${val}/${potVal}` : `${val}/???`;

              return (
                <TooltipProvider key={key} delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        disabled={disabled}
                        onClick={() => onAssign(key)}
                        className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left transition-colors border ${
                          isSelected
                            ? "border-primary bg-primary/20 text-foreground glow-neon-green"
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
                          <Progress value={(val / 25) * 100} className="h-1.5 [&>div]:bg-accent [&>div]:shadow-[0_0_8px_hsl(var(--accent))]" />
                        </div>
                        <span className="text-[11px] font-mono w-10 text-right whitespace-nowrap">{displayVal}</span>
                        {!disabled && !isSelected && (
                          <span className="text-[9px] text-muted-foreground w-8 text-right">{chance}%</span>
                        )}
                        {isSelected && <Check className="h-3.5 w-3.5 text-primary drop-shadow-[0_0_5px_hsl(var(--primary))]" />}
                        {maxed && <span className="text-[10px] text-muted-foreground ml-1">MAX</span>}
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
