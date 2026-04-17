import { useMemo } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FightPlan, Warrior, OffensiveTactic, DefensiveTactic } from "@/types/game";
import { FightingStyle, STYLE_DISPLAY_NAMES } from "@/types/game";
import { getMatchupBonus } from "@/engine/combat/mechanics/combatConstants";
import { computeStrategyScore, getScoreColor } from "@/engine/strategyAnalysis";
import { TACTIC_BANK } from "./planBuilder/TacticBank";
import TacticBank from "./planBuilder/TacticBank";
import CommonControls from "./planBuilder/CommonControls";
import SpatialControls from "./planBuilder/SpatialControls";
import PhaseOverrides from "./planBuilder/PhaseOverrides";
import StylePassives from "./planBuilder/StylePassives";
import ContingencyPlans from "./planBuilder/ContingencyPlans";

/* ── Sub-components ─────────────────────────────────────── */

interface PlanBuilderProps {
  plan: FightPlan;
  onPlanChange: (plan: FightPlan) => void;
  warrior?: Warrior;
  rivalStyle?: FightingStyle;
}

export default function PlanBuilder({ plan, onPlanChange, warrior, rivalStyle }: PlanBuilderProps) {
  const matchupAdv = useMemo(() => {
    if (!rivalStyle) return 0;
    return getMatchupBonus(plan.style, rivalStyle);
  }, [plan.style, rivalStyle]);

  const score = useMemo(() => computeStrategyScore(plan, warrior), [plan, warrior]);

  const onDragEnd = (result: DropResult) => {
    const { destination, draggableId } = result;
    if (!destination) return;

    const tactic = TACTIC_BANK.find(t => t.id === draggableId);
    if (!tactic) return;

    const phaseKey = destination.droppableId as "opening" | "mid" | "late" | "base";
    
    if (phaseKey === "base") {
      if (tactic.type === "offensive") {
        onPlanChange({ ...plan, offensiveTactic: tactic.id as OffensiveTactic });
      } else {
        onPlanChange({ ...plan, defensiveTactic: tactic.id as DefensiveTactic });
      }
    } else {
      const phases = { ...(plan.phases || {}) };
      const currentPhase = phases[phaseKey] || { OE: plan.OE, AL: plan.AL ?? 5, killDesire: plan.killDesire ?? 5 };
      
      if (tactic.type === "offensive") {
        phases[phaseKey] = { ...currentPhase, offensiveTactic: tactic.id as OffensiveTactic };
      } else {
        phases[phaseKey] = { ...currentPhase, defensiveTactic: tactic.id as DefensiveTactic };
      }
      onPlanChange({ ...plan, phases });
    }
  };

  return (
    <Card className="bg-[#0a0a0b] border-arena-blood/20 shadow-2xl relative overflow-hidden">
      {/* Decorative pulse */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-arena-blood/5 blur-[80px] rounded-full -mr-16 -mt-16" />
      
      <CardHeader className="pb-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="font-display text-xl font-black italic uppercase tracking-tighter text-arena-blood">
              Battle Strategy
            </CardTitle>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
              {STYLE_DISPLAY_NAMES[plan.style]} · Engineering
            </p>
          </div>
          
          <div className="text-right flex items-center gap-6">
            {matchupAdv !== 0 && (
              <div className="text-right">
                <Badge className={cn(
                  "rounded-none border-none font-black text-[10px] tracking-tight px-1.5 py-0.5",
                  matchupAdv > 0 ? "bg-green-500/20 text-green-500" : "bg-destructive/20 text-destructive"
                )}>
                  {matchupAdv > 0 ? "MATCHUP_ADV" : "MATCHUP_PENALTY"}
                </Badge>
                <div className={cn("text-lg font-mono font-black italic", matchupAdv > 0 ? "text-green-500" : "text-destructive")}>
                  {matchupAdv > 0 ? "+" : ""}{matchupAdv}
                </div>
              </div>
            )}

            <div className="text-right">
              <div className={cn("text-3xl font-display font-black tracking-tighter leading-none transition-all", getScoreColor(score))}>
                {score}<span className="text-xs ml-0.5 opacity-50">/100</span>
              </div>
              <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mt-1">
                Strategy Score
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-8">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <TacticBank />
            </div>

            <div className="lg:col-span-3 space-y-8">
              <CommonControls plan={plan} onPlanChange={onPlanChange} />
              <SpatialControls plan={plan} warrior={warrior} onPlanChange={onPlanChange} />
              <PhaseOverrides plan={plan} onPlanChange={onPlanChange} />
              <StylePassives plan={plan} warrior={warrior} />
              <ContingencyPlans plan={plan} onPlanChange={onPlanChange} />
            </div>
          </div>
        </DragDropContext>

        <div className="pt-6 border-t border-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">
          <span>Simulation Accuracy: 94.2%</span>
          <span>Targeting: Optimized for {plan.target || "Any"}</span>
        </div>
      </CardContent>
    </Card>
  );
}
