/**
 * Stable Lords — Hall of Fame & Graveyard
 * shows yearly accolades, global legends, and fallen warriors.
 */
import { useMemo } from 'react';
import { useGameStore } from '@/state/useGameStore';
import { ArenaHistory } from '@/engine/history/arenaHistory';
import type { Warrior, AnnualAward } from '@/types/game';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Crown,
  Star,
  Shield,
  Flame,
  Trophy,
  Users,
  Skull,
  Zap,
  Crosshair,
  Activity,
} from 'lucide-react';
import { InducteeCard } from './HallOfFame/InducteeCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { Surface } from '@/components/ui/Surface';
import { WarriorLink } from '@/components/EntityLink';
import { STYLE_DISPLAY_NAMES, FightingStyle } from '@/types/game';
import { motion } from 'framer-motion';
import FightsList from '@/components/awards/FightsList';
import UpsetsList, { type UpsetEntry } from '@/components/awards/UpsetsList';

export default function HallOfFame() {
  const { roster, graveyard, retired, rivals, awards, year, player, season } = useGameStore();
  const allFights = useMemo(() => ArenaHistory.all(), []);

  const allWarriors = useMemo(() => {
    const list: Warrior[] = [
      ...roster,
      ...graveyard,
      ...retired,
      ...(rivals ?? []).flatMap((r) => r.roster),
    ];
    return list;
  }, [roster, graveyard, retired, rivals]);

  const yearlyAwards = useMemo(() => {
    const groups: Record<number, AnnualAward[]> = {};
    for (const award of awards || []) {
      if (!groups[award.year]) groups[award.year] = [];
      groups[award.year].push(award);
    }
    return Object.entries(groups)
      .map(([y, aws]) => ({ year: parseInt(y), awards: aws }))
      .sort((a, b) => b.year - a.year);
  }, [awards]);

  const allTimeGreats = useMemo(() => {
    return [...allWarriors]
      .filter((w) => w.career.wins + w.career.losses > 0)
      .sort((a, b) => (b.fame ?? 0) - (a.fame ?? 0))
      .slice(0, 6);
  }, [allWarriors]);

  const myFallen = graveyard.filter((w) => w.stableId === player.id);

  const fameByWarriorId = useMemo(() => {
    const map = new Map<string, number>();
    for (const w of allWarriors) map.set(w.id, w.fame ?? 0);
    return map;
  }, [allWarriors]);

  const getFightsForYear = (yr: number) => {
    const weekStart = (yr - 1) * 52 + 1;
    const weekEnd = yr * 52;
    return allFights.filter((f) => f.week >= weekStart && f.week <= weekEnd);
  };

  const getUpsetsForYear = (yr: number): UpsetEntry[] => {
    return getFightsForYear(yr)
      .map((f) => {
        const fameA = fameByWarriorId.get(f.warriorIdA ?? '') ?? 0;
        const fameD = fameByWarriorId.get(f.warriorIdD ?? '') ?? 0;
        const winnerName = f.winner === 'A' ? f.a : f.d;
        const loserName = f.winner === 'A' ? f.d : f.a;
        const winnerFame = f.winner === 'A' ? fameA : fameD;
        const loserFame = f.winner === 'A' ? fameD : fameA;
        const fameDiff = loserFame - winnerFame;
        return { winner: winnerName, loser: loserName, by: f.by, fameDiff, week: f.week };
      })
      .filter((u) => u.fameDiff >= 10)
      .sort((a, b) => b.fameDiff - a.fameDiff)
      .slice(0, 5);
  };

  const awardIcon = (type: string) => {
    switch (type) {
      case 'WARRIOR_OF_YEAR':
        return <Crown className="h-4 w-4 text-arena-gold" />;
      case 'KILLER_OF_YEAR':
        return <Shield className="h-4 w-4 text-arena-blood" />;
      case 'STABLE_OF_YEAR':
        return <Trophy className="h-4 w-4 text-primary" />;
      default:
        return <Star className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        icon={Crown}
        title="History"
        subtitle={`IMPERIAL · LEGENDS & FALLEN · YEAR ${year}`}
        actions={
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                Fallen
              </span>
              <span className="text-xl font-mono font-black text-destructive">
                {graveyard.length}
              </span>
            </div>
            <div className="w-px h-8 bg-border/20" />
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                My Fallen
              </span>
              <span className="text-xl font-mono font-black text-primary">{myFallen.length}</span>
            </div>
          </div>
        }
      />

      <Tabs defaultValue="halloffame" className="w-full">
        <TabsList className="bg-secondary/20 p-1 rounded-none h-12 w-full sm:w-auto">
          <TabsTrigger
            value="halloffame"
            className="flex-1 rounded-none gap-2 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
          >
            <Crown className="h-3.5 w-3.5" /> Hall of Fame
          </TabsTrigger>
          <TabsTrigger
            value="graveyard"
            className="flex-1 rounded-none gap-2 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-destructive data-[state=active]:text-primary-foreground transition-all"
          >
            <Skull className="h-3.5 w-3.5" /> Graveyard
          </TabsTrigger>
        </TabsList>

        {/* ── Hall of Fame ── */}
        <TabsContent value="halloffame" className="mt-8 space-y-8">
          {yearlyAwards.length > 0 ? (
            yearlyAwards.map(({ year, awards }) => (
              <article key={year} className="space-y-6">
                <div className="flex items-end gap-3 border-b-2 border-accent/30 pb-2">
                  <h2 className="font-display text-xl text-foreground leading-none flex items-center gap-2 uppercase tracking-tighter">
                    <Star className="h-5 w-5 text-arena-gold" /> Year {year} Accolades
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {awards.map((award, i) => {
                    if (award.type === 'STABLE_OF_YEAR') {
                      return (
                        <motion.div key={i} whileHover={{ y: -5 }}>
                          <Surface
                            variant="gold"
                            padding="none"
                            className="overflow-hidden relative group h-full"
                          >
                            <div className="absolute top-0 left-0 w-full h-1 bg-primary opacity-40" />
                            <CardContent className="p-6 space-y-4">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-none border bg-primary/10 border-primary/30">
                                      <Users className="h-4 w-4 text-primary" />
                                    </div>
                                    <span className="font-display font-black text-xl uppercase tracking-tighter text-foreground group-hover:text-primary transition-colors">
                                      {award.stableName}
                                    </span>
                                  </div>
                                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                                    Leader:{' '}
                                    {player.stableName === award.stableName
                                      ? player.name
                                      : 'Rival Owner'}
                                  </div>
                                </div>
                                <Badge
                                  variant="outline"
                                  className="text-[9px] font-black tracking-widest uppercase text-primary border-primary/20 py-1 px-2"
                                >
                                  Stable of the Year
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground italic border-l-2 border-primary/20 pl-3 py-1">
                                "{award.reason}"
                              </p>
                            </CardContent>
                          </Surface>
                        </motion.div>
                      );
                    }
                    const warrior = allWarriors.find((w) => w.id === award.warriorId);
                    if (!warrior) return null;
                    return (
                      <InducteeCard
                        key={i}
                        warrior={warrior}
                        title={award.type.replace(/_/g, ' ')}
                        icon={awardIcon(award.type)}
                        fights={allFights}
                      />
                    );
                  })}
                </div>

                {/* ── Year fight highlights ── */}
                {(() => {
                  const yearFights = getFightsForYear(year);
                  const yearUpsets = getUpsetsForYear(year);
                  if (yearFights.length === 0) return null;
                  return (
                    <div className="border-t border-border/20 pt-4 space-y-3">
                      <FightsList fights={yearFights} />
                      <UpsetsList upsets={yearUpsets} />
                    </div>
                  );
                })()}
              </article>
            ))
          ) : (
            <div className="space-y-6">
              <div className="flex items-end gap-3 border-b-2 border-accent/30 pb-2">
                <h2 className="font-display text-xl text-foreground leading-none flex items-center gap-2">
                  <Flame className="h-5 w-5 text-arena-gold" /> All-Time Greats
                </h2>
                <span className="text-[10px] text-muted-foreground font-mono mb-0.5 uppercase">
                  First Annual Inductions at Week 52
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {allTimeGreats.length > 0 ? (
                  allTimeGreats.map((w, i) => (
                    <InducteeCard
                      key={w.id}
                      warrior={w}
                      title={i === 0 ? 'RANK #1' : `RANK #${i + 1}`}
                      icon={
                        i === 0 ? (
                          <Crown className="h-4 w-4 text-arena-gold" />
                        ) : (
                          <Star className="h-4 w-4 text-muted-foreground" />
                        )
                      }
                      fights={allFights}
                    />
                  ))
                ) : (
                  <Card className="border-dashed col-span-full">
                    <CardContent className="py-12 text-center">
                      <Crown className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                      <p className="text-muted-foreground text-sm uppercase font-black tracking-widest">
                        Awaiting First Legends...
                      </p>
                      <p className="text-muted-foreground text-[10px] mt-1">
                        The sands remember no one yet.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Graveyard ── */}
        <TabsContent value="graveyard" className="mt-8">
          <Tabs defaultValue="memorial" className="w-full">
            <TabsList className="bg-secondary/20 p-1 rounded-none h-10 w-full sm:w-auto mb-8">
              <TabsTrigger
                value="memorial"
                className="flex-1 rounded-none gap-2 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                <Zap className="h-3 w-3" /> My Fallen ({myFallen.length})
              </TabsTrigger>
              <TabsTrigger
                value="world"
                className="flex-1 rounded-none gap-2 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-destructive data-[state=active]:text-primary-foreground transition-all"
              >
                <Skull className="h-3 w-3" /> World Cemetery ({graveyard.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="memorial">
              <FallenGrid
                warriors={myFallen}
                season={season}
                emptyTitle="The Soil is Unbroken"
                emptyDesc="None of your warriors have fallen... yet."
              />
            </TabsContent>
            <TabsContent value="world">
              <FallenGrid
                warriors={graveyard}
                season={season}
                emptyTitle="Sands of Peace"
                emptyDesc="No blood has been spilled in this realm."
              />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FallenGrid({
  warriors,
  season,
  emptyTitle,
  emptyDesc,
}: {
  warriors: Warrior[];
  season: string;
  emptyTitle: string;
  emptyDesc: string;
}) {
  if (warriors.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Surface
          variant="glass"
          className="text-center py-32 border-2 border-border/20 border-dashed flex flex-col items-center"
        >
          <Shield className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
          <h3 className="text-xl font-display font-black uppercase tracking-tight">{emptyTitle}</h3>
          <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">{emptyDesc}</p>
        </Surface>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {warriors.map((w, idx) => (
        <motion.div
          key={w.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
        >
          <Surface
            variant="glass"
            padding="none"
            className="group relative border-border/40 overflow-hidden hover:border-destructive/40 transition-all duration-500 shadow-2xl h-full flex flex-col"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-destructive via-destructive/40 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
            <div className="p-8 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-8">
                <div className="flex flex-col">
                  <WarriorLink
                    name={w.name}
                    id={w.id}
                    className="font-display font-black text-2xl uppercase tracking-tighter group-hover:text-destructive transition-colors"
                  />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/50 mt-1">
                    {STYLE_DISPLAY_NAMES[w.style as FightingStyle]}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge
                    variant="outline"
                    className="text-[9px] font-black tracking-widest text-destructive bg-destructive/10 border-destructive/30 uppercase py-1 px-3"
                  >
                    Terminated
                  </Badge>
                  {(w.career?.medals?.gold ?? 0) > 0 && (
                    <Badge className="bg-arena-gold text-black text-[8px] font-black tracking-widest px-2">
                      Champion
                    </Badge>
                  )}
                </div>
              </div>

              <Surface variant="blood" className="p-5 mb-8 relative border-destructive/10">
                <Skull className="absolute top-3 right-3 w-12 h-12 text-destructive/5 pointer-events-none" />
                <p className="text-xs text-foreground/90 italic font-medium leading-relaxed mb-4 pr-8">
                  "
                  {w.deathEvent?.deathSummary ||
                    w.causeOfDeath ||
                    w.deathCause ||
                    'Fatal injury sustained during tactical engagement.'}
                  "
                </p>
                <div className="space-y-3 border-t border-destructive/10 pt-4 mt-auto">
                  <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                    <Crosshair className="w-3.5 h-3.5 text-destructive" />
                    {w.killedBy ? (
                      <>
                        Fatal strike by: <span className="text-foreground">{w.killedBy}</span>
                      </>
                    ) : (
                      <>Killed in arena combat</>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono font-black text-muted-foreground/30">
                    <span>
                      Week {w.deathWeek || '??'} · {season?.toUpperCase()}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Activity className="h-3 w-3" /> Remains recovered
                    </span>
                  </div>
                </div>
              </Surface>

              <div className="grid grid-cols-2 gap-4 mt-auto">
                <div className="bg-white/[0.02] p-4 border border-white/5 text-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 block mb-1">
                    Service Record
                  </span>
                  <span className="text-sm font-mono font-black">
                    {w.career?.wins || 0}W-{w.career?.losses || 0}L-{w.career?.kills || 0}K
                  </span>
                </div>
                <div className="bg-white/[0.02] p-4 border border-white/5 text-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 block mb-1">
                    Final Fame
                  </span>
                  <span className="text-sm font-mono font-black text-arena-gold">{w.fame}G</span>
                </div>
              </div>

              {w.career?.medals &&
                (w.career.medals.gold > 0 ||
                  w.career.medals.silver > 0 ||
                  w.career.medals.bronze > 0) && (
                  <div className="flex flex-wrap gap-2 pt-6 mt-6 border-t border-white/5">
                    {w.career.medals.gold > 0 && (
                      <span className="text-[9px] uppercase font-black tracking-widest text-arena-gold bg-arena-gold/10 px-2.5 py-1.5 border border-arena-gold/20">
                        GOLD · VALOR
                      </span>
                    )}
                    {w.career.medals.silver > 0 && (
                      <span className="text-[9px] uppercase font-black tracking-widest text-muted-foreground bg-foreground/5 px-2.5 py-1.5 border border-border/20">
                        SILVER · TOKEN
                      </span>
                    )}
                    {w.career.medals.bronze > 0 && (
                      <span className="text-[9px] uppercase font-black tracking-widest text-arena-gold bg-arena-gold/10 px-2.5 py-1.5 border border-arena-gold/20">
                        BRONZE · ELITE
                      </span>
                    )}
                  </div>
                )}
            </div>
          </Surface>
        </motion.div>
      ))}
    </div>
  );
}
