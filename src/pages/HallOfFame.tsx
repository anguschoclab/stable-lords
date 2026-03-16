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
import { Crown, Skull, Star, Shield, Flame } from "lucide-react";
import { InducteeCard } from "./HallOfFame/InducteeCard";

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
      <div className="text-center space-y-2 py-4">
        <div className="flex items-center justify-center gap-3">
          <Separator className="w-16" />
          <Crown className="h-6 w-6 text-arena-gold" />
          <Separator className="w-16" />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl tracking-wide text-foreground">
          Hall of Fame
        </h1>
        <p className="text-sm text-muted-foreground font-mono tracking-widest uppercase">
          Legends of the Arena
        </p>
        <div className="flex items-center justify-center gap-2">
          <Separator className="w-24" />
          <span className="text-[10px] text-muted-foreground font-mono">
            Year {currentYear + 1} · Week {state.week}
          </span>
          <Separator className="w-24" />
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
