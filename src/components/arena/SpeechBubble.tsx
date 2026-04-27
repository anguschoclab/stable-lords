import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { SpeechBubble as SpeechBubbleType } from '@/types/arena.types';

interface SpeechBubbleProps {
  bubble: SpeechBubbleType;
  onDismiss: (id: string) => void;
  position?: 'left' | 'right';
}

export default function SpeechBubble({ bubble, onDismiss, position = 'left' }: SpeechBubbleProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(bubble.id);
    }, bubble.duration);

    return () => clearTimeout(timer);
  }, [bubble.id, bubble.duration, onDismiss]);

  const getBubbleStyles = (type: SpeechBubbleType['type']) => {
    switch (type) {
      case 'taunt':
        return 'border-arena-gold/40 bg-neutral-950/95 text-arena-gold';
      case 'crit':
        return 'border-destructive/50 bg-destructive/10 text-destructive shadow-[0_0_20px_rgba(var(--destructive-rgb),0.3)]';
      case 'death':
        return 'border-arena-blood/50 bg-arena-blood/10 text-arena-blood shadow-[0_0_20px_rgba(var(--arena-blood-rgb),0.4)]';
      case 'victory':
        return 'border-primary/40 bg-primary/10 text-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]';
      case 'hit':
      default:
        return 'border-white/20 bg-neutral-950/90 text-foreground';
    }
  };

  return (
    <div
      className={cn(
        'absolute z-20 animate-in fade-in slide-in-from-bottom-2 duration-300 -top-[60px]',
        position === 'left' ? 'left-1/2 -translate-x-1/4' : 'right-1/2 translate-x-1/4'
      )}
    >
      <div
        className={cn(
          'relative px-4 py-2 rounded-sm border-2 font-display text-xs font-black uppercase tracking-wide whitespace-nowrap',
          'shadow-lg backdrop-blur-sm',
          getBubbleStyles(bubble.type)
        )}
      >
        {/* Pointer triangle */}
        <div
          className={cn(
            'absolute -bottom-2 w-0 h-0 opacity-80',
            'border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-current',
            position === 'left' ? 'left-4' : 'right-4'
          )}
        />

        {/* Quote marks */}
        <span className="absolute -top-2 -left-1 text-lg opacity-40 font-serif">"</span>

        {bubble.text}
      </div>
    </div>
  );
}
