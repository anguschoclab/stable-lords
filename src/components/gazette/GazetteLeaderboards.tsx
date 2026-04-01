import React, { useMemo } from "react";
import { Crown, Skull, Zap, TrendingUp, Trophy, Star } from "lucide-react";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/badge";
import { StatBadge } from "@/components/ui/WarriorBadges";
import type { FightSummary } from "@/types/game";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface LeaderboardProps {
  allFights: FightSummary[];
  currentWeek?: number;
}

export function GazetteLeaderboard({ allFights }: LeaderboardProps) {
  const leaders = useMemo(() => {
    const m = new Map<string, { name: string; wins: number; losses: number; kills: number; streak: number; bestStreak: number; fame: number }>();
    const ensure = (n: string) => {
      if (!m.has(n)) m.set(n, { name: n, wins: 0, losses: 0, kills: 0, streak: 0, bestStreak: 0, fame: 0 });
      return m.get(n)!;
    };

    const sorted = [...allFights].sort((a, b) => a.week - b.week);
    for (const f of sorted) {
      const a = ensure(f.a);
      const d = ensure(f.d);
      a.fame += f.fameDeltaA ?? 0;
      d.fame += f.fameDeltaD ?? 0;

      if (f.winner === "A") {
        a.wins++; d.losses++;
        a.streak = a.streak >= 0 ? a.streak + 1 : 1;
        d.streak = d.streak <= 0 ? d.streak - 1 : -1;
        if (f.by === "Kill") a.kills++;
      } else if (f.winner === "D") {
        d.wins++; a.losses++;
        d.streak = d.streak >= 0 ? d.streak + 1 : 1;
        a.streak = a.streak <= 0 ? a.streak - 1 : -1;
        if (f.by === "Kill") d.kills++;
      } else {
        a.streak = 0; d.streak = 0;
      }
      a.bestStreak = Math.max(a.bestStreak, a.streak);
      d.bestStreak = Math.max(d.bestStreak, d.streak);
    }

    return [...m.values()];
  }, [allFights]);

  if (leaders.length === 0) return null;

  const byFame = [...leaders].sort((a, b) => b.fame - a.fame).slice(0, 5);
  const byKills = [...leaders].filter((l) => l.kills > 0).sort((a, b) => b.kills - a.kills).slice(0, 5);
  const byStreak = [...leaders].filter((l) => l.bestStreak > 1).sort((a, b) => b.bestStreak - a.bestStreak).slice(0, 5);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Fame Leaders */}
      <Surface variant="glass" className="border-arena-gold/20">
        <h3 className="text-xs font-display font-black uppercase tracking-tight flex items-center gap-2 mb-4">
          <Crown className="h-4 w-4 text-arena-gold" /> Eminent Fame
        </h3>
        <div className="space-y-1">
          {byFame.map((l, i) => (
            <div key={l.name} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 group">
              <div className="flex items-center gap-3">
                <span className={cn("text-[10px] font-mono font-black w-4", i === 0 ? "text-arena-gold" : "text-muted-foreground/40")}>{i + 1}</span>
                <span className="text-xs font-display font-black uppercase text-foreground group-hover:text-primary transition-colors tracking-tight truncate max-w-[100px]">{l.name}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-mono font-black text-arena-gold">{l.fame} G</span>
                <span className="text-[8px] font-mono font-black text-muted-foreground uppercase opacity-40">{l.wins}W-{l.losses}L</span>
              </div>
            </div>
          ))}
        </div>
      </Surface>

      {/* Deadliest */}
      <Surface variant="glass" className="border-destructive/20 bg-destructive/5">
        <h3 className="text-xs font-display font-black uppercase tracking-tight flex items-center gap-2 mb-4">
          <Skull className="h-4 w-4 text-destructive" /> Deadliest Intent
        </h3>
        <div className="space-y-1">
          {byKills.map((l, i) => (
            <div key={l.name} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 group">
              <div className="flex items-center gap-3">
                <span className={cn("text-[10px] font-mono font-black w-4", i === 0 ? "text-destructive" : "text-muted-foreground/40")}>{i + 1}</span>
                <span className="text-xs font-display font-black uppercase text-foreground group-hover:text-destructive transition-colors tracking-tight truncate max-w-[100px]">{l.name}</span>
              </div>
              <span className="text-[10px] font-mono font-black text-destructive uppercase tracking-widest">{l.kills} FATALITIES</span>
            </div>
          ))}
          {byKills.length === 0 && <p className="text-[10px] text-muted-foreground/40 italic py-4">No fatal records registered</p>}
        </div>
      </Surface>

      {/* Streak */}
      <Surface variant="glass" className="border-arena-pop/20 bg-arena-pop/5">
        <h3 className="text-xs font-display font-black uppercase tracking-tight flex items-center gap-2 mb-4">
          <Zap className="h-4 w-4 text-arena-pop" /> Momentum Surge
        </h3>
        <div className="space-y-1">
          {byStreak.map((l, i) => (
            <div key={l.name} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 group">
              <div className="flex items-center gap-3">
                <span className={cn("text-[10px] font-mono font-black w-4", i === 0 ? "text-arena-pop" : "text-muted-foreground/40")}>{i + 1}</span>
                <span className="text-xs font-display font-black uppercase text-foreground group-hover:text-arena-pop transition-colors tracking-tight truncate max-w-[100px]">{l.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-black text-arena-pop">{l.bestStreak} STREAK</span>
                {l.streak > 1 && <div className="h-1.5 w-1.5 rounded-full bg-arena-pop animate-pulse shadow-[0_0_5px_rgba(var(--arena-pop-rgb),0.5)]" />}
              </div>
            </div>
          ))}
          {byStreak.length === 0 && <p className="text-[10px] text-muted-foreground/40 italic py-4">No significant streaks identified</p>}
        </div>
      </Surface>
    </div>
  );
}

export function BestByStyle({ allFights }: LeaderboardProps) {
  const byStyle = useMemo(() => {
    const styleMap = new Map<string, Map<string, { wins: number; losses: number; kills: number; fame: number }>>();

    for (const f of allFights) {
      for (const side of ["A", "D"] as const) {
        const style = side === "A" ? f.styleA : f.styleD;
        const name = side === "A" ? f.a : f.d;
        if (!styleMap.has(style)) styleMap.set(style, new Map());
        const warriors = styleMap.get(style)!;
        if (!warriors.has(name)) warriors.set(name, { wins: 0, losses: 0, kills: 0, fame: 0 });
        const w = warriors.get(name)!;
        w.fame += (side === "A" ? f.fameDeltaA : f.fameDeltaD) ?? 0;
        if (f.winner === side) {
          w.wins++;
          if (f.by === "Kill") w.kills++;
        } else if (f.winner !== null) {
          w.losses++;
        }
      }
    }

    return [...styleMap.entries()]
      .map(([style, warriors]) => {
        const ranked = [...warriors.entries()]
          .map(([name, d]) => ({ name, ...d, pct: (d.wins + d.losses) > 0 ? d.wins / (d.wins + d.losses) : 0 }))
          .filter((w) => w.wins + w.losses >= 1)
          .sort((a, b) => b.wins - a.wins || b.pct - a.pct || b.fame - a.fame)
          .slice(0, 3);
        return { style, top: ranked };
      })
      .filter((s) => s.top.length > 0)
      .sort((a, b) => a.style.localeCompare(b.style));
  }, [allFights]);

  if (byStyle.length === 0) return null;

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <Surface variant="glass" className="border-border/40">
      <h3 className="text-sm font-display font-black uppercase tracking-tight flex items-center gap-2 mb-6 p-1 border-b border-white/5">
        <Trophy className="h-4 w-4 text-arena-gold" /> Style Champions
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {byStyle.map(({ style, top }) => (
          <div key={style} className="space-y-3">
            <h4 className="text-[10px] font-display font-black uppercase tracking-widest text-primary border-b border-primary/20 pb-1">{style}</h4>
            <div className="space-y-1">
              {top.map((w, i) => (
                <div key={w.name} className="flex items-center justify-between group">
                  <div className="flex items-center gap-2">
                    <span className="text-sm opacity-80 group-hover:opacity-100 transition-opacity">{medals[i]}</span>
                    <span className={cn(
                      "text-[11px] font-display uppercase tracking-tight transition-colors",
                      i === 0 ? "text-foreground font-black group-hover:text-primary" : "text-muted-foreground italic group-hover:text-foreground"
                    )}>
                      {w.name}
                    </span>
                  </div>
                  <StatBadge styleName={style as any} career={{ wins: w.wins, losses: w.losses, kills: w.kills }} className="scale-75 origin-right opacity-60 group-hover:opacity-100" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Surface>
  );
}

export function RisingStars({ allFights, currentWeek }: LeaderboardProps) {
  const stars = useMemo(() => {
    if (!currentWeek) return [];
    const cutoff = Math.max(1, currentWeek - 2); 
    const recent = allFights.filter((f) => f.week >= cutoff);

    const m = new Map<string, { name: string; fame: number; wins: number; losses: number; bouts: number }>();
    for (const f of recent) {
      for (const side of ["A", "D"] as const) {
        const name = side === "A" ? f.a : f.d;
        const entry = m.get(name) ?? { name, fame: 0, wins: 0, losses: 0, bouts: 0 };
        entry.fame += (side === "A" ? f.fameDeltaA : f.fameDeltaD) ?? 0;
        entry.bouts++;
        if (f.winner === side) entry.wins++;
        else if (f.winner !== null) entry.losses++;
        m.set(name, entry);
      }
    }

    return [...m.values()]
      .filter((w) => w.fame > 0)
      .sort((a, b) => b.fame - a.fame || b.wins - a.wins)
      .slice(0, 5);
  }, [allFights, currentWeek]);

  if (stars.length === 0) return null;

  const maxFame = Math.max(...stars.map((s) => s.fame), 1);

  return (
    <Surface variant="glass" className="border-secondary/40 bg-secondary/10">
      <h3 className="text-base font-display font-black uppercase tracking-tight flex items-center gap-2 mb-6">
        <TrendingUp className="h-5 w-5 text-arena-pop" /> 
        Rising Stars Registry
      </h3>
      <div className="space-y-4">
        {stars.map((s, i) => {
          const barW = (s.fame / maxFame) * 100;
          return (
            <div key={s.name} className="space-y-2 group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={cn("text-[10px] font-mono font-black w-4", i === 0 ? "text-arena-pop" : "text-muted-foreground/40")}>{i + 1}</span>
                  <span className="text-sm font-display font-black uppercase text-foreground group-hover:text-arena-pop transition-colors tracking-tight">{s.name}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono font-black uppercase">
                  <span className="text-arena-pop">+{s.fame} FAME</span>
                  <span className="text-muted-foreground/40">{s.wins}W-{s.losses}L</span>
                </div>
              </div>
              <div className="h-2 bg-neutral-950 rounded-full overflow-hidden border border-white/5 relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${barW}%` }}
                  className="h-full bg-arena-pop shadow-[0_0_10px_rgba(var(--arena-pop-rgb),0.5)]" 
                />
              </div>
            </div>
          );
        })}
      </div>
    </Surface>
  );
}
