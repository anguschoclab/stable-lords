import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { MinuteEvent } from '@/types/combat.types';
import { classifyEvent } from '@/lib/boutUtils';
import { Swords, Zap, Skull, Shield, Target, Activity, MoveHorizontal } from 'lucide-react';

interface TacticalLogViewProps {
  log: MinuteEvent[];
  visibleCount: number;
  className?: string;
}

function getEventIcon(type: ReturnType<typeof classifyEvent>) {
  switch (type) {
    case 'hit':
      return <Swords className="h-3 w-3 text-arena-gold" />;
    case 'crit':
      return <Zap className="h-3.5 w-3.5 text-destructive animate-pulse" />;
    case 'death':
      return <Skull className="h-3.5 w-3.5 text-arena-blood" />;
    case 'ko':
      return <Skull className="h-3 w-3 text-arena-gold" />;
    case 'miss':
      return <Shield className="h-3 w-3 text-arena-steel opacity-40" />;
    case 'riposte':
      return <Swords className="h-3 w-3 text-arena-fame" />;
    case 'initiative':
      return <Zap className="h-3 w-3 text-primary" />;
    case 'exhaust':
      return <Activity className="h-3 w-3 text-muted-foreground/40" />;
    case 'phase':
      return <Target className="h-3 w-3 text-primary/60" />;
    case 'spatial':
      return <MoveHorizontal className="h-3 w-3 text-blue-400" />;
    default:
      return <div className="h-2 w-2 rounded-full bg-muted-foreground/20" />;
  }
}

function getEventColor(type: ReturnType<typeof classifyEvent>) {
  switch (type) {
    case 'hit':
      return 'border-arena-gold/20 bg-arena-gold/5';
    case 'crit':
      return 'border-destructive/30 bg-destructive/10 shadow-[0_0_15px_rgba(var(--destructive-rgb),0.1)]';
    case 'death':
      return 'border-arena-blood/40 bg-arena-blood/10';
    case 'ko':
      return 'border-arena-gold/30 bg-arena-gold/5';
    case 'riposte':
      return 'border-arena-fame/20 bg-arena-fame/5';
    case 'initiative':
      return 'border-primary/20 bg-primary/5';
    case 'exhaust':
      return 'border-white/5 bg-white/5';
    case 'miss':
      return 'border-white/5 bg-transparent opacity-60';
    case 'phase':
      return 'border-primary/40 bg-primary/10 py-3 my-2';
    case 'spatial':
      return 'border-blue-500/20 bg-blue-500/5';
    default:
      return 'border-white/5 bg-transparent';
  }
}

export default function TacticalLogView({ log, visibleCount, className }: TacticalLogViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest event
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [visibleCount]);

  const visibleEvents = log.slice(0, visibleCount);

  return (
    <ScrollArea className={cn('h-[400px] w-full', className)}>
      <div ref={scrollRef} className="p-4 space-y-1">
        {visibleEvents.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8 italic">
            The battle is about to begin...
          </div>
        ) : (
          visibleEvents.map((event, index) => {
            const type = classifyEvent(event);
            const isLatest = index === visibleEvents.length - 1;

            return (
              <div
                key={index}
                className={cn(
                  'flex items-start gap-2 py-1.5 px-2 border-l-2 text-xs transition-all duration-300',
                  getEventColor(type),
                  isLatest && 'animate-in slide-in-from-left-2 duration-300',
                  isLatest && type === 'crit' && 'animate-pulse'
                )}
              >
                <div className="mt-0.5 shrink-0">{getEventIcon(type)}</div>
                <div className="flex-1 leading-relaxed">
                  <span
                    className={cn(
                      'font-serif',
                      type === 'crit' && 'font-bold text-destructive',
                      type === 'death' && 'font-bold text-arena-blood'
                    )}
                  >
                    {event.text}
                  </span>
                  {event.phase && (
                    <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                      — {event.phase} Phase
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
    </ScrollArea>
  );
}
