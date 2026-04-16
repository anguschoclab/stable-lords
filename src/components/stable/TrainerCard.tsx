import React from "react";
import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/Surface";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { GraduationCap, UserMinus, Sparkles, Clock, Target, Trophy, ChevronRight, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatBattery } from "@/components/ui/StatBattery";
import type { Trainer as TrainerData, TrainerFocus, TrainerTier } from "@/types/state.types";
import { STYLE_DISPLAY_NAMES } from "@/types/shared.types";
import { FOCUS_ICONS, FOCUS_DESCRIPTIONS, TIER_BONUS } from "@/engine/trainers";

const TIER_ACCENTS: Record<string, string> = {
  Novice: "border-border/40 text-muted-foreground",
  Seasoned: "border-stone-500/40 text-stone-300 bg-stone-500/10",
  Master: "border-arena-gold text-arena-gold bg-arena-gold/10 shadow-[0_0_15px_rgba(201,151,42,0.15)]",
};

interface TrainerCardProps {
  trainer: TrainerData;
  onFire?: () => void;
  owned: boolean;
  action?: React.ReactNode;
}

export function TrainerCard({
  trainer,
  onFire,
  owned,
  action,
}: TrainerCardProps) {
  const icon = FOCUS_ICONS[trainer.focus as TrainerFocus] ?? "📋";
  const tierAccent = TIER_ACCENTS[trainer.tier] ?? "";
  const desc = FOCUS_DESCRIPTIONS[trainer.focus as TrainerFocus] ?? "";
  const bonus = TIER_BONUS[trainer.tier as TrainerTier] ?? 1;

  return (
    <Surface
      variant={trainer.tier === "Master" ? "paper" : "glass"}
      padding="none"
      data-testid="trainer-card"
      className={cn(
        "transition-all duration-300 group overflow-hidden border",
        trainer.tier === "Master" ? "border-arena-gold/40 shadow-[0_0_30px_rgba(255,215,0,0.05)]" : "border-white/5 hover:border-white/20"
      )}
    >
      <div className="flex items-stretch min-h-[140px]">
        {/* Tier Indicator Strip */}
        <div className={cn(
          "w-1.5 shrink-0",
          trainer.tier === "Master" ? "bg-arena-gold" :
          trainer.tier === "Seasoned" ? "bg-stone-500" : "bg-neutral-800"
        )} />

        <div className="p-6 flex-1 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              {/* Visual Avatar Container */}
              <div className="relative group-hover:scale-105 transition-transform duration-500">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-16 h-16 rounded-none bg-neutral-900 border border-white/5 flex items-center justify-center relative z-10 shadow-inner text-3xl">
                  {icon}
                </div>
                {trainer.tier === "Master" && (
                  <div className="absolute -top-2 -right-2 bg-arena-gold text-black p-1 rounded-full shadow-[0_0_10px_rgba(255,215,0,0.5)]">
                    <Trophy className="h-3 w-3" />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-display text-xl font-black uppercase tracking-tight text-foreground leading-none">
                    {trainer.name}
                  </h3>
                  {trainer.retiredFromWarrior && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                         <div className="p-1 rounded bg-arena-fame/10 border border-arena-fame/20">
                            <GraduationCap className="h-3 w-3 text-arena-fame" />
                         </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-neutral-950 border-white/10 text-[10px] font-black uppercase tracking-widest">LEGENDARY_VETERAN: {trainer.retiredFromWarrior}</TooltipContent>
                    </Tooltip>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className={cn(
                    "px-2 py-0.5 rounded-none border text-[9px] font-black uppercase tracking-widest",
                    trainer.tier === "Master" ? "bg-arena-gold/20 border-arena-gold/40 text-arena-gold" : "bg-white/5 border-white/10 text-muted-foreground/60"
                  )}>
                    {trainer.tier} CONTRACT
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">
                    <Target className="h-3 w-3" /> {trainer.focus}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {action}
              {owned && onFire && (
                <Tooltip>
                  <TooltipTrigger asChild>
                     <button 
                      onClick={onFire} 
                      aria-label="Release Trainer"
                      className="p-2.5 rounded-none bg-neutral-900 border border-white/5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all group/fire"
                    >
                      <UserMinus className="h-4 w-4 group-hover/fire:scale-110 transition-transform" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="bg-destructive text-white border-none font-black text-[10px] tracking-widest">TERMINATE_CONTRACT</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>

          {/* Performance & Status Footer */}
          <div className="mt-6 flex items-center justify-between gap-6">
            <div className="flex-1 flex items-center gap-4">
               <div className="flex-1 bg-black/40 rounded-none border border-white/5 p-3 flex items-center justify-between group/intel">
                  <div className="flex items-center gap-3">
                     <div className="p-1.5 rounded bg-primary/10 border border-primary/20">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                     </div>
                     <div>
                        <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest block leading-none mb-1">Impact Bonus</span>
                        <span className="text-[11px] font-black text-primary uppercase tracking-tight">+{bonus} {trainer.focus} GRC</span>
                     </div>
                  </div>
                  {trainer.styleBonusStyle && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-right border-l border-white/10 pl-4 cursor-help">
                           <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest block leading-none mb-1">Style Affinity</span>
                           <span className="text-[10px] font-black text-arena-gold uppercase tracking-widest">
                              {STYLE_DISPLAY_NAMES[trainer.styleBonusStyle as keyof typeof STYLE_DISPLAY_NAMES] ?? trainer.styleBonusStyle}
                           </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs text-[10px]">
                        +5% gain chance for {STYLE_DISPLAY_NAMES[trainer.styleBonusStyle as keyof typeof STYLE_DISPLAY_NAMES] ?? trainer.styleBonusStyle} warriors during training sessions
                      </TooltipContent>
                    </Tooltip>
                  )}
               </div>
            </div>

            <div className="shrink-0 w-48">
               {owned ? (
                 <div className="bg-neutral-900 rounded-none border border-white/5 p-3 transition-all">
                    <StatBattery
                      label="TNR"
                      value={Math.min(100, (trainer.contractWeeksLeft / 24) * 100)}
                      max={100}
                      labelValue={`${trainer.contractWeeksLeft}W`}
                      colorClass={trainer.contractWeeksLeft < 4 ? "bg-destructive" : "bg-primary/40"}
                    />
                 </div>
               ) : (
                 <div className="flex flex-col gap-1 px-4">
                    <div className="flex items-center gap-2 text-primary/60">
                       <Briefcase className="h-3 w-3" />
                       <span className="text-[9px] font-black uppercase tracking-widest leading-none">Job Summary</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground/60 italic leading-tight line-clamp-2">
                       {desc}
                    </p>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </Surface>
  );
}
