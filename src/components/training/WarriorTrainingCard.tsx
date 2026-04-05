import {
  ATTRIBUTE_KEYS, ATTRIBUTE_LABELS, STYLE_DISPLAY_NAMES,
  type Warrior, type TrainingAssignment, type Attributes,
} from "@/types/game";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, X, Heart, AlertTriangle, Lock, Zap, Gauge, ArrowUpRight } from "lucide-react";
import { computeGainChance } from "@/engine/training";
import { WarriorNameTag } from "@/components/ui/WarriorBadges";
import { Surface } from "@/components/ui/Surface";
import { cn } from "@/lib/utils";

export function WarriorTrainingCard({ warrior, assignment, seasonalGains, trainers, onAssign, onAssignRecovery, onClear }: {
  warrior: Warrior;
  assignment?: TrainingAssignment;
  seasonalGains: Partial<Record<keyof Attributes, number>>;
  trainers: import("@/types/game").Trainer[];
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
    <Surface variant="glass" className="overflow-hidden flex flex-col group h-full">
      {/* Header Section */}
      <div className="p-4 bg-white/5 border-b border-white/5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <WarriorNameTag id={warrior.id} name={warrior.name} isChampion={warrior.champion} />
            <div className="flex items-center gap-2 opacity-60">
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{STYLE_DISPLAY_NAMES[warrior.style]}</span>
                <div className="h-2 w-px bg-white/20" />
                <span className="text-[10px] font-mono tracking-wider">AGE_{warrior.age}</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1.5">
            {hasInjury && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-destructive/20 text-destructive px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-widest flex items-center gap-1 border border-destructive/20 animate-pulse cursor-help">
                     <AlertTriangle className="h-2.5 w-2.5" /> INJURED
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="text-[10px] font-mono bg-neutral-900 border-white/10 uppercase tracking-widest">
                  {warrior.injuries.map(i => typeof i === "string" ? i : i.name).join(" // ")}
                </TooltipContent>
              </Tooltip>
            )}
            <div className="text-[10px] font-mono opacity-40">Σ_{total}/80</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 flex-1 space-y-4">
        {/* Special Action: Recovery */}
        {hasInjury && !isTraining && (
          <Button
            variant="outline"
            onClick={isRecovery ? onClear : onAssignRecovery}
            className={cn(
              "w-full h-10 gap-2 border-white/5 transition-all text-[10px] font-black uppercase tracking-[0.2em]",
              isRecovery 
                ? "bg-destructive/20 text-white border-destructive/40 shadow-[0_0_15px_-5px_rgba(239,68,68,0.4)]" 
                : "bg-white/5 hover:bg-white/10"
            )}
          >
            <Heart className={cn("h-3.5 w-3.5", isRecovery ? "text-white" : "text-destructive")} />
            {isRecovery ? "CANCEL_RECOVERY" : "ACTIVE_RECOVERY"}
          </Button>
        )}

        {/* Attribute List */}
        {!isRecovery && (
          <div className="space-y-1">
            {ATTRIBUTE_KEYS.map((key) => {
              const val = warrior.attributes[key];
              const isSelected = isTraining && assignment?.attribute === key;
              const maxed = val >= 25;
              const isSZ = key === "SZ";
              const seasonCapped = (seasonalGains[key] ?? 0) >= 3;
              const disabled = !!assignment || maxed || atCap || isSZ || seasonCapped;

              const chance = (!isSZ && !maxed && !atCap && !seasonCapped)
                ? Math.round(computeGainChance(warrior, key, trainers) * 100)
                : 0;

              const isRevealed = !!warrior.potentialRevealed?.[key];
              const potVal = warrior.potential?.[key] ?? 25;
              const nearCeiling = isRevealed && val >= potVal;

              return (
                <Tooltip key={key}>
                  <TooltipTrigger asChild>
                    <button
                      disabled={disabled}
                      onClick={() => onAssign(key)}
                      className={cn(
                        "group/row relative w-full flex items-center gap-3 px-3 py-2 rounded-md border text-left transition-all",
                        isSelected 
                          ? "bg-primary/20 border-primary shadow-[0_0_15px_-5px_rgba(34,197,94,0.4)]" 
                          : disabled
                          ? "bg-white/[0.02] border-white/5 opacity-40 cursor-not-allowed"
                          : "bg-white/[0.03] border-white/5 hover:border-white/20 hover:bg-white/[0.08]"
                      )}
                      aria-label={`Assign ${ATTRIBUTE_LABELS[key]} training for ${warrior.name}`}
                    >
                      {/* Label & Value */}
                      <div className="w-16 shrink-0">
                        <div className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                          {isSZ && <Lock className="h-2.5 w-2.5 opacity-40" />}
                          {key}
                        </div>
                        <div className="text-[10px] font-mono opacity-60">
                           {val}<span className="opacity-40">/</span>{isRevealed ? potVal : "??"}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="flex-1 relative">
                        <Progress 
                          value={(val / 25) * 100} 
                          className="h-1 bg-white/5" 
                        />
                        {isRevealed && (
                          <div 
                            className="absolute top-0 bottom-0 w-px bg-white/20 z-10" 
                            style={{ left: `${(potVal / 25) * 100}%` }} 
                            title="Potential Ceiling"
                          />
                        )}
                      </div>

                      {/* Metrics & Status */}
                      <div className="w-12 text-right">
                        {isSelected ? (
                          <Check className="h-3.5 w-3.5 text-primary float-right drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                        ) : maxed ? (
                          <div className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">MAX</div>
                        ) : seasonCapped ? (
                          <div className="text-[8px] font-black text-arena-gold uppercase tracking-widest">3/3</div>
                        ) : !disabled ? (
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-[10px] font-mono font-bold text-primary/80">{chance}%</span>
                            <ArrowUpRight className="h-2.5 w-2.5 opacity-40 group-hover/row:opacity-100 transition-opacity" />
                          </div>
                        ) : null}
                      </div>

                      {/* Overlay for "Near Ceiling" */}
                      {nearCeiling && (
                        <div className="absolute inset-0 bg-arena-gold/5 pointer-events-none rounded-md border border-arena-gold/10" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-neutral-950 border-white/10 p-3 space-y-2 w-full max-w-[220px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">{ATTRIBUTE_LABELS[key]}</span>
                      {chance > 0 && <Badge variant="outline" className="h-4 text-[8px] font-mono bg-primary/10 border-primary/20 text-primary">{chance}% CHANCE</Badge>}
                    </div>
                    <div className="space-y-1">
                      {isSZ ? (
                        <p className="text-[9px] leading-relaxed opacity-60 italic">Physiological constants are immutable. Size remains fixed after recruitment.</p>
                      ) : maxed ? (
                        <p className="text-[9px] leading-relaxed text-primary italic">Absolute peak performance reached. No further gains possible.</p>
                      ) : seasonCapped ? (
                        <p className="text-[9px] leading-relaxed text-arena-gold italic">Metabolic fatigue detected. Warrior requires end-of-season recalibration to resume growth.</p>
                      ) : (
                        <p className="text-[9px] leading-relaxed opacity-60">
                          {isSelected ? `Assigned to focus on ${ATTRIBUTE_LABELS[key]}. Progress roll executes at week end.` : `Click to prioritize ${key} training this week.`}
                          {isRevealed && val < potVal && " Significant growth room identified before metabolic ceiling."}
                          {nearCeiling && " Approaching genetic potential threshold. Diminishing returns in effect."}
                        </p>
                      )}
                    </div>
                    {chance > 0 && (
                       <div className="pt-1 border-t border-white/5 flex items-center gap-1 opacity-40">
                          <Zap className="h-2.5 w-2.5" />
                          <span className="text-[8px] uppercase tracking-widest">Trainer bonuses active</span>
                       </div>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Section */}
      {assignment && (
        <div className="p-4 bg-white/5 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="h-3.5 w-3.5 text-primary opacity-60" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                {isRecovery ? "REST_MODE" : `CORE_DRILL: ${assignment.attribute}`}
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClear} 
              className="h-8 group-hover:bg-destructive/10 group-hover:text-destructive text-[10px] font-black tracking-widest uppercase"
            >
              <X className="h-3 w-3 mr-1.5" /> TERMINATE
            </Button>
        </div>
      )}
    </Surface>
  );
}
