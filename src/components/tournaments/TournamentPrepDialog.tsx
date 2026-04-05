import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, Trophy, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { WarriorNameTag, StatBadge } from "@/components/ui/WarriorBadges";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Warrior } from "@/types/game";

interface TournamentPrepDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  activeWarriors: Warrior[];
  seasonName: string;
  onStart: () => void;
}

export function TournamentPrepDialog({ isOpen, onOpenChange, activeWarriors, seasonName, onStart }: TournamentPrepDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-glass-card border-primary/20 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-black uppercase tracking-tighter flex items-center gap-3 text-primary">
            <Shield className="h-6 w-6" /> {seasonName}_PREP_PROTOCOL
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 bg-secondary/20 p-4 rounded-2xl border border-border/20 leading-relaxed">
            Review your active roster signatures before committing to the seasonal tournament.
            Ensure fame limits and tactical equipment classes are synchronized.
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 thin-scrollbar">
            {activeWarriors.map((w) => (
              <Card key={w.id} className="border-border/40 bg-secondary/5 group hover:border-primary/40 transition-all">
                <CardHeader className="p-4 pb-2 border-b border-border/10 bg-secondary/10 flex flex-row items-center justify-between">
                  <WarriorNameTag id={w.id} name={w.name} isChampion={w.champion} />
                  <StatBadge styleName={w.style} />
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Fame_Index</span>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-mono font-bold",
                        (w.fame ?? 0) > 80 ? "text-destructive shadow-[0_0_10px_rgba(239,68,68,0.4)]" : "text-foreground"
                      )}>
                         {w.fame ?? 0}
                      </span>
                      {(w.fame ?? 0) > 80 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <AlertCircle className="h-3.5 w-3.5 text-destructive animate-pulse" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-destructive text-destructive-foreground font-black uppercase text-[9px]">Nearing FE Freeze</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Mission_History</span>
                    <span className="font-mono font-bold">{w.career.wins}W - {w.career.losses}L</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-border/10">
            <Button 
              onClick={() => { onOpenChange(false); onStart(); }} 
              className="h-12 px-8 gap-3 font-black uppercase text-[11px] tracking-[0.2em] shadow-[0_0_20px_-5px_rgba(var(--primary-rgb),0.5)]"
            >
              <Trophy className="h-4 w-4" /> INITIATE_SEASON_CAMPAIGN
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function cn(...inputs: import("clsx").ClassValue[]) {
  return inputs.filter(Boolean).join(" ");
}
