import {
  Calendar,
  Clock,
  Activity,
  Hexagon,
  CloudRain,
  Sun,
  Cloud,
  Wind,
  Moon,
  PartyPopper,
} from 'lucide-react';
import { useWorldState } from '@/state/useGameStore';
import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function SeasonWidget() {
  const state = useWorldState();
  const week = ((state.week - 1) % 13) + 1;
  const season = state.season;

  // Progress within a 13-week standard season
  const progress = (week / 13) * 100;

  const phase = week <= 4 ? 'Initialization' : week <= 9 ? 'Mid Sequence' : 'Championship Peak';
  const phaseDesc =
    week <= 4
      ? 'Early season scouting and roster consolidation.'
      : week <= 9
        ? 'Intense divisional rivalries and meta-drift analysis.'
        : 'Final championship qualification and legendary bouts.';

  // Offseason Event Check (Week 1 only)
  const isOffseason = week === 1;
  const latestOffseasonEvent = state.newsletter
    ?.filter(
      (item) =>
        item.week === state.week &&
        ['Festival of Blades', 'A Bitter Winter', "Wandering Merchant's Favor"].includes(item.title)
    )
    .pop();

  const weather = state.weather || 'Clear';
  let WeatherIcon = Sun;
  let weatherColor = 'text-yellow-500';
  let weatherBg = 'bg-yellow-500/10 border-yellow-500/20';

  if (weather === 'Rainy') {
    WeatherIcon = CloudRain;
    weatherColor = 'text-stone-400';
    weatherBg = 'bg-stone-400/10 border-stone-400/20';
  } else if (weather === 'Blazing Sun') {
    WeatherIcon = Sun;
    weatherColor = 'text-red-500';
    weatherBg = 'bg-red-500/10 border-red-500/20';
  } else if (weather === 'Sweltering') {
    WeatherIcon = Sun;
    weatherColor = 'text-orange-500';
    weatherBg = 'bg-orange-500/10 border-orange-500/20';
  } else if (weather === 'Blood Moon') {
    WeatherIcon = Moon;
    weatherColor = 'text-red-600';
    weatherBg = 'bg-red-600/10 border-red-600/30 glow-neon-red';
  } else if (weather === 'Overcast') {
    WeatherIcon = Cloud;
    weatherColor = 'text-gray-400';
    weatherBg = 'bg-gray-400/10 border-gray-400/20';
  } else if (weather === 'Gale') {
    WeatherIcon = Wind;
    weatherColor = 'text-emerald-500';
    weatherBg = 'bg-emerald-500/10 border-emerald-500/20';
  } else if (weather === 'Breezy') {
    WeatherIcon = Wind;
    weatherColor = 'text-stone-300';
    weatherBg = 'bg-stone-300/10 border-stone-300/20';
  } else if (weather === 'Eclipse') {
    WeatherIcon = Moon;
    weatherColor = 'text-purple-500';
    weatherBg = 'bg-purple-500/10 border-purple-500/20';
  }

  return (
    <Surface variant="glass" className="h-full border-border/10 group overflow-hidden relative p-0">
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
        <Calendar className="h-12 w-12" />
      </div>

      <div className="p-6">
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="p-2 rounded-none bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]">
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-sm font-black uppercase tracking-[0.2em] text-carved">
              Chronology Matrix
            </h3>
            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">
              Temporal Registry // WK {week.toString().padStart(2, '0')}
            </p>
          </div>
        </div>

        <div className="space-y-8 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40 mb-1">
                CURRENT EPOCH
              </span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-display font-black text-white uppercase tracking-tighter">
                  {season}
                </span>
                <Badge
                  variant="outline"
                  className="text-[9px] font-mono font-black border-primary/20 bg-primary/10 text-primary uppercase tracking-widest"
                >
                  ACTIVE
                </Badge>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40 mb-1">
                ARENA CYCLE
              </span>
              <div className="text-xl font-mono font-black text-foreground/80">{week} / 13</div>
            </div>
          </div>

          {isOffseason && latestOffseasonEvent && (
            <div className="flex items-center gap-3 p-3 bg-arena-gold/10 border border-arena-gold/20 rounded-none animate-in fade-in slide-in-from-top-2 duration-700">
              <PartyPopper className="h-5 w-5 text-arena-gold" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-arena-gold">
                  {latestOffseasonEvent.title}
                </span>
                <span className="text-[9px] font-medium text-arena-gold/70 leading-tight">
                  {latestOffseasonEvent.items?.[0] ?? ''}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              <div className="flex items-center gap-2">
                <Activity className="h-3 w-3" />
                <span>Seasonal Completion</span>
              </div>
              <span className="font-mono text-primary">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="h-full bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)] relative"
              >
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] animate-shimmer" />
              </motion.div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col gap-1 cursor-help group/stat">
                  <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-40 group-hover/stat:text-primary transition-colors">
                    Phase Identifier
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-foreground/80 flex items-center gap-2">
                    <Hexagon className="h-2.5 w-2.5 text-primary opacity-60" /> {phase}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-neutral-950 border-white/10 text-[9px] font-black tracking-widest w-full max-w-52">
                {phaseDesc}
              </TooltipContent>
            </Tooltip>

            <div className="flex flex-col gap-1 items-end text-right">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-40">
                Weather Condition
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex cursor-help mt-1">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[9px] font-mono font-black uppercase tracking-widest gap-1',
                        weatherBg,
                        weatherColor
                      )}
                    >
                      <WeatherIcon className="h-3 w-3" />
                      {weather}
                    </Badge>
                  </span>
                </TooltipTrigger>
                <TooltipContent className="bg-neutral-950 border-white/10 text-[9px] font-black tracking-widest w-full max-w-xs">
                  {weather === 'Blazing Sun'
                    ? '30% more stamina drain in combat.'
                    : weather === 'Sweltering'
                      ? '20% more stamina drain in combat.'
                      : weather === 'Blood Moon'
                        ? 'A crimson moon rises. Fighters are bloodthirsty, vastly increasing lethality. 10% more stamina drain.'
                        : weather === 'Gale'
                          ? 'Fierce winds. 15% more stamina drain in combat.'
                          : weather === 'Breezy'
                            ? '10% less stamina drain in combat.'
                            : weather === 'Eclipse'
                              ? '20% less stamina drain in combat. Fights are slow and methodical.'
                              : weather === 'Rainy'
                                ? 'Poor visibility and slick ground penalize initiative and attack.'
                                : 'Standard atmospheric conditions.'}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </Surface>
  );
}
