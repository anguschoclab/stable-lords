import { cn } from '@/lib/utils';

interface SectionDividerProps {
  label: string;
  className?: string;
  variant?: 'primary' | 'gold' | 'blood' | 'muted';
}

export function SectionDivider({ label, className, variant = 'muted' }: SectionDividerProps) {
  const variantClasses = {
    primary: 'text-primary/80 from-primary/30 via-primary/5',
    gold: 'text-arena-gold/80 from-arena-gold/30 via-arena-gold/5',
    blood: 'text-arena-blood/80 from-arena-blood/30 via-arena-blood/5',
    muted: 'text-muted-foreground/60 from-white/10 via-white/5',
  };

  return (
    <div className={cn('flex items-center gap-4 py-4', className)}>
      <span className="text-[10px] font-black uppercase tracking-[0.4em] whitespace-nowrap">
        {label}
      </span>
      <div className={cn('h-px flex-1 bg-gradient-to-r to-transparent', variantClasses[variant])} />
    </div>
  );
}
