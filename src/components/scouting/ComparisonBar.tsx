import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ComparisonBarProps {
  label: string;
  valA: number;
  valB: number;
  maxVal: number;
  colorA: string;
  colorB: string;
}

export function ComparisonBar({ label, valA, valB, maxVal, colorA, colorB }: ComparisonBarProps) {
  const pctA = maxVal > 0 ? (valA / maxVal) * 100 : 0;
  const pctB = maxVal > 0 ? (valB / maxVal) * 100 : 0;
  const aWins = valA > valB;
  const bWins = valB > valA;

  return (
    <div className="space-y-1 group/bar">
      <div className="flex items-center justify-between text-[10px] font-black tracking-widest uppercase">
        <span
          className={cn(
            'font-mono transition-colors',
            aWins ? colorA.replace('bg-', 'text-') + ' drop-shadow-sm' : 'text-muted-foreground/40'
          )}
        >
          {valA}
        </span>
        <span className="text-muted-foreground/60 transition-colors group-hover/bar:text-foreground">
          {label}
        </span>
        <span
          className={cn(
            'font-mono transition-colors',
            bWins ? colorB.replace('bg-', 'text-') + ' drop-shadow-sm' : 'text-muted-foreground/40'
          )}
        >
          {valB}
        </span>
      </div>
      <div className="flex gap-1.5 items-center">
        <div className="flex-1 flex justify-end">
          <div className="h-1.5 bg-secondary/30 rounded-full overflow-hidden w-full flex justify-end">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pctA}%` }}
              className={cn(
                'h-full rounded-full transition-all',
                colorA,
                aWins && 'shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]'
              )}
            />
          </div>
        </div>
        <div className="w-1 h-1 rounded-full bg-border/40" />
        <div className="flex-1">
          <div className="h-1.5 bg-secondary/30 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pctB}%` }}
              className={cn(
                'h-full rounded-full transition-all',
                colorB,
                bWins && 'shadow-[0_0_8px_rgba(var(--accent-rgb),0.5)]'
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
