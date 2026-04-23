import { Surface } from '@/components/ui/Surface';
import { Trophy, Swords, Skull, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorldStatsProps {
  stableCount: number;
  warriorCount: number;
  killCount: number;
  topStable: string;
}

export function WorldStats({ stableCount, warriorCount, killCount, topStable }: WorldStatsProps) {
  const stats = [
    {
      icon: Trophy,
      label: 'COMMISSION STABLES',
      value: stableCount,
      color: 'text-arena-gold',
      glow: 'shadow-arena-gold/20',
    },
    {
      icon: Swords,
      label: 'ACTIVE WARRIORS',
      value: warriorCount,
      color: 'text-primary',
      glow: 'shadow-primary/20',
    },
    {
      icon: Skull,
      label: 'TOTAL FATALITIES',
      value: killCount,
      color: 'text-destructive',
      glow: 'shadow-destructive/20',
    },
    {
      icon: Crown,
      label: 'DOMINANT STABLE',
      value: topStable,
      color: 'text-arena-gold',
      glow: 'shadow-arena-gold/20',
      smallValue: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((item, idx) => (
        <Surface
          key={idx}
          variant="glass"
          padding="none"
          className="group overflow-hidden border-white/5 hover:border-white/10 transition-all"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-all group-hover:scale-110">
            <item.icon className={cn('h-12 w-12', item.color)} />
          </div>
          <div className="p-5 flex flex-col justify-center min-h-[90px] relative z-10">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 mb-1 leading-none">
              {item.label}
            </span>
            <p
              className={cn(
                'font-display font-black truncate drop-shadow-md',
                item.smallValue ? 'text-sm uppercase tracking-tight' : 'text-3xl tracking-tighter',
                item.color
              )}
            >
              {item.value}
            </p>
          </div>
          <div
            className={cn(
              'absolute bottom-0 left-0 w-full h-[2px] opacity-20 bg-gradient-to-r from-transparent via-current to-transparent',
              item.color
            )}
          />
        </Surface>
      ))}
    </div>
  );
}
