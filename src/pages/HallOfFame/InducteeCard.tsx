import React from 'react';
import { STYLE_DISPLAY_NAMES } from '@/types/game';
import type { Warrior, FightSummary } from '@/types/game';
import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Swords, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Surface } from '@/components/ui/Surface';

/* ── helpers ─────────────────────────────────────────────── */

function bestFight(warrior: Warrior, fights: FightSummary[]): FightSummary | null {
  const wFights = fights.filter((f) => f.a === warrior.name || f.d === warrior.name);
  if (wFights.length === 0) return null;
  return wFights.reduce((best, f) => {
    const score = (t: FightSummary) => {
      let s = 0;
      if (t.by === 'Kill') s += 5;
      if (t.by === 'KO') s += 3;
      if (t.flashyTags?.includes('Comeback')) s += 4;
      if (t.flashyTags?.includes('Flashy')) s += 2;
      return s;
    };
    return score(f) > score(best) ? f : best;
  }, wFights[0]);
}

/* ── Inductee Card ───────────────────────────────────────── */

export function InducteeCard({
  warrior,
  title,
  icon,
  fights,
}: {
  warrior: Warrior;
  title: string;
  icon: React.ReactNode;
  fights: FightSummary[];
}) {
  const best = bestFight(warrior, fights);
  const winRate =
    warrior.career.wins + warrior.career.losses > 0
      ? Math.round((warrior.career.wins / (warrior.career.wins + warrior.career.losses)) * 100)
      : 0;

  return (
    <motion.div whileHover={{ y: -5 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
      <Surface
        variant="gold"
        padding="none"
        data-testid="inductee-card"
        className="hover:border-arena-gold/40 transition-all duration-500 overflow-hidden relative group"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-arena-gold/60 via-arena-gold/20 to-transparent opacity-40 group-hover:opacity-100 transition-opacity" />

        <CardContent className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'p-1.5 rounded-none border',
                    title.includes('Fame') || title.includes('Greatest')
                      ? 'bg-arena-gold/10 border-arena-gold/30'
                      : 'bg-primary/10 border-primary/30'
                  )}
                >
                  {icon}
                </div>
                <span className="font-display font-black text-xl uppercase tracking-tighter text-foreground group-hover:text-arena-gold transition-colors">
                  {warrior.name}
                </span>
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                <span>{STYLE_DISPLAY_NAMES[warrior.style]}</span>
                <span className="opacity-40">·</span>
                <span>AGE_{warrior.age ?? '??'}</span>
              </div>
            </div>
            <Badge
              variant="outline"
              className="text-[9px] font-black tracking-widest uppercase text-arena-gold bg-arena-gold/5 border-arena-gold/20 py-1 px-2"
            >
              {title}
            </Badge>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'WINS', val: warrior.career.wins, color: 'text-foreground' },
              { label: 'LOSS', val: warrior.career.losses, color: 'text-muted-foreground/40' },
              { label: 'KILL', val: warrior.career.kills, color: 'text-destructive' },
              { label: 'FAME', val: warrior.fame ?? 0, color: 'text-arena-gold' },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-secondary/20 rounded-none p-2 border border-border/10 text-center"
              >
                <div className={cn('text-sm font-mono font-black', s.color)}>{s.val}</div>
                <div className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground/40">
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Performance Sector */}
          <div className="space-y-2 py-2">
            <div className="flex items-center justify-between text-[10px] font-black tracking-[0.2em] text-muted-foreground/60">
              <span className="flex items-center gap-1.5">
                <Activity className="h-3 w-3" /> PERFORMANCE_RATIO
              </span>
              <span className="font-mono text-foreground">{winRate}%</span>
            </div>
            <div className="h-1.5 bg-secondary/20 rounded-full overflow-hidden shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${winRate}%` }}
                className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full"
              />
            </div>
          </div>

          {/* Titles */}
          {warrior.titles.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/10">
              {warrior.titles.map((t, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-[9px] font-black tracking-widest uppercase bg-arena-gold/5 text-arena-gold border border-arena-gold/10 px-2 py-0.5 rounded-none"
                >
                  {t}
                </Badge>
              ))}
            </div>
          )}

          {/* Greatest fight — Tactical Box */}
          {best && (
            <div className="bg-black/20 rounded-none p-4 border border-border/10 mt-auto">
              <div className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mb-3 flex items-center justify-between">
                <span>CHRONICLE_PEAK</span>
                <span>WK_{best.week}</span>
              </div>
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'text-[11px] font-display font-black uppercase tracking-tight',
                    (best.winner === 'A' && best.a === warrior.name) ||
                      (best.winner === 'D' && best.d === warrior.name)
                      ? 'text-foreground'
                      : 'text-muted-foreground/40'
                  )}
                >
                  {best.a}
                </span>
                <div className="flex flex-col items-center gap-1">
                  <Swords className="h-3 w-3 text-muted-foreground/40" />
                  <Badge
                    variant="outline"
                    className="text-[8px] font-black py-0 px-1 border-muted-foreground/20"
                  >
                    {best.by}
                  </Badge>
                </div>
                <span
                  className={cn(
                    'text-[11px] font-display font-black uppercase tracking-tight text-right',
                    (best.winner === 'D' && best.d === warrior.name) ||
                      (best.winner === 'A' && best.a === warrior.name)
                      ? 'text-foreground'
                      : 'text-muted-foreground/40'
                  )}
                >
                  {best.d}
                </span>
              </div>
              {best.flashyTags && best.flashyTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
                  {best.flashyTags.map((t) => (
                    <span
                      key={t}
                      className="text-[8px] font-black uppercase tracking-widest text-arena-gold/60 border border-arena-gold/10 bg-arena-gold/5 px-2 py-0.5 rounded-full"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Surface>
    </motion.div>
  );
}
