import { useStableComparison } from '@/hooks/scouting/useStableComparison';
import {
  Shield,
  ArrowLeftRight,
  Swords,
  Trophy,
  Hexagon,
  Crosshair,
  BarChart3,
  AlertTriangle,
  Flame,
  BrainCircuit,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Surface } from '@/components/ui/Surface';
import type { RivalStableData } from '@/types/game';
import { ATTRIBUTE_KEYS, STYLE_DISPLAY_NAMES } from '@/types/game';
import { ComparisonBar } from './ComparisonBar';
import { ComparisonHeader } from './ComparisonHeader';
import { HeadToHead } from './HeadToHead';

interface StableComparisonProps {
  rivals: RivalStableData[];
}

function StableSelector({
  rivals,
  idA,
  setIdA,
  idB,
  setIdB,
}: {
  rivals: RivalStableData[];
  idA: string | null;
  setIdA: (id: string | null) => void;
  idB: string | null;
  setIdB: (id: string | null) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3 px-2">
          <div className="p-1 px-2 rounded-none bg-primary/10 border border-primary/20">
            <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">
              Asset Alpha
            </span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-primary/20 via-border/20 to-transparent" />
        </div>
        <div className="grid grid-cols-1 gap-1.5 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {rivals.map((r) => (
            <Tooltip key={r.owner.id}>
              <TooltipTrigger asChild>
                <button
                  aria-label={`Select ${r.owner.stableName} as Asset Alpha`}
                  onClick={() => setIdA(r.owner.id === idA ? null : r.owner.id)}
                  disabled={r.owner.id === idB}
                  className={cn(
                    'w-full text-left p-3 rounded-none border transition-all relative group/alpha outline-none',
                    idA === r.owner.id
                      ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]'
                      : r.owner.id === idB
                        ? 'border-white/5 opacity-10 cursor-not-allowed grayscale'
                        : 'border-white/5 bg-neutral-900/60 hover:border-white/20 hover:bg-white/5'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'h-8 w-8 flex items-center justify-center rounded-none border transition-all',
                          idA === r.owner.id
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-neutral-800 text-muted-foreground border-white/5'
                        )}
                      >
                        <Shield className="h-4 w-4" />
                      </div>
                      <span
                        className={cn(
                          'font-display font-black text-xs uppercase tracking-tight transition-colors',
                          idA === r.owner.id ? 'text-primary' : 'text-muted-foreground'
                        )}
                      >
                        {r.owner.stableName}
                      </span>
                    </div>
                    {idA === r.owner.id && (
                      <Hexagon className="h-3 w-3 text-primary animate-pulse" />
                    )}
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="left"
                className="bg-neutral-950 border-white/10 text-[9px] font-black uppercase tracking-widest"
              >
                ASSIGN ALPHA
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 px-2 text-right">
          <div className="h-px flex-1 bg-gradient-to-l from-accent/20 via-border/20 to-transparent" />
          <div className="p-1 px-2 rounded-none bg-accent/10 border border-accent/20">
            <span className="text-[9px] font-black text-accent uppercase tracking-[0.2em]">
              Asset Beta
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-1.5 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {rivals.map((r) => (
            <Tooltip key={r.owner.id}>
              <TooltipTrigger asChild>
                <button
                  aria-label={`Select ${r.owner.stableName} as Asset Beta`}
                  onClick={() => setIdB(r.owner.id === idB ? null : r.owner.id)}
                  disabled={r.owner.id === idA}
                  className={cn(
                    'w-full text-left p-3 rounded-none border transition-all relative group/beta outline-none',
                    idB === r.owner.id
                      ? 'border-accent bg-accent/10 shadow-[0_0_15px_rgba(var(--accent-rgb),0.2)]'
                      : r.owner.id === idA
                        ? 'border-white/5 opacity-10 cursor-not-allowed grayscale'
                        : 'border-white/5 bg-neutral-900/60 hover:border-white/20 hover:bg-white/5'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'h-8 w-8 flex items-center justify-center rounded-none border transition-all',
                          idB === r.owner.id
                            ? 'bg-accent text-primary-foreground border-accent'
                            : 'bg-neutral-800 text-muted-foreground border-white/5'
                        )}
                      >
                        <Shield className="h-4 w-4" />
                      </div>
                      <span
                        className={cn(
                          'font-display font-black text-xs uppercase tracking-tight transition-colors',
                          idB === r.owner.id ? 'text-accent' : 'text-muted-foreground'
                        )}
                      >
                        {r.owner.stableName}
                      </span>
                    </div>
                    {idB === r.owner.id && (
                      <Hexagon className="h-3 w-3 text-accent animate-pulse" />
                    )}
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className="bg-neutral-950 border-white/10 text-[9px] font-black uppercase tracking-widest"
              >
                ASSIGN BETA
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StableComparison({ rivals }: StableComparisonProps) {
  const {
    idA,
    setIdA,
    idB,
    setIdB,
    rivalA,
    rivalB,
    statsA,
    statsB,
    grudge,
    clashes,
    modsA,
    modsB,
    maxWins,
    maxKills,
    maxFame,
    maxRoster,
    maxAttr,
  } = useStableComparison(rivals);

  return (
    <div className="space-y-6">
      <StableSelector rivals={rivals} idA={idA} setIdA={setIdA} idB={idB} setIdB={setIdB} />

      {statsA && statsB && rivalA && rivalB && (
        <div className="space-y-6">
          <ComparisonHeader rivalA={rivalA} rivalB={rivalB} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Surface variant="glass" className="border-border/40 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-none bg-primary/10 border border-primary/20">
                  <BarChart3 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground leading-none mb-1">
                    Key Metrics
                  </h3>
                  <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-40">
                    System Efficiency Scan
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <ComparisonBar
                  label="Roster Size"
                  valA={statsA.rosterSize}
                  valB={statsB.rosterSize}
                  maxVal={maxRoster}
                  colorA="bg-primary"
                  colorB="bg-accent"
                />
                <ComparisonBar
                  label="Total Wins"
                  valA={statsA.totalWins}
                  valB={statsB.totalWins}
                  maxVal={maxWins}
                  colorA="bg-primary"
                  colorB="bg-accent"
                />
                <ComparisonBar
                  label="Win Rate %"
                  valA={statsA.winRate}
                  valB={statsB.winRate}
                  maxVal={100}
                  colorA="bg-primary"
                  colorB="bg-accent"
                />
                <ComparisonBar
                  label="Total Kills"
                  valA={statsA.totalKills}
                  valB={statsB.totalKills}
                  maxVal={maxKills}
                  colorA="bg-primary"
                  colorB="bg-accent"
                />
                <ComparisonBar
                  label="Total Fame"
                  valA={statsA.totalFame}
                  valB={statsB.totalFame}
                  maxVal={maxFame}
                  colorA="bg-primary"
                  colorB="bg-accent"
                />
              </div>
            </Surface>

            <Surface variant="glass" className="border-border/40 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-none bg-accent/10 border border-accent/20">
                  <Swords className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground leading-none mb-1">
                    Average Attributes
                  </h3>
                  <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-40">
                    Personnel Performance Matrix
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                {ATTRIBUTE_KEYS.map((key) => (
                  <ComparisonBar
                    key={key}
                    label={key}
                    valA={statsA.avgAttrs[key] ?? 0}
                    valB={statsB.avgAttrs[key] ?? 0}
                    maxVal={maxAttr}
                    colorA="bg-primary"
                    colorB="bg-accent"
                  />
                ))}
              </div>
            </Surface>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <Surface variant="glass" padding="none" className="border-primary/20 overflow-hidden">
              <div className="p-4 border-b border-white/5 bg-primary/5">
                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">
                  {rivalA.owner.stableName} Doctrines
                </h3>
              </div>
              <div className="p-4 space-y-1">
                {(Object.entries(statsA.styleCounts) as [string, number][])
                  .sort(([, a], [, b]) => b - a)
                  .map(([style, count]) => (
                    <div
                      key={style}
                      className="flex items-center justify-between py-1.5 px-2 rounded-none hover:bg-primary/5 transition-colors group/row"
                    >
                      <span className="text-[11px] font-bold text-foreground/80 group-hover/row:text-primary transition-colors">
                        {STYLE_DISPLAY_NAMES[style as keyof typeof STYLE_DISPLAY_NAMES] ?? style}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-8 bg-neutral-900 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary/40"
                            style={{ width: `${(count / statsA.rosterSize) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono font-black text-primary">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </Surface>
            <Surface variant="glass" padding="none" className="border-accent/20 overflow-hidden">
              <div className="p-4 border-b border-white/5 bg-accent/5 text-right">
                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-accent">
                  {rivalB.owner.stableName} Doctrines
                </h3>
              </div>
              <div className="p-4 space-y-1">
                {(Object.entries(statsB.styleCounts) as [string, number][])
                  .sort(([, a], [, b]) => b - a)
                  .map(([style, count]) => (
                    <div
                      key={style}
                      className="flex items-center justify-between py-1.5 px-2 rounded-none hover:bg-accent/5 transition-colors group/row"
                    >
                      <span className="text-[11px] font-bold text-foreground/80 group-hover/row:text-accent transition-colors">
                        {STYLE_DISPLAY_NAMES[style as keyof typeof STYLE_DISPLAY_NAMES] ?? style}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-8 bg-neutral-900 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent/40"
                            style={{ width: `${(count / statsB.rosterSize) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono font-black text-accent">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </Surface>
          </div>

          {(() => {
            function modLabel(val: number | undefined) {
              if (!val) return '0';
              return val > 0 ? `+${val}` : `${val}`;
            }

            return (
              <Surface
                variant="glass"
                padding="none"
                className="border-arena-gold/10 overflow-hidden"
              >
                <div className="p-4 border-b border-white/5 bg-arena-gold/5 flex items-center gap-3">
                  <div className="p-1.5 rounded-none bg-arena-gold/10 border border-arena-gold/20">
                    <BrainCircuit className="h-3.5 w-3.5 text-arena-gold" />
                  </div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-arena-gold">
                    Doctrine Intelligence
                  </h3>
                  {clashes && (
                    <div className="ml-auto flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-arena-gold/70">
                      <AlertTriangle className="h-3 w-3" />
                      Personality Clash Detected
                    </div>
                  )}
                  {grudge && (
                    <div className="ml-auto flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-arena-blood">
                      {Array.from({ length: grudge.intensity }).map((_, i) => (
                        <Flame key={i} className="h-3 w-3" style={{ opacity: 0.4 + i * 0.12 }} />
                      ))}
                      Active Grudge · {grudge.reason}
                    </div>
                  )}
                </div>
                <div className="p-6 grid grid-cols-2 gap-8">
                  {[
                    {
                      rival: rivalA,
                      mods: modsA,
                      color: 'text-primary',
                      borderColor: 'border-primary/20',
                      bgColor: 'bg-primary/5',
                    },
                    {
                      rival: rivalB,
                      mods: modsB,
                      color: 'text-accent',
                      borderColor: 'border-accent/20',
                      bgColor: 'bg-accent/5',
                    },
                  ].map(({ rival, mods, color, borderColor, bgColor }) => (
                    <div
                      key={rival.owner.id}
                      className={cn('p-4 border rounded-none', borderColor, bgColor)}
                    >
                      <div
                        className={cn(
                          'text-[9px] font-black uppercase tracking-widest mb-3 opacity-60',
                          color
                        )}
                      >
                        {rival.owner.stableName}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-muted-foreground/60 font-black uppercase tracking-widest">
                            Personality
                          </span>
                          <span className={cn('font-black', color)}>{rival.owner.personality}</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-muted-foreground/60 font-black uppercase tracking-widest">
                            Philosophy
                          </span>
                          <span className="font-black text-foreground/80">
                            {rival.philosophy ?? '—'}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-muted-foreground/60 font-black uppercase tracking-widest">
                            Adaptation
                          </span>
                          <span className="font-black text-foreground/60">
                            {rival.owner.metaAdaptation ?? '—'}
                          </span>
                        </div>
                        {Object.keys(mods).length > 0 && (
                          <div className="mt-3 pt-3 border-t border-white/5 space-y-1">
                            <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mb-2">
                              Combat Modifiers
                            </div>
                            {(mods as Record<string, number | undefined>).OE !== undefined && (
                              <div className="flex justify-between text-[9px]">
                                <span className="text-muted-foreground/50">Offensive Effort</span>
                                <span
                                  className={cn(
                                    'font-mono font-black',
                                    (mods as any).OE > 0 ? 'text-arena-blood' : 'text-sky-400'
                                  )}
                                >
                                  {modLabel((mods as any).OE)}
                                </span>
                              </div>
                            )}
                            {(mods as Record<string, number | undefined>).AL !== undefined && (
                              <div className="flex justify-between text-[9px]">
                                <span className="text-muted-foreground/50">Activity Level</span>
                                <span
                                  className={cn(
                                    'font-mono font-black',
                                    (mods as any).AL > 0 ? 'text-arena-blood' : 'text-sky-400'
                                  )}
                                >
                                  {modLabel((mods as any).AL)}
                                </span>
                              </div>
                            )}
                            {(mods as Record<string, number | undefined>).killDesire !==
                              undefined && (
                              <div className="flex justify-between text-[9px]">
                                <span className="text-muted-foreground/50">Kill Desire</span>
                                <span
                                  className={cn(
                                    'font-mono font-black',
                                    (mods as any).killDesire > 0
                                      ? 'text-arena-blood'
                                      : 'text-sky-400'
                                  )}
                                >
                                  {modLabel((mods as any).killDesire)}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Surface>
            );
          })()}

          <Surface variant="glass" padding="none" className="border-border/40 overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-neutral-900/60 flex items-center gap-3">
              <div className="p-1.5 rounded-none bg-arena-gold/10 border border-arena-gold/20">
                <Trophy className="h-3.5 w-3.5 text-arena-gold" />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">
                Dominant Combatants
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-8">
                {[statsA.topWarrior, statsB.topWarrior].map((w, i) => (
                  <div
                    key={i}
                    className={cn(
                      'p-4 rounded-none border relative overflow-hidden transition-all hover:scale-[1.02]',
                      i === 0 ? 'border-primary/20 bg-primary/5' : 'border-accent/20 bg-accent/5'
                    )}
                  >
                    {w ? (
                      <>
                        <div
                          className={cn(
                            'text-[8px] font-black uppercase tracking-widest mb-2 opacity-60',
                            i === 0 ? 'text-primary' : 'text-accent'
                          )}
                        >
                          {i === 0 ? 'ELITE ALPHA' : 'ELITE BETA'}
                        </div>
                        <div className="font-display text-lg font-black text-foreground mb-1 leading-none">
                          {w.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-4 opacity-40">
                          {STYLE_DISPLAY_NAMES[w.style as keyof typeof STYLE_DISPLAY_NAMES] ??
                            w.style}
                        </div>
                        <div className="flex gap-4 items-center">
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mb-0.5">
                              Record
                            </span>
                            <span className="text-xs font-mono font-black">
                              {w.career.wins}W-{w.career.losses}L
                            </span>
                          </div>
                          <div className="h-6 w-px bg-white/5" />
                          {w.career.kills > 0 && (
                            <div className="flex flex-col">
                              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mb-0.5">
                                Fatalities
                              </span>
                              <span className="text-xs font-mono font-black text-arena-blood">
                                {w.career.kills}K
                              </span>
                            </div>
                          )}
                          <div className="flex flex-col ml-auto text-right">
                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mb-0.5">
                              Prestige
                            </span>
                            <span className="text-xs font-mono font-black text-arena-gold">
                              {w.fame ?? 0}G
                            </span>
                          </div>
                        </div>
                        <div
                          className={cn(
                            'absolute top-2 right-2 p-2 rounded-none bg-black/20 opacity-20',
                            i === 0 ? 'text-primary' : 'text-accent'
                          )}
                        >
                          <Crosshair className="h-4 w-4" />
                        </div>
                      </>
                    ) : (
                      <div className="py-10 text-center flex flex-col items-center gap-2 opacity-20">
                        <Hexagon className="h-8 w-8 text-muted-foreground" />
                        <p className="text-[10px] font-black uppercase tracking-widest">
                          No Active Signals
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Surface>

          <HeadToHead rosterA={rivalA.roster} rosterB={rivalB.roster} />
        </div>
      )}

      {(!statsA || !statsB) && (
        <Surface
          variant="glass"
          className="py-24 text-center border-dashed border-border/40 flex flex-col items-center gap-4"
        >
          <Crosshair className="h-12 w-12 text-muted-foreground opacity-20" />
          <div className="space-y-1">
            <p className="text-sm font-display font-black uppercase tracking-tight text-muted-foreground">
              Comparative Targeting Inactive
            </p>
            <p className="text-xs text-muted-foreground/60 italic">
              Select two rival stables from the tactile grid to begin benchmarking protocols.
            </p>
          </div>
        </Surface>
      )}
    </div>
  );
}
