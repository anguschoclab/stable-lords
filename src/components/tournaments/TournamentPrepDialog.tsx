import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Shield, Trophy, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WarriorNameTag, StatBadge } from '@/components/ui/WarriorBadges';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Surface } from '@/components/ui/Surface';
import type { Warrior } from '@/types/game';

interface TournamentPrepDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  activeWarriors: Warrior[];
  seasonName: string;
  onStart: () => void;
}

export function TournamentPrepDialog({
  isOpen,
  onOpenChange,
  activeWarriors,
  seasonName,
  onStart,
}: TournamentPrepDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-neutral-950/90 backdrop-blur-xl border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] p-0 overflow-hidden">
        <div className="bg-secondary/20 p-6 border-b border-white/5 flex items-center gap-3">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-black uppercase tracking-tighter text-foreground">
            {seasonName} PREP PROTOCOL
          </h2>
        </div>
        <div className="p-8 space-y-8">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 p-5 bg-white/[0.02] border-l-2 border-primary/40 leading-relaxed italic">
            Review your signature roster before committing to the seasonal circuit. Stability is
            paramount; once locked, genetic signatures cannot be altered for the duration of the
            campaign.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-3 thin-scrollbar">
            {activeWarriors.map((w) => (
              <Surface
                key={w.id}
                variant="glass"
                padding="none"
                className="group hover:border-primary/40 transition-all border-white/5 bg-black/20"
              >
                <div className="p-4 border-b border-white/5 bg-secondary/10 flex items-center justify-between">
                  <WarriorNameTag id={w.id} name={w.name} isChampion={w.champion} />
                  <StatBadge styleName={w.style} />
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                      Fame Index
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'font-mono font-black text-xs',
                          (w.fame ?? 0) > 80
                            ? 'text-destructive shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                            : 'text-foreground/80'
                        )}
                      >
                        {(w.fame ?? 0).toString().padStart(3, '0')}
                      </span>
                      {(w.fame ?? 0) > 80 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <AlertCircle className="h-3.5 w-3.5 text-destructive animate-pulse" />
                            </TooltipTrigger>
                            <TooltipContent >
                              Nearing Sig Freeze
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                      Operational Record
                    </span>
                    <span className="font-mono font-black text-[10px] text-foreground/60">
                      {w.career.wins}W - {w.career.losses}L
                    </span>
                  </div>
                </div>
              </Surface>
            ))}
          </div>

          <div className="flex justify-end pt-8 border-t border-white/5">
            <Button
              onClick={() => {
                onOpenChange(false);
                onStart();
              }}
              className="h-12 px-10 gap-3 font-black uppercase text-[11px] tracking-[0.3em] bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] group"
            >
              <Trophy className="h-4 w-4 group-hover:scale-125 transition-transform" />
              <span>INITIATE SEASON CAMPAIGN</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function cn(...inputs: import('clsx').ClassValue[]) {
  return inputs.filter(Boolean).join(' ');
}
