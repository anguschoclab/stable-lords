/**
 * Highlight Log — curates the most notable minutes from a bout's minute-log
 * and renders them as a short reel. Curation uses text heuristics today
 * (pending Wave-1 structured ExchangeLog); kills, KO, fatigue, big hits
 * surface with distinct glyphs.
 */
import { useMemo } from 'react';
import type { MinuteEvent } from '@/types/combat.types';
import { cn } from '@/lib/utils';
import { Skull, Zap, Activity, Shield, Swords, Flame } from 'lucide-react';

interface Props {
  log: MinuteEvent[];
  visibleCount?: number;
}

type Kind = 'kill' | 'ko' | 'fatigue' | 'bighit' | 'armor' | 'momentum';

interface Highlight {
  minute: number;
  kind: Kind;
  text: string;
}

const KIND_META: Record<Kind, { label: string; color: string; icon: React.ReactNode }> = {
  kill: {
    label: 'KILL',
    color: 'text-arena-blood border-arena-blood/40 bg-arena-blood/10',
    icon: <Skull className="h-3 w-3" />,
  },
  ko: {
    label: 'KO',
    color: 'text-arena-gold border-arena-gold/40 bg-arena-gold/10',
    icon: <Zap className="h-3 w-3" />,
  },
  fatigue: {
    label: 'COLLAPSE',
    color: 'text-muted-foreground border-white/10 bg-black',
    icon: <Activity className="h-3 w-3" />,
  },
  bighit: {
    label: 'BIG HIT',
    color: 'text-destructive border-destructive/40 bg-destructive/10',
    icon: <Flame className="h-3 w-3" />,
  },
  armor: {
    label: 'ARMOR',
    color: 'text-primary border-primary/30 bg-primary/10',
    icon: <Shield className="h-3 w-3" />,
  },
  momentum: {
    label: 'SWING',
    color: 'text-primary border-primary/30 bg-primary/10',
    icon: <Swords className="h-3 w-3" />,
  },
};

function classify(evt: MinuteEvent): Kind | null {
  const t = (evt.text || '').toLowerCase();
  if (
    t.includes('kill') ||
    t.includes('slain') ||
    t.includes('fatal') ||
    t.includes('death blow') ||
    t.includes('lifeless')
  )
    return 'kill';
  if (
    t.includes('knocks out') ||
    t.includes('knocked out') ||
    t.includes(' ko ') ||
    t.includes('unconscious')
  )
    return 'ko';
  if (
    t.includes('collaps') ||
    t.includes('exhaust') ||
    t.includes('gasping') ||
    t.includes('drained')
  )
    return 'fatigue';
  if (
    t.includes('critical') ||
    t.includes('devastat') ||
    t.includes('shattering') ||
    t.includes('crushing')
  )
    return 'bighit';
  if (t.includes('armor') || t.includes('helm') || t.includes('shield')) return 'armor';
  if (t.includes('reversal') || t.includes('turns the tide') || t.includes('riposte'))
    return 'momentum';
  return null;
}

interface HighlightEntry extends Highlight {
  eventIndex: number;
}

// ⚡ Bolt: Pre-calculate all possible highlights for a log to avoid expensive text classification on every playback tick
export function HighlightLog({ log, visibleCount }: Props) {
  const allHighlights = useMemo<HighlightEntry[]>(() => {
    const out: HighlightEntry[] = [];
    const seenKills = new Set<number>();
    for (let i = 0; i < log.length; i++) {
      const e = log[i];
      if (!e) continue;
      const kind = classify(e);
      if (!kind) continue;
      // Dedup kill lines occurring on the same minute.
      if (kind === 'kill') {
        if (seenKills.has(e.minute)) continue;
        seenKills.add(e.minute);
      }
      out.push({ eventIndex: i, minute: e.minute, kind, text: e.text });
    }
    return out;
  }, [log]);

  const highlights = useMemo<HighlightEntry[]>(() => {
    const cap = visibleCount ?? log.length;
    // ⚡ Bolt: O(H) filter on the much smaller highlights array instead of O(N) log scan
    return allHighlights.filter((h) => h.eventIndex < cap).slice(-8);
  }, [allHighlights, visibleCount]);

  if (highlights.length === 0) return null;

  return (
    <div className="border-t border-white/5 bg-neutral-950/60 px-6 py-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60">
          Highlight_Reel
        </div>
        <div className="h-px flex-1 bg-white/5" />
      </div>
      <ol className="space-y-1.5">
        {highlights.map((h, idx) => {
          const meta = KIND_META[h.kind];
          return (
            <li key={idx} className="flex items-start gap-3 text-[12px] leading-snug">
              <span className="font-mono text-[10px] text-muted-foreground/50 w-8 shrink-0 pt-0.5">
                {String(h.minute).padStart(2, '0')}:00
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-none border shrink-0 text-[9px] font-black uppercase tracking-widest',
                  meta.color
                )}
              >
                {meta.icon}
                {meta.label}
              </span>
              <span className="text-foreground/80">{h.text}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default HighlightLog;
