import React, { useState, useMemo, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Crosshair, Swords, Shield, Flame, AlertTriangle, Timer, Zap, Clock, 
  ChevronDown, Sparkles, Activity, BookOpen, GripVertical, Target
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { 
  FightPlan, PhaseStrategy, OffensiveTactic, DefensiveTactic, Warrior,
  AttackTarget, ProtectTarget 
} from "@/types/game";
import { FightingStyle, STYLE_DISPLAY_NAMES } from "@/types/game";
import { getTempoBonus, getStyleAntiSynergy } from "@/engine/stylePassives";
import { getOffensiveSuitability, getDefensiveSuitability, SUITABILITY_COLORS } from "@/engine/tacticSuitability";
import { STYLE_PRESETS } from "@/engine/stylePresets";

import { computeStrategyScore, getScoreColor } from "@/engine/strategyAnalysis";

/* ── DnD Types & Data ───────────────────────────────────── */

const TACTIC_BANK = [
  { id: "Lunge", type: "offensive", label: "Lunge", icon: Zap },
  { id: "Slash", type: "offensive", label: "Slash", icon: Swords },
  { id: "Bash", type: "offensive", label: "Bash", icon: Shield },
  { id: "Decisiveness", type: "offensive", label: "DEC", icon: Target },
  { id: "Dodge", type: "defensive", label: "Dodge", icon: Activity },
  { id: "Parry", type: "defensive", label: "Parry", icon: Shield },
  { id: "Riposte", type: "defensive", label: "Riposte", icon: Flame },
  { id: "Responsiveness", type: "defensive", label: "RESP", icon: Clock },
];

/* ── Sub-components ─────────────────────────────────────── */

interface PlanBuilderProps {
  plan: FightPlan;
  onPlanChange: (plan: FightPlan) => void;
  warriorName?: string;
  warrior?: Warrior;
}

export default function PlanBuilder({ plan, onPlanChange, warriorName, warrior }: PlanBuilderProps) {
  const [phaseMode, setPhaseMode] = useState<boolean>(!!plan.phases);
  
  const score = useMemo(() => computeStrategyScore(plan, warrior), [plan, warrior]);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
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
      const currentPhase = phases[phaseKey] || { OE: plan.OE, AL: plan.AL, killDesire: plan.killDesire || 5 };
      
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
          
          <div className="text-right">
            <div className={cn("text-3xl font-display font-black tracking-tighter leading-none transition-all", getScoreColor(score))}>
              {score}<span className="text-xs ml-0.5 opacity-50">/100</span>
            </div>
            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mt-1">
              Strategy Score
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-8">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Tactic Bank */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center gap-2 text-arena-gold mb-2">
                <GripVertical className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Tactic Bank</span>
              </div>
              <Droppable droppableId="bank">
                {(provided) => (
                  <div 
                    {...provided.droppableProps} 
                    ref={provided.innerRef}
                    className="flex flex-col gap-2 p-2 bg-black/40 border border-white/5 rounded-none"
                  >
                    {TACTIC_BANK.map((t, index) => (
                      <Draggable key={t.id} draggableId={t.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              "flex items-center gap-3 p-3 text-xs font-bold uppercase tracking-wider border transition-all cursor-grab active:cursor-grabbing",
                              snapshot.isDragging ? "bg-arena-blood border-white text-white z-50" : "bg-white/5 border-white/10 text-muted-foreground hover:border-arena-gold/40 hover:text-foreground"
                            )}
                          >
                            <t.icon className="w-4 h-4 shrink-0" />
                            {t.label}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

            {/* Main Editor */}
            <div className="lg:col-span-3 space-y-8">
              
              {/* Common Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-6 border border-white/5">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-arena-gold">Offensive Effort</Label>
                      <span className="text-sm font-mono font-bold text-arena-gold">{plan.OE}</span>
                    </div>
                    <Slider 
                      value={[plan.OE]} 
                      onValueChange={([v]) => onPlanChange({ ...plan, OE: v })} 
                      min={1} max={10} step={1} 
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-arena-fame">Activity Level</Label>
                      <span className="text-sm font-mono font-bold text-arena-fame">{plan.AL}</span>
                    </div>
                    <Slider 
                      value={[plan.AL]} 
                      onValueChange={([v]) => onPlanChange({ ...plan, AL: v })} 
                      min={1} max={10} step={1} 
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-destructive">Kill Desire</Label>
                      <span className="text-sm font-mono font-bold text-destructive">{plan.killDesire || 5}</span>
                    </div>
                    <Slider 
                      value={[plan.killDesire || 5]} 
                      onValueChange={([v]) => onPlanChange({ ...plan, killDesire: v })} 
                      min={1} max={10} step={1} 
                    />
                  </div>
                  <Droppable droppableId="base">
                    {(provided, snapshot) => (
                      <div 
                        {...provided.droppableProps} 
                        ref={provided.innerRef}
                        className={cn(
                          "min-h-[60px] border-2 border-dashed flex items-center justify-center p-4 transition-colors",
                          snapshot.isDraggingOver ? "bg-arena-gold/10 border-arena-gold/40" : "bg-black/20 border-white/10"
                        )}
                      >
                         <div className="flex gap-2">
                           {plan.offensiveTactic && plan.offensiveTactic !== 'none' && (
                             <Badge className="bg-arena-blood text-white rounded-none uppercase font-black tracking-widest px-3 py-1">
                               {plan.offensiveTactic}
                             </Badge>
                           )}
                           {plan.defensiveTactic && plan.defensiveTactic !== 'none' && (
                             <Badge className="bg-arena-gold text-black rounded-none uppercase font-black tracking-widest px-3 py-1">
                               {plan.defensiveTactic}
                             </Badge>
                           )}
                           {!plan.offensiveTactic && !plan.defensiveTactic && (
                             <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">Drop Tactics Here</span>
                           )}
                         </div>
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>

              {/* Phase Overrides */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Phase Overrides</span>
                  </div>
                  <Switch checked={phaseMode} onCheckedChange={setPhaseMode} />
                </div>

                <AnimatePresence>
                  {phaseMode && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                      {(["opening", "mid", "late"] as const).map(p => (
                        <Droppable key={p} droppableId={p}>
                          {(provided, snapshot) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className={cn(
                                "p-4 border border-white/5 bg-black/40 min-h-[120px] space-y-4 transition-all",
                                snapshot.isDraggingOver ? "border-arena-blood/40 bg-arena-blood/5" : ""
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{p}</span>
                                {plan.phases?.[p] && (
                                  <button 
                                    onClick={() => {
                                      const next = { ...plan.phases };
                                      delete next[p];
                                      onPlanChange({ ...plan, phases: next });
                                    }}
                                    className="text-[9px] font-black uppercase text-arena-blood hover:underline"
                                    aria-label={`Clear phase ${p}`}
                                  >Clear</button>
                                )}
                              </div>
                              
                              <div className="flex flex-wrap gap-1">
                                {plan.phases?.[p]?.offensiveTactic && (
                                  <Badge className="bg-arena-blood/20 text-arena-blood border border-arena-blood/30 text-[9px] uppercase font-black px-1.5 py-0.5">
                                    {plan.phases[p]!.offensiveTactic}
                                  </Badge>
                                )}
                                {plan.phases?.[p]?.defensiveTactic && (
                                  <Badge className="bg-arena-gold/20 text-arena-gold border border-arena-gold/30 text-[9px] uppercase font-black px-1.5 py-0.5">
                                    {plan.phases[p]!.defensiveTactic}
                                  </Badge>
                                )}
                              </div>

                              <div className="space-y-2">
                                <div className="flex justify-between text-[9px] uppercase font-bold text-muted-foreground/60">
                                  <span>OE</span>
                                  <span>{plan.phases?.[p]?.OE ?? plan.OE}</span>
                                </div>
                                <Slider 
                                  value={[plan.phases?.[p]?.OE ?? plan.OE]} 
                                  onValueChange={([v]) => {
                                    const next = { ...(plan.phases || {}) };
                                    next[p] = { ...(next[p] || { OE: plan.OE, AL: plan.AL, killDesire: plan.killDesire || 5 }), OE: v };
                                    onPlanChange({ ...plan, phases: next });
                                  }} 
                                  min={1} max={10} step={1} 
                                />
                              </div>
                            </div>
                          )}
                        </Droppable>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

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
