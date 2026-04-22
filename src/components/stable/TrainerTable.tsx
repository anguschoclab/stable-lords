import React from 'react';
import { useGameStore, useWorldState } from '@/state/useGameStore';
import { Link } from '@tanstack/react-router';
import { STYLE_DISPLAY_NAMES } from '@/types/game';
import { TRAINER_WEEKLY_SALARY } from '@/engine/trainers';
import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { GraduationCap, ChevronRight, Target, Coins, Activity, Zap } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function TrainerTable() {
  const state = useWorldState();
  const trainers = (state.trainers ?? []).filter((t) => t.contractWeeksLeft > 0);

  return (
    <Surface variant="glass" padding="none" className="border-border/40 overflow-hidden h-full">
      <div className="p-6 border-b border-white/5 bg-primary/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-none bg-primary/20 border border-primary/30">
            <GraduationCap className="h-4 w-4 text-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />
          </div>
          <div>
            <h3 className="text-sm font-display font-black uppercase tracking-tight">
              Academic Faculty
            </h3>
            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-60">
              Active Contracts: {trainers.length} // Institutional Mentors
            </p>
          </div>
        </div>
        <Link to="/ops/personnel">
          <button className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:text-primary-foreground hover:bg-primary/20 px-3 py-1.5 rounded transition-all border border-primary/20">
            Manage Staff
          </button>
        </Link>
      </div>

      <div className="p-6">
        {trainers.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center gap-4">
            <GraduationCap className="h-12 w-12 text-muted-foreground opacity-20" />
            <div className="space-y-1">
              <p className="text-sm font-display font-black uppercase tracking-tight text-muted-foreground">
                The Academy is Empty
              </p>
              <p className="text-xs text-muted-foreground/60 italic max-w-xs mx-auto">
                No trainers are currently on payroll. Recruit specialists to accelerate warrior
                evolution.
              </p>
            </div>
            <Link to="/ops/personnel" className="mt-4">
              <Surface
                variant="neon"
                padding="sm"
                className="text-[10px] font-black uppercase tracking-[0.2em] px-8 py-2.5 hover:scale-105 transition-transform"
              >
                Enlist Specialists
              </Surface>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {trainers.map((t) => {
              const weeksLeft = t.contractWeeksLeft;
              const pct = Math.min((weeksLeft / 52) * 100, 100);
              const isExpiring = weeksLeft <= 4;

              return (
                <Surface
                  key={t.id}
                  variant="paper"
                  padding="sm"
                  className="bg-neutral-900/60 border border-white/5 hover:border-primary/40 transition-all group"
                >
                  <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-display font-black uppercase tracking-tight group-hover:text-primary transition-colors">
                        {t.name}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[8px] font-black border-none uppercase tracking-widest px-1.5 h-4',
                          t.tier === 'Master' ? 'bg-arena-gold text-black' : 'bg-primary text-white'
                        )}
                      >
                        {t.tier}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-black text-destructive">
                        -{TRAINER_WEEKLY_SALARY[t.tier] ?? 35}G
                      </span>
                      <Coins className="h-3 w-3 text-arena-gold opacity-60" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 items-end">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 opacity-60">
                        <Target className="h-3 w-3 text-primary" />
                        <span className="text-[9px] font-black uppercase tracking-widest">
                          {t.focus} Registry
                        </span>
                      </div>
                      {t.styleBonusStyle && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 opacity-80 cursor-help">
                              <Zap className="h-3 w-3 text-arena-gold" />
                              <span className="text-[9px] font-black uppercase tracking-widest text-arena-gold">
                                Affinity:{' '}
                                {STYLE_DISPLAY_NAMES[
                                  t.styleBonusStyle as keyof typeof STYLE_DISPLAY_NAMES
                                ] ?? t.styleBonusStyle}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-[200px] text-[10px]">
                            +5% training gain chance for{' '}
                            {STYLE_DISPLAY_NAMES[
                              t.styleBonusStyle as keyof typeof STYLE_DISPLAY_NAMES
                            ] ?? t.styleBonusStyle}{' '}
                            warriors
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2 w-full justify-end">
                        <Progress
                          value={pct}
                          className={cn(
                            'h-1 flex-1',
                            isExpiring ? 'bg-destructive/20' : 'bg-primary/20'
                          )}
                        />
                        <span
                          className={cn(
                            'text-[10px] font-mono font-black',
                            isExpiring ? 'text-destructive animate-pulse' : 'text-muted-foreground'
                          )}
                        >
                          {weeksLeft}W
                        </span>
                      </div>
                      <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest">
                        Tenure Remainder
                      </span>
                    </div>
                  </div>
                </Surface>
              );
            })}
          </div>
        )}
      </div>
    </Surface>
  );
}
