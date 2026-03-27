/**
 * Stable Lords — Hall of Fame Page
 * Shows yearly inductees with career stats and greatest fights.
 */
import { useMemo } from "react";
import { useGameStore } from "@/state/useGameStore";
import { ArenaHistory } from "@/engine/history/arenaHistory";
import type { Warrior, FightSummary, NewsletterItem } from "@/types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Crown, Skull, Star, Shield, Flame, Swords, Trophy, Activity } from "lucide-react";
import { InducteeCard } from "./HallOfFame/InducteeCard";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

/* ── Main Page ───────────────────────────────────────────── */

export default function HallOfFame() {
  const { state } = useGameStore();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allFights = useMemo(() => ArenaHistory.all(), [state.week]);

  // Collect all warriors (active, dead, retired)
  const allWarriors = useMemo(() => {
    const list: Warrior[] = [
      ...state.roster,
      ...state.graveyard,
      ...state.retired,
      ...(state.rivals ?? []).flatMap(r => r.roster),
    ];
    return list;
  }, [state]);

  // Parse yearly induction newsletters
  const yearlyInductions = useMemo(() => {
    const years: { year: number; items: string[]; warriors: { warrior: Warrior; title: string; icon: React.ReactNode }[] }[] = [];
    
    for (const nl of state.newsletter) {
      if (!nl.title.includes("Hall of Fame")) continue;
      const yearMatch = nl.title.match(/Year (\d+)/);
      const year = yearMatch ? parseInt(yearMatch[1]) : 0;

      const inductees: { warrior: Warrior; title: string; icon: React.ReactNode }[] = [];

      for (const item of nl.items) {
        // Extract warrior name from structured messages
        if (item.includes("HALL OF FAME:")) {
          const nameMatch = item.match(/HALL OF FAME: (.+?) \(/);
          if (nameMatch) {
            const w = allWarriors.find(w => w.name === nameMatch[1]);
            if (w) inductees.push({ warrior: w, title: "Greatest Warrior", icon: <Crown className="h-4 w-4 text-arena-gold" /> });
          }
        } else if (item.includes("DEADLIEST BLADE:")) {
          const nameMatch = item.match(/DEADLIEST BLADE: (.+?) earns/);
          if (nameMatch) {
            const w = allWarriors.find(w => w.name === nameMatch[1]);
            if (w) inductees.push({ warrior: w, title: "Deadliest Blade", icon: <Skull className="h-4 w-4 text-arena-blood" /> });
          }
        } else if (item.includes("IRON CHAMPION:")) {
          const nameMatch = item.match(/IRON CHAMPION: (.+?) recorded/);
          if (nameMatch) {
            const w = allWarriors.find(w => w.name === nameMatch[1]);
            if (w) inductees.push({ warrior: w, title: "Iron Champion", icon: <Shield className="h-4 w-4 text-primary" /> });
          }
        }
      }

      years.push({ year, items: nl.items, warriors: inductees });
    }

    return years.sort((a, b) => b.year - a.year);
  }, [state.newsletter, allWarriors]);

  // All-time greats (if no yearly data yet, show current top warriors)
  const allTimeGreats = useMemo(() => {
    const sorted = [...allWarriors]
      .filter(w => w.career.wins + w.career.losses > 0)
      .sort((a, b) => (b.fame ?? 0) - (a.fame ?? 0))
      .slice(0, 6);
    return sorted;
  }, [allWarriors]);

  const currentYear = Math.floor(state.week / 52);

  return (
    <div className="space-y-8">
      {/* Masthead */}
      <div className="text-center space-y-4 py-8 relative overflow-hidden bg-glass-card rounded-3xl border border-border/40">
        <div className="absolute inset-0 bg-gradient-to-b from-arena-gold/5 to-transparent pointer-events-none" />
        <div className="flex items-center justify-center gap-4 relative z-10">
          <Separator className="w-16 bg-arena-gold/20" />
          <div className="p-3 rounded-full bg-arena-gold/10 border border-arena-gold/20 shadow-[0_0_20px_rgba(var(--arena-gold-rgb),0.2)]">
            <Crown className="h-8 w-8 text-arena-gold" />
          </div>
          <Separator className="w-16 bg-arena-gold/20" />
        </div>
        <div className="relative z-10">
          <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tighter text-foreground uppercase">
            Hall of Fame
          </h1>
          <p className="text-[10px] text-muted-foreground font-black tracking-[0.4em] uppercase opacity-60 mt-2">
            LEGENDS_OF_THE_ARENA · ETERNAL_CHRONICLE
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 relative z-10">
          <Badge variant="outline" className="text-[10px] font-black tracking-widest uppercase border-arena-gold/20 bg-arena-gold/5 text-arena-gold">
            YEAR {currentYear + 1}
          </Badge>
          <Separator orientation="vertical" className="h-4 bg-border/20" />
          <Badge variant="outline" className="text-[10px] font-black tracking-widest uppercase border-primary/20 bg-primary/5 text-primary">
            WEEK {state.week}
          </Badge>
        </div>
      </div>

      {/* Yearly Inductions */}
      {yearlyInductions.length > 0 ? (
        yearlyInductions.map(({ year, items, warriors }) => (
          <article key={year} className="space-y-4">
            <div className="flex items-end gap-3 border-b-2 border-accent/30 pb-2">
              <h2 className="font-display text-xl text-foreground leading-none flex items-center gap-2">
                <Star className="h-5 w-5 text-arena-gold" /> Year {year} Inductees
              </h2>
            </div>

            {warriors.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {warriors.map((entry, i) => (
                  <InducteeCard key={i} warrior={entry.warrior} title={entry.title} icon={entry.icon} fights={allFights} />
                ))}
              </div>
            ) : (
              /* Fallback: show raw newsletter items */
              <Card>
                <CardContent className="py-4 space-y-1.5">
                  {items.map((item, i) => (
                    <p key={i} className="text-xs text-foreground">{item}</p>
                  ))}
                </CardContent>
              </Card>
            )}

            <Separator className="mt-4" />
          </article>
        ))
      ) : (
        /* No yearly inductions yet — show all-time greats */
        <>
          <div className="flex items-end gap-3 border-b-2 border-accent/30 pb-2">
            <h2 className="font-display text-xl text-foreground leading-none flex items-center gap-2">
              <Flame className="h-5 w-5 text-arena-gold" /> All-Time Greats
            </h2>
            <span className="text-[10px] text-muted-foreground font-mono mb-0.5">
              First inductions at Week 52
            </span>
          </div>

          {allTimeGreats.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allTimeGreats.map((w, i) => (
                <InducteeCard
                  key={w.id}
                  warrior={w}
                  title={i === 0 ? "Top Fame" : i === 1 ? "Runner-Up" : `#${i + 1}`}
                  icon={i === 0 ? <Crown className="h-4 w-4 text-arena-gold" /> : <Star className="h-4 w-4 text-muted-foreground" />}
                  fights={allFights}
                />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Crown className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-muted-foreground text-sm">No warriors have fought yet.</p>
                <p className="text-muted-foreground text-xs mt-1">Run rounds to build legends!</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
