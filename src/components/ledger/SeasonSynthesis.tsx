import { useMemo } from 'react';
import { useGameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { Surface } from '@/components/ui/Surface';
import { calculateStableStats } from '@/engine/stats/stableStats';
import { computeMetaDrift, getMetaLabel, getMetaColor } from '@/engine/metaDrift';
import { STYLE_DISPLAY_NAMES } from '@/types/game';
import { cn } from '@/lib/utils';
import { Trophy, Flame, TrendingUp, ScrollText, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export function SeasonSynthesis() {
  const { rivals, ownerGrudges, newsletter, arenaHistory, season } = useGameStore(
    useShallow((s) => ({
      rivals: s.rivals,
      ownerGrudges: s.ownerGrudges,
      newsletter: s.newsletter,
      arenaHistory: s.arenaHistory,
      season: s.season,
    }))
  );

  const rivalPerformance = useMemo(() => {
    return (rivals ?? [])
      .map((r) => {
        const stats = calculateStableStats(r.roster);
        return {
          id: r.owner.id,
          name: r.owner.stableName,
          philosophy: r.philosophy,
          winRate: stats.winRate,
          totalWins: stats.totalWins,
          totalLosses: stats.totalLosses,
          totalKills: stats.totalKills,
        };
      })
      .sort((a, b) => b.winRate - a.winRate);
  }, [rivals]);

  const seasonGazette = useMemo(() => {
    const summaries = (newsletter ?? []).filter((n) => n.title.endsWith('Season Summary'));
    if (summaries.length === 0) return [];
    const latest = summaries.reduce((best, n) => (n.week > best.week ? n : best));
    return latest.items;
  }, [newsletter]);

  const metaDrift = useMemo(() => computeMetaDrift(arenaHistory), [arenaHistory]);
  const metaEntries = useMemo(
    () =>
      Object.entries(metaDrift)
        .filter(([, v]) => v !== 0)
        .sort(([, a], [, b]) => b - a),
    [metaDrift]
  );
  const topStyle = metaEntries[0] ?? null;

  const grudges = ownerGrudges ?? [];

  if (!rivals?.length) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 px-1">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">
          SEASON SYNTHESIS · {season}
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-primary/20 via-border/20 to-transparent" />
      </div>

      {/* Divisional Standings */}
      <Surface variant="glass" padding="none" className="border-border/40 overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-neutral-900/60 flex items-center gap-3">
          <div className="p-1.5 rounded bg-arena-gold/10 border border-arena-gold/20">
            <Trophy className="h-3.5 w-3.5 text-arena-gold" />
          </div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">
            Divisional Standings
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-5 py-2 text-left font-black uppercase tracking-widest text-muted-foreground/60">
                  Stable
                </th>
                <th className="px-4 py-2 text-left font-black uppercase tracking-widest text-muted-foreground/60">
                  Doctrine
                </th>
                <th className="px-4 py-2 text-center font-black uppercase tracking-widest text-muted-foreground/60">
                  W
                </th>
                <th className="px-4 py-2 text-center font-black uppercase tracking-widest text-muted-foreground/60">
                  L
                </th>
                <th className="px-4 py-2 text-center font-black uppercase tracking-widest text-muted-foreground/60">
                  K
                </th>
                <th className="px-4 py-2 text-right font-black uppercase tracking-widest text-muted-foreground/60">
                  Win%
                </th>
              </tr>
            </thead>
            <tbody>
              {rivalPerformance.map((r, i) => (
                <tr
                  key={r.id}
                  className={cn(
                    'border-b border-white/5 transition-colors hover:bg-white/[0.02]',
                    i === 0 && 'bg-arena-gold/[0.03]'
                  )}
                >
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-2">
                      {i === 0 && <Trophy className="h-3 w-3 text-arena-gold shrink-0" />}
                      <span className="font-black text-foreground/80">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground/60 font-bold">
                    {r.philosophy ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 text-center font-mono font-black text-primary">
                    {r.totalWins}
                  </td>
                  <td className="px-4 py-2.5 text-center font-mono font-black text-destructive/70">
                    {r.totalLosses}
                  </td>
                  <td className="px-4 py-2.5 text-center font-mono font-black text-arena-blood">
                    {r.totalKills}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-black">
                    {Math.round(r.winRate * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Grudge Network */}
        <Surface variant="glass" padding="none" className="border-arena-blood/20 overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-arena-blood/5 flex items-center gap-3">
            <div className="p-1.5 rounded bg-arena-blood/10 border border-arena-blood/20">
              <Flame className="h-3.5 w-3.5 text-arena-blood" />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-arena-blood">
              Grudge Network
            </h3>
            <span className="ml-auto text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">
              {grudges.length} active
            </span>
          </div>
          <div className="p-4 space-y-2">
            {grudges.length === 0 ? (
              <p className="text-[10px] text-muted-foreground/40 italic py-4 text-center uppercase tracking-widest">
                No active grudges
              </p>
            ) : (
              grudges.map((g, i) => {
                const stableA =
                  rivals?.find((r) => r.owner.id === g.ownerIdA)?.owner.stableName ?? g.ownerIdA;
                const stableB =
                  rivals?.find((r) => r.owner.id === g.ownerIdB)?.owner.stableName ?? g.ownerIdB;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2 bg-white/[0.02] border border-white/5"
                  >
                    <div className="flex items-center gap-2 text-[10px] font-black min-w-0">
                      <span className="text-foreground/70 truncate">{stableA}</span>
                      <span className="text-muted-foreground/40 shrink-0">vs</span>
                      <span className="text-foreground/70 truncate">{stableB}</span>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0 ml-2">
                      {Array.from({ length: g.intensity }).map((_, j) => (
                        <Flame
                          key={j}
                          className="h-2.5 w-2.5 text-arena-blood"
                          style={{ opacity: 0.4 + j * 0.12 }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Surface>

        {/* Style of the Season */}
        <Surface variant="glass" padding="none" className="border-accent/10 overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-accent/5 flex items-center gap-3">
            <div className="p-1.5 rounded bg-accent/10 border border-accent/20">
              <TrendingUp className="h-3.5 w-3.5 text-accent" />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">
              Style of the Season
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {topStyle ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-display font-black uppercase tracking-tight text-foreground/80">
                    {STYLE_DISPLAY_NAMES[topStyle[0] as keyof typeof STYLE_DISPLAY_NAMES] ??
                      topStyle[0]}
                  </span>
                  <span
                    className={cn(
                      'text-[11px] font-black flex items-center',
                      getMetaColor(topStyle[1])
                    )}
                  >
                    {topStyle[1] > 0 ? (
                      <ArrowUpRight className="h-3 w-3 mr-0.5" />
                    ) : (
                      <ArrowDownLeft className="h-3 w-3 mr-0.5" />
                    )}
                    {getMetaLabel(topStyle[1])}
                  </span>
                </div>
                <div className="space-y-1.5 pt-1">
                  {metaEntries.slice(0, 5).map(([style, drift]) => (
                    <div key={style} className="flex items-center justify-between text-[9px]">
                      <span className="text-muted-foreground/60 font-black uppercase tracking-widest">
                        {STYLE_DISPLAY_NAMES[style as keyof typeof STYLE_DISPLAY_NAMES] ?? style}
                      </span>
                      <span className={cn('font-mono font-black', getMetaColor(drift))}>
                        {drift > 0 ? '+' : ''}
                        {drift.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-[10px] text-muted-foreground/40 italic py-4 text-center uppercase tracking-widest">
                Insufficient data
              </p>
            )}
          </div>
        </Surface>
      </div>

      {/* Season Declarations (owner narratives + philosophy events from gazette) */}
      {seasonGazette.length > 0 && (
        <Surface variant="glass" padding="none" className="border-border/40 overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-neutral-900/60 flex items-center gap-3">
            <div className="p-1.5 rounded bg-primary/10 border border-primary/20">
              <ScrollText className="h-3.5 w-3.5 text-primary" />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">
              Season Declarations
            </h3>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {seasonGazette.slice(0, 12).map((item, i) => (
              <div
                key={i}
                className="px-3 py-2 bg-white/[0.02] border border-white/5 text-[10px] text-foreground/70 italic leading-snug"
              >
                {item}
              </div>
            ))}
          </div>
        </Surface>
      )}
    </div>
  );
}
