import { Badge } from '@/components/ui/badge';
import { Eye, Swords, Target, ChevronRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Surface } from '@/components/ui/Surface';
import type { Warrior, ScoutReportData } from '@/types/game';
import { WarriorNameTag, StatBadge } from '@/components/ui/WarriorBadges';
import { cn } from '@/lib/utils';

interface RivalWarriorListProps {
  warriors: Warrior[];
  selectedWarriorId: string | null;
  onSelectWarrior: (id: string) => void;
  reports: ScoutReportData[];
  stableName: string | undefined;
}

export function RivalWarriorList({
  warriors,
  selectedWarriorId,
  onSelectWarrior,
  reports,
  stableName,
}: RivalWarriorListProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 px-2">
        <div className="p-1 px-2 rounded-none bg-primary/10 border border-primary/20">
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
            {stableName ? `${stableName} Roster` : 'Select Stable'}
          </span>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-primary/20 via-border/20 to-transparent" />
      </div>

      <div className="grid grid-cols-1 gap-2 overflow-y-auto max-h-[60vh] pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {warriors.map((w) => {
          const hasReport = reports.some((r) => r.warriorName === w.name);
          const isSelected = selectedWarriorId === w.id;

          return (
            <Tooltip key={w.id}>
              <TooltipTrigger asChild>
                <button
                  aria-label={`Select rival warrior ${w.name} (${w.career.wins}W/${w.career.losses}L)`}
                  className={cn(
                    'w-full text-left group relative outline-none',
                    isSelected ? 'z-10' : 'z-0'
                  )}
                  onClick={() => onSelectWarrior(w.id)}
                >
                  <Surface
                    variant={isSelected ? 'paper' : 'glass'}
                    padding="none"
                    className={cn(
                      'transition-all border bg-neutral-900/60 overflow-hidden',
                      isSelected
                        ? 'border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)]'
                        : 'border-white/5 hover:border-white/20 hover:bg-white/5'
                    )}
                  >
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <WarriorNameTag id={w.id} name={w.name} useCrown={false} />
                          {hasReport && (
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-none bg-primary/20 border border-primary/20 text-[8px] font-black text-primary uppercase tracking-widest animate-pulse">
                              <Eye className="h-2.5 w-2.5" /> INTEL
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          <StatBadge styleName={w.style as import('@/types/game').FightingStyle} />
                          <div className="flex items-center gap-2 text-[10px] font-mono font-black text-muted-foreground/60">
                            <span className="text-primary">{w.career.wins}W</span>
                            <span className="opacity-20">/</span>
                            <span className="text-destructive/60">{w.career.losses}L</span>
                          </div>
                        </div>
                      </div>

                      {isSelected ? (
                        <Target className="h-4 w-4 text-primary animate-pulse" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground/20 group-hover:text-primary/40 group-hover:translate-x-1 transition-all" />
                      )}
                    </div>
                    {isSelected && (
                      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />
                    )}
                  </Surface>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-neutral-950 border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                  SELECT WARRIOR
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}

        {warriors.length === 0 && (
          <Surface
            variant="glass"
            className="py-16 text-center border-dashed border-border/30 flex flex-col items-center gap-4"
          >
            <Swords className="h-12 w-12 text-muted-foreground opacity-20" />
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                Select a Stable to Begin Roster Scan
              </p>
              <p className="text-[9px] text-muted-foreground/20 italic uppercase tracking-tighter">
                Awaiting host connection...
              </p>
            </div>
          </Surface>
        )}
      </div>
    </div>
  );
}
