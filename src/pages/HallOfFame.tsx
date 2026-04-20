/**
 * Stable Lords — Hall of Fame Page
 * shows yearly accolades and global legends.
 */
import { useMemo } from "react";
import { useGameStore } from "@/state/useGameStore";
import { ArenaHistory } from "@/engine/history/arenaHistory";
import type { Warrior, AnnualAward } from "@/types/game";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, Shield, Flame, Trophy, Users } from "lucide-react";
import { InducteeCard } from "./HallOfFame/InducteeCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Surface } from "@/components/ui/Surface";
import { motion } from "framer-motion";

export default function HallOfFame() {
  const { 
    roster, graveyard, retired, rivals, awards, year, player 
  } = useGameStore();
  const allFights = useMemo(() => ArenaHistory.all(), []);

  // Aggregate all warriors for lookup
  const allWarriors = useMemo(() => {
    const list: Warrior[] = [
      ...roster,
      ...graveyard,
      ...retired,
      ...(rivals ?? []).flatMap(r => r.roster),
    ];
    return list;
  }, [roster, graveyard, retired, rivals]);

  // Categorize awards from the official source (state.awards)
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

  // All-time greats (Top Fame)
  const allTimeGreats = useMemo(() => {
    return [...allWarriors]
      .filter(w => w.career.wins + w.career.losses > 0)
      .sort((a, b) => (b.fame ?? 0) - (a.fame ?? 0))
      .slice(0, 6);
  }, [allWarriors]);

  const awardIcon = (type: string) => {
    switch (type) {
      case "WARRIOR_OF_YEAR": return <Crown className="h-4 w-4 text-arena-gold" />;
      case "KILLER_OF_YEAR": return <Shield className="h-4 w-4 text-arena-blood" />;
      case "STABLE_OF_YEAR": return <Trophy className="h-4 w-4 text-primary" />;
      default: return <Star className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const currentYear = year;

  return (
    <div className="space-y-8">
      <PageHeader
        icon={Crown}
        title="Hall of Fame"
        subtitle={`IMPERIAL · LEGENDS · YEAR ${currentYear}`}
      />
      {/* Yearly Awards Section */}
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
                if (award.type === "STABLE_OF_YEAR") {
                  return (
                    <motion.div key={i} whileHover={{ y: -5 }}>
                      <Surface variant="gold" padding="none" className="overflow-hidden relative group h-full">
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
                                LEADER: {player.stableName === award.stableName ? player.name : "RIVAL_OWNER"}
                              </div>
                            </div>
                            <Badge variant="outline" className="text-[9px] font-black tracking-widest uppercase text-primary border-primary/20 py-1 px-2">
                              STABLE_OF_YEAR
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

                const warrior = allWarriors.find(w => w.id === award.warriorId);
                if (!warrior) return null;

                return (
                  <InducteeCard
                    key={i}
                    warrior={warrior}
                    title={award.type.replace(/_/g, " ")}
                    icon={awardIcon(award.type)}
                    fights={allFights}
                  />
                );
              })}
            </div>
          </article>
        ))
      ) : (
        /* No awards yet - show all-time greats */
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
                  title={i === 0 ? "RANK #1" : `RANK #${i + 1}`}
                  icon={i === 0 ? <Crown className="h-4 w-4 text-arena-gold" /> : <Star className="h-4 w-4 text-muted-foreground" />}
                  fights={allFights}
                />
              ))
            ) : (
              <Card className="border-dashed col-span-full">
                <CardContent className="py-12 text-center">
                  <Crown className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <p className="text-muted-foreground text-sm uppercase font-black tracking-widest">Awaiting First Legends...</p>
                  <p className="text-muted-foreground text-[10px] mt-1">THE SANDS REMEMBER NO ONE YET.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
