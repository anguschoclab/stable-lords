import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import { Brain, Zap, Activity } from 'lucide-react';
import { MetaDriftWidget } from '@/components/widgets/MetaDriftWidget';
import { STYLE_DISPLAY_NAMES, type FightingStyle, type RivalStableData } from '@/types/game';
import { cn } from '@/lib/utils';

interface RivalIntelligenceProps {
  rivals: RivalStableData[];
}

export function RivalIntelligence({ rivals }: RivalIntelligenceProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <MetaDriftWidget />
      </div>
      <div className="lg:col-span-2 space-y-6">
        <Surface variant="glass" padding="none" className="border-border/40 overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-primary/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-none bg-primary/10 border border-primary/20">
                <Brain className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-sm font-black uppercase tracking-tight">
                  Rival Network
                </h3>
                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-60">
                  Neural Simulation Engine // Strategic Intel Registry
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border-primary/20 bg-primary/5 text-primary"
            >
              RIVALS: {rivals.length}
            </Badge>
          </div>

          <div className="divide-y divide-white/5">
            {rivals.map((rival) => (
              <div
                key={rival.owner.id}
                className="p-5 hover:bg-white/[0.02] transition-all group relative overflow-hidden"
              >
                {/* Header row */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 shrink-0 rounded-none bg-neutral-900 border border-white/5 flex items-center justify-center font-display font-black text-xs text-muted-foreground group-hover:text-primary group-hover:border-primary/30 transition-all">
                    {rival.owner.stableName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-display font-black uppercase text-sm tracking-tight text-foreground group-hover:text-primary transition-colors truncate">
                      {rival.owner.stableName}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-muted-foreground/50 font-black uppercase tracking-widest truncate">
                        {rival.owner.name}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-border/50 shrink-0" />
                      <span className="text-[9px] text-primary/60 font-black uppercase tracking-widest shrink-0">
                        {rival.owner.personality || 'Calculated'}
                      </span>
                    </div>
                  </div>
                  <Badge
                    className={cn(
                      'text-[9px] font-black border-none uppercase tracking-widest px-2 py-0.5 shrink-0',
                      rival.strategy?.intent === 'VENDETTA'
                        ? 'bg-destructive/20 text-destructive'
                        : rival.strategy?.intent === 'EXPANSION'
                          ? 'bg-stone-500/20 text-stone-400'
                          : rival.strategy?.intent === 'RECOVERY'
                            ? 'bg-arena-blood/20 text-arena-blood'
                            : 'bg-primary/20 text-primary'
                    )}
                  >
                    {rival.strategy?.intent || 'STABLE'}
                  </Badge>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pl-13">
                  {/* Doctrine */}
                  <div className="sm:col-span-1 space-y-1">
                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30 block">
                      Doctrine
                    </span>
                    <p className="text-[10px] leading-relaxed italic border-l-2 border-primary/20 pl-3 text-foreground/60">
                      "{rival.philosophy || 'Martial purity above all.'}"
                    </p>
                  </div>

                  {/* Capital + Staff */}
                  <div className="space-y-2">
                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30 block">
                      Capital
                    </span>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'h-1.5 w-1.5 rounded-full shrink-0 animate-pulse',
                          rival.treasury < 150
                            ? 'bg-destructive'
                            : rival.treasury < 500
                              ? 'bg-arena-blood'
                              : 'bg-primary'
                        )}
                      />
                      <span className="text-[10px] font-black uppercase tracking-tight text-foreground/70">
                        {rival.treasury < 150
                          ? 'Debt'
                          : rival.treasury < 500
                            ? 'Depleted'
                            : rival.treasury < 1200
                              ? 'Operational'
                              : 'Surplus'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-muted-foreground/40 font-black uppercase tracking-widest">
                      <Activity className="h-2.5 w-2.5" /> {rival.trainers?.length || 0} staff
                    </div>
                  </div>

                  {/* Favored styles */}
                  <div className="space-y-2">
                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30 block">
                      Favored Classes
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {rival.owner.favoredStyles &&
                      (rival.owner.favoredStyles as FightingStyle[]).length > 0 ? (
                        (rival.owner.favoredStyles as FightingStyle[]).map((s) => (
                          <Badge
                            key={s}
                            variant="outline"
                            className="text-[9px] font-black uppercase tracking-widest py-0.5 px-2 bg-neutral-900 border-white/5"
                          >
                            {STYLE_DISPLAY_NAMES[s]}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-[9px] text-muted-foreground/30 italic">No bias</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="absolute right-0 top-0 h-full w-0.5 bg-primary/20 transform translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
              </div>
            ))}
          </div>
        </Surface>

        <Surface variant="glass" className="bg-primary/5 border-primary/20 border-dashed">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-none bg-primary/10">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-1">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-primary">
                Scouting Protocol Summary
              </h5>
              <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                Rival owners react to meta shifts with varying latency.{' '}
                <span className="text-foreground font-black">Innovators</span> anticipate trends,
                while <span className="text-foreground font-black">Traditionalists</span> provide
                predictable matchups. Leverage neural intelligence to exploit doctrinal gaps in
                future brackets.
              </p>
            </div>
          </div>
        </Surface>
      </div>
    </div>
  );
}
