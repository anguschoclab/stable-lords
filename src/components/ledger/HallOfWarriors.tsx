import { useWorldState } from '@/state/useGameStore';
import { Surface } from '@/components/ui/Surface';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatBadge } from '@/components/ui/WarriorBadges';
import { Trophy, Landmark, Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function HallOfWarriors() {
  const state = useWorldState();
  const retired = state.retired ?? [];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ─── Legendary Veterans ─── */}
      <section className="space-y-6">
        <div className="flex items-center gap-4 px-1">
          <div className="p-2.5 rounded-none bg-arena-gold/10 border border-arena-gold/20 shadow-[0_0_15px_rgba(255,215,0,0.1)]">
            <Trophy className="h-5 w-5 text-arena-gold" />
          </div>
          <div>
            <h3 className="font-display text-lg font-black uppercase tracking-tight text-arena-gold">
              Legends_Registry_Eminent
            </h3>
            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">
              Immortal_Status // Assets_Recovered: {retired.length}
            </p>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-arena-gold/20 via-border/5 to-transparent mx-8 hidden md:block" />
        </div>

        <Surface
          variant="glass"
          padding="none"
          className="border-arena-gold/20 bg-arena-gold/5 shadow-[0_0_40px_rgba(255,215,0,0.03)] overflow-hidden relative"
        >
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-arena-gold/40 via-transparent to-transparent opacity-40" />

          <div className="overflow-x-auto custom-scrollbar">
            {retired.length === 0 ? (
              <div className="py-24 text-center opacity-30 group">
                <Landmark className="h-16 w-16 mx-auto mb-4 text-arena-gold/40 group-hover:scale-110 transition-transform duration-700" />
                <p className="text-sm font-display font-black uppercase tracking-[0.3em]">
                  Registry_Currently_Vacant
                </p>
                <p className="text-[10px] lowercase italic font-medium mt-2">
                  No warriors have earned retirement status through merit or tenure...
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-arena-gold/10 sticky top-0 z-10 backdrop-blur-md">
                  <TableRow className="hover:bg-transparent border-arena-gold/10">
                    <TableHead className="font-black uppercase text-[10px] tracking-widest pl-8 py-4 text-arena-gold/70">
                      Legendary_Asset
                    </TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-arena-gold/50 py-4">
                      Martial_Discipline
                    </TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-center text-arena-gold/50 py-4">
                      Imperial_Medals
                    </TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-center text-arena-gold/50 py-4">
                      Final_Record
                    </TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-right text-arena-gold/50 py-4">
                      Fame_Manifest
                    </TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-right pr-8 py-4 text-arena-gold/50">
                      Registry_Exit
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {retired.map((w) => (
                    <TableRow
                      key={w.id}
                      className="border-arena-gold/5 hover:bg-arena-gold/5 transition-all group"
                    >
                      <TableCell className="pl-8 py-5">
                        <div className="flex flex-col">
                          <span>{w.name}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Sparkles className="h-2.5 w-2.5 text-arena-gold/40" />
                            <span className="text-[8px] font-black text-arena-gold/40 uppercase tracking-widest">
                              RANK: EMERITUS
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-5">
                        <StatBadge styleName={w.style as import('@/types/game').FightingStyle} />
                      </TableCell>
                      <TableCell className="py-5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {w.career?.medals && (
                            <>
                              {w.career.medals.gold ? (
                                <span className="p-1 rounded-none bg-arena-gold/20 text-arena-gold text-[10px] font-black">
                                  G·{w.career.medals.gold}
                                </span>
                              ) : null}
                              {w.career.medals.silver ? (
                                <span className="p-1 rounded-none bg-foreground/10 text-muted-foreground text-[10px] font-black">
                                  S·{w.career.medals.silver}
                                </span>
                              ) : null}
                              {w.career.medals.bronze ? (
                                <span className="p-1 rounded-none bg-arena-gold/10 text-arena-gold text-[10px] font-black">
                                  B·{w.career.medals.bronze}
                                </span>
                              ) : null}
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-center gap-3 text-xs font-mono font-black">
                              <span className="text-arena-pop border-b border-arena-pop/20">
                                {w.career.wins}W
                              </span>
                              <span className="text-foreground/20">/</span>
                              <span className="text-destructive/60">{w.career.losses}L</span>
                              <span className="text-foreground/20">/</span>
                              <span className="text-arena-gold drop-shadow-[0_0_5px_rgba(255,215,0,0.3)]">
                                {w.career.kills}K
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-neutral-950 border-white/10 text-[9px] font-black tracking-widest">
                            Final Career Record
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-right py-5">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center justify-end gap-1.5 text-sm font-mono font-black text-arena-gold drop-shadow-[0_0_10px_rgba(255,215,0,0.2)]">
                            <span>{w.fame.toLocaleString()}</span>
                            <Trophy className="h-3 w-3 opacity-40" />
                          </div>
                          <span className="text-[8px] font-black text-arena-gold/30 uppercase tracking-widest mt-0.5">
                            LEGACY_FAME
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8 py-5">
                        <div className="flex flex-col items-end">
                          <span className="font-mono font-black text-[10px] text-foreground/40 uppercase tracking-widest group-hover:text-foreground/60 transition-colors">
                            WK_{w.retiredWeek?.toString().padStart(2, '0') ?? '??'}
                          </span>
                          <span className="text-[8px] font-black text-foreground/20 uppercase tracking-widest">
                            Cessation_Week
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Surface>
      </section>
    </div>
  );
}
