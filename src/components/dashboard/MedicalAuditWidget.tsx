import { useMemo } from 'react';
import { useWorldState } from '@/state/useGameStore';
import { HeartPulse, Activity, Skull, ShieldAlert } from 'lucide-react';
import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import { StatBattery } from '@/components/ui/StatBattery';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { WarriorLink } from '@/components/EntityLink';

export function MedicalAuditWidget() {
  const state = useWorldState();

  const atRisk = useMemo(() => {
    return state.roster
      .filter((w) => {
        const fatigue = w.fatigue ?? 0;
        return w.status === 'Active' && (fatigue > 60 || w.injuries.length > 0);
      })
      .sort((a, b) => {
        const bFatigue = b.fatigue ?? 0;
        const aFatigue = a.fatigue ?? 0;
        return bFatigue - aFatigue;
      });
  }, [state.roster]);

  const criticalCount = atRisk.filter((w) => (w.fatigue ?? 0) > 85 || w.injuries.length > 1).length;

  return (
    <Surface
      variant="glass"
      padding="none"
      className="h-full border-border/10 group overflow-hidden relative flex flex-col shadow-2xl"
    >
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
        <HeartPulse className="h-48 w-48 text-destructive" />
      </div>

      <div className="p-6 border-b border-white/5 bg-neutral-900/40 relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-none bg-destructive/10 border border-destructive/20 shadow-[0_0_15px_rgba(239,68,68,0.1)] group-hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] transition-all">
            <ShieldAlert
              className={cn('h-5 w-5 text-destructive', criticalCount > 0 && 'animate-pulse')}
            />
          </div>
          <div>
            <h3 className="font-display text-base font-black uppercase tracking-tight">
              Biological Audit
            </h3>
            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">
              Nodal Integrity Monitor
            </p>
          </div>
        </div>
        {criticalCount > 0 && (
          <Badge
            variant="destructive"
            className="text-[8px] font-mono font-black h-5 px-2 animate-bounce"
          >
            CRITICAL
          </Badge>
        )}
      </div>

      <div className="p-6 flex-1 relative z-10 custom-scrollbar overflow-y-auto max-h-96">
        {atRisk.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 opacity-20 group-hover:opacity-30 transition-opacity">
            <Activity className="h-12 w-12 mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-center italic">
              Roster Integrity Nominal
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {atRisk.map((w) => {
              const fatigue = w.fatigue ?? 0;
              const condition = Math.max(0, 100 - fatigue);
              const isInjured = w.injuries.length > 0;
              const isCritical = fatigue > 85;

              return (
                <div key={w.id} className="group/item relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex flex-col">
                      <WarriorLink
                        name={w.name}
                        id={w.id}
                        className="text-xs font-black uppercase tracking-tight text-foreground/80 hover:text-primary transition-colors"
                      />
                      <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mt-0.5">
                        Operative ID: {w.id.slice(0, 8)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {isInjured && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Skull className="h-3.5 w-3.5 text-destructive animate-pulse cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-neutral-950 border-white/10 text-[9px] font-black tracking-widest text-destructive">
                            TRAUMATIC TISSUE FAILURE
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>

                  <StatBattery
                    label="VIT"
                    value={condition}
                    max={100}
                    labelValue={`${condition}%`}
                    colorClass={condition < 40 ? 'bg-destructive' : 'bg-amber-500'}
                    className="mt-1 w-full"
                  />

                  {isInjured && (
                    <div className="mt-2 flex flex-wrap gap-1.5 pl-1 border-l border-destructive/30 ml-0.5">
                      {w.injuries.map((inj, i) => (
                        <span
                          key={i}
                          className="text-[8px] font-black uppercase tracking-[0.1em] text-destructive py-0.5 px-1.5 bg-destructive/10 border border-destructive/20 rounded-none"
                        >
                          {typeof inj === 'string' ? inj : inj.name.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/5 bg-black/40 flex justify-center relative z-10 mt-auto">
        <div className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground opacity-40 flex items-center gap-2">
          Stable Biometrics Active <Activity className="h-3 w-3 text-destructive" />
        </div>
      </div>
    </Surface>
  );
}
