import React from "react";
import type { TrainerData } from "@/types/game";
import { STYLE_DISPLAY_NAMES } from "@/types/game";
import {
  FOCUS_DESCRIPTIONS,
  FOCUS_ICONS,
  TIER_BONUS,
  type TrainerFocus,
  type TrainerTier,
} from "@/engine/trainers";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Armchair, UserMinus, Sparkles, Clock, Trophy } from "lucide-react";

const TIER_COLORS: Record<string, string> = {
  Novice: "text-muted-foreground",
  Seasoned: "text-arena-pop",
  Master: "text-arena-gold",
};

export default function TrainerCard({
  trainer,
  onFire,
  owned,
}: {
  trainer: TrainerData;
  onFire?: () => void;
  owned: boolean;
}) {
  const icon = FOCUS_ICONS[trainer.focus as TrainerFocus] ?? "📋";
  const tierColor = TIER_COLORS[trainer.tier] ?? "";
  const desc = FOCUS_DESCRIPTIONS[trainer.focus as TrainerFocus] ?? "";
  const bonus = TIER_BONUS[trainer.tier as TrainerTier] ?? 1;

  return (
    <Card className="border-border/40 bg-background shadow-sm hover:border-primary/50 transition-colors">
      <CardContent className="p-0 flex items-stretch">
        <div className="w-1.5 bg-primary/40 shrink-0" />
        <div className="p-4 flex-1">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded bg-secondary/80 border border-border flex items-center justify-center shrink-0 shadow-sm text-2xl">
                {icon}
              </div>
              <div>
                <div className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                  {trainer.name}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <Badge variant="outline" className={`text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 bg-secondary/50 ${tierColor}`}>
                    {trainer.tier} TIER
                  </Badge>
                  <span className="text-border">|</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{trainer.focus} SPECIALIST</span>
                  {trainer.retiredFromWarrior && (
                    <>
                      <span className="text-border">|</span>
                      <Badge variant="outline" className="text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 text-arena-fame border-arena-fame/30 bg-arena-fame/10">
                        <Armchair className="h-2 w-2 mr-1" /> EX-{trainer.retiredFromWarrior.toUpperCase()}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
            {owned && onFire && (
              <Button variant="ghost" size="icon" onClick={onFire} title="Release trainer" className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0">
                <UserMinus className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
             <div className="bg-secondary/5 px-3 py-2 rounded border border-border/20 text-xs text-muted-foreground">
                <span className="text-[9px] uppercase tracking-wider font-bold block mb-1">Focus & Bonus</span>
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <Sparkles className="h-3 w-3 text-primary" /> +{bonus} to {trainer.focus} gains
                </span>
                {trainer.styleBonusStyle && (
                  <span className="flex items-center gap-1.5 font-medium text-arena-gold mt-1">
                     <Trophy className="h-3 w-3" /> +1 for {STYLE_DISPLAY_NAMES[trainer.styleBonusStyle as keyof typeof STYLE_DISPLAY_NAMES] ?? trainer.styleBonusStyle}
                  </span>
                )}
             </div>
             <div className="flex flex-col justify-center">
                 {owned ? (
                     <div className="bg-secondary/5 px-3 py-2 rounded border border-border/20 text-xs flex items-center justify-between">
                         <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">Contract Remaining</span>
                         <span className="font-mono font-bold flex items-center gap-1"><Clock className="h-3 w-3" /> {trainer.contractWeeksLeft} WEEKS</span>
                     </div>
                 ) : (
                     <p className="text-[11px] text-muted-foreground italic leading-tight">{desc}</p>
                 )}
             </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
