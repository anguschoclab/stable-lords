/**
 * Stable Lords — Seasonal Awards Ceremony
 * Summarizes each season's best warriors, deadliest fighters, and biggest upsets.
 */
import { useMemo, useState } from "react";
import { useGameStore } from "@/state/useGameStore";
import { STYLE_DISPLAY_NAMES } from "@/types/shared.types";
import type { Warrior, Season } from "@/types/state.types";
import type { FightSummary } from "@/types/combat.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Award, Crown, Skull, Swords, Star, TrendingUp, Flame, Shield,
  ChevronDown, Zap, Heart, Trophy,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import AwardCard from "@/components/awards/AwardCard";
import UpsetsList from "@/components/awards/UpsetsList";

/* ── Types ───────────────────────────────────────────────── */

interface SeasonalAward {
  season: Season;
  seasonIndex: number; // which occurrence (1st Spring, 2nd Spring, etc.)
  weekStart: number;
  weekEnd: number;
  mvp: AwardEntry | null;
  deadliest: AwardEntry | null;
  ironWill: AwardEntry | null;
  risingStars: AwardEntry[];
  upsets: UpsetEntry[];
  totalBouts: number;
  totalKills: number;
  totalDeaths: number;
}

interface AwardEntry {
  name: string;
  style: string;
  stableName: string;
  isPlayer: boolean;
  wins: number;
  losses: number;
  kills: number;
  fameGained: number;
  popGained: number;
}

interface UpsetEntry {
  week: number;
  winner: string;
  loser: string;
  winnerFame: number;
  loserFame: number;
  by: string | null;
  fameDiff: number;
}

/* ── Computation ─────────────────────────────────────────── */

export { computeSeasonalAwards };

const SEASONS: Season[] = ["Spring", "Summer", "Fall", "Winter"];
const SEASON_ICONS: Record<Season, string> = {
  Spring: "🌱", Summer: "☀️", Fall: "🍂", Winter: "❄️",
};
const SEASON_GRADIENTS: Record<Season, string> = {
  Spring: "from-emerald-500/10 to-teal-500/10",
  Summer: "from-amber-500/10 to-orange-500/10",
  Fall: "from-orange-500/10 to-red-500/10",
  Winter: "from-blue-500/10 to-indigo-500/10",
};

function computeSeasonalAwards(
  fights: FightSummary[],
  allWarriors: Warrior[],
  playerRosterNames: Set<string>,
  playerStableName: string,
  rivals: { owner: { stableName: string }; roster: Warrior[] }[],
  currentWeek: number,
): SeasonalAward[] {
  if (fights.length === 0) return [];

  const awards: SeasonalAward[] = [];
  const maxWeek = currentWeek;

  // Build warrior-to-stable lookup
  const stableLookup = new Map<string, string>();
  for (const w of allWarriors) {
    if (playerRosterNames.has(w.name)) {
      stableLookup.set(w.name, playerStableName);
    }
  }
  for (const r of rivals) {
    for (const w of r.roster) {
      stableLookup.set(w.name, r.owner.stableName);
    }
  }

  // Process each completed season (13-week blocks)
  const completedSeasons = Math.floor((maxWeek - 1) / 13);

  // Group fights by season (13-week blocks)
  const fightsBySeason = new Map<number, FightSummary[]>();
  for (const f of fights) {
    const s = Math.floor((f.week - 1) / 13);
    if (s >= 0 && s < completedSeasons) {
      if (!fightsBySeason.has(s)) {
        fightsBySeason.set(s, []);
      }
      fightsBySeason.get(s)!.push(f);
    }
  }

  for (let s = 0; s < completedSeasons; s++) {
    const weekStart = s * 13 + 1;
    const weekEnd = (s + 1) * 13;
    const season = SEASONS[s % 4];
    const seasonIndex = Math.floor(s / 4) + 1;

    const seasonFights = fightsBySeason.get(s) || [];
    if (seasonFights.length === 0) continue;

    // Aggregate per-warrior stats for this season
    const stats = new Map<string, {
      name: string; style: string; wins: number; losses: number;
      kills: number; fameGained: number; popGained: number;
    }>();

    const ensure = (name: string, style: string) => {
      if (!stats.has(name)) {
        stats.set(name, { name, style, wins: 0, losses: 0, kills: 0, fameGained: 0, popGained: 0 });
      }
      return stats.get(name)!;
    };

    let totalKills = 0;
    let totalDeaths = 0;

    for (const f of seasonFights) {
      const a = ensure(f.a, f.styleA);
      const d = ensure(f.d, f.styleD);

      a.fameGained += f.fameDeltaA ?? 0;
      a.popGained += f.popularityDeltaA ?? 0;
      d.fameGained += f.fameDeltaD ?? 0;
      d.popGained += f.popularityDeltaD ?? 0;

      if (f.winner === "A") {
        a.wins++;
        d.losses++;
        if (f.by === "Kill") { a.kills++; totalKills++; totalDeaths++; }
      } else if (f.winner === "D") {
        d.wins++;
        a.losses++;
        if (f.by === "Kill") { d.kills++; totalKills++; totalDeaths++; }
      }
    }

    const toEntry = (s: typeof stats extends Map<string, infer V> ? V : never): AwardEntry => ({
      ...s,
      stableName: stableLookup.get(s.name) ?? "Unknown",
      isPlayer: playerRosterNames.has(s.name),
    });

    const allStats = [...stats.values()];

    // ⚡ Bolt: Reduced O(N log N) sorts to O(N) linear scans for single max value lookups
    let bestMvp = null;
    let bestMvpScore = -Infinity;
    let bestKill = null;
    let bestKillScore = 0;
    let bestIron = null;
    let bestIronRate = -Infinity;
    let bestIronWins = -Infinity;

    for (const s of allStats) {
      // MVP: highest (wins * 2 + kills * 3 + fameGained)
      const mvpScore = s.wins * 2 + s.kills * 3 + s.fameGained;
      if (mvpScore > bestMvpScore) {
        bestMvpScore = mvpScore;
        bestMvp = s;
      }

      // Deadliest: most kills
      if (s.kills > bestKillScore) {
        bestKillScore = s.kills;
        bestKill = s;
      }

      // Iron Will: best win rate with 3+ fights
      if (s.wins + s.losses >= 3) {
        const rate = s.wins / (s.wins + s.losses);
        if (rate > bestIronRate || (rate === bestIronRate && s.wins > bestIronWins)) {
          bestIronRate = rate;
          bestIronWins = s.wins;
          bestIron = s;
        }
      }
    }

    // Rising Stars: biggest fame gain (exclude MVP)
    // ⚡ Bolt: O(N) bounded insertion sort for top 3
    const mvpName = bestMvp?.name;
    const risingSorted: typeof allStats = [];
    for (const s of allStats) {
      if (s.name !== mvpName && s.fameGained > 0) {
        risingSorted.push(s);
        risingSorted.sort((a, b) => b.fameGained - a.fameGained);
        if (risingSorted.length > 3) risingSorted.pop();
      }
    }

    // Upsets: winner had much less fame than loser
    const upsets: UpsetEntry[] = [];
    for (const f of seasonFights) {
      if (!f.winner) continue;
      const winnerFame = f.winner === "A" ? (f.fameA ?? 0) : (f.fameD ?? 0);
      const loserFame = f.winner === "A" ? (f.fameD ?? 0) : (f.fameA ?? 0);
      const diff = loserFame - winnerFame;
      if (diff >= 5) {
        upsets.push({
          week: f.week,
          winner: f.winner === "A" ? f.a : f.d,
          loser: f.winner === "A" ? f.d : f.a,
          winnerFame,
          loserFame,
          by: f.by,
          fameDiff: diff,
        });
      }
    }
    upsets.sort((a, b) => b.fameDiff - a.fameDiff);

    awards.push({
      season,
      seasonIndex,
      weekStart,
      weekEnd,
      mvp: bestMvp ? toEntry(bestMvp) : null,
      deadliest: bestKill ? toEntry(bestKill) : null,
      ironWill: bestIron ? toEntry(bestIron) : null,
      risingStars: risingSorted.map(toEntry),
      upsets: upsets.slice(0, 5),
      totalBouts: seasonFights.length,
      totalKills,
      totalDeaths,
    });
  }

  return awards.reverse(); // Most recent first
}

/* ── Season Section ──────────────────────────────────────── */

function SeasonSection({ award }: { award: SeasonalAward }) {
  const icon = SEASON_ICONS[award.season];
  const gradient = SEASON_GRADIENTS[award.season];

  return (
    <article className="space-y-4">
      {/* Season Header */}
      <div className={cn("rounded-xl border border-border/60 p-5 bg-gradient-to-br", gradient)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{icon}</span>
            <div>
              <h2 className="font-display text-xl font-bold tracking-wide">
                {award.season} {award.seasonIndex > 1 ? `(Year ${award.seasonIndex})` : ""}
              </h2>
              <p className="text-xs text-muted-foreground font-mono">
                Weeks {award.weekStart}–{award.weekEnd}
              </p>
            </div>
          </div>
          <div className="flex gap-3 text-center">
            <div>
              <p className="text-lg font-bold font-mono">{award.totalBouts}</p>
              <p className="text-[9px] text-muted-foreground uppercase">Bouts</p>
            </div>
            <div>
              <p className="text-lg font-bold font-mono text-destructive">{award.totalKills}</p>
              <p className="text-[9px] text-muted-foreground uppercase">Kills</p>
            </div>
          </div>
        </div>
      </div>

      {/* Award Trophies */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AwardCard
          entry={award.mvp}
          title="Season MVP"
          icon={<Crown className="h-5 w-5 text-arena-gold" />}
          accentClass="bg-arena-gold"
        />
        <AwardCard
          entry={award.deadliest}
          title="Deadliest"
          icon={<Skull className="h-5 w-5 text-destructive" />}
          accentClass="bg-destructive"
        />
        <AwardCard
          entry={award.ironWill}
          title="Iron Will"
          icon={<Shield className="h-5 w-5 text-primary" />}
          accentClass="bg-primary"
        />
      </div>

      {/* Rising Stars */}
      {award.risingStars.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-display font-semibold text-muted-foreground hover:text-foreground transition-colors group w-full">
            <TrendingUp className="h-4 w-4 text-arena-pop" />
            Rising Stars ({award.risingStars.length})
            <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]:rotate-180 ml-auto" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 space-y-1.5">
              {award.risingStars.map((rs, i) => (
                <div key={rs.name} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-secondary/40 border border-border/30">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground w-4">{i + 1}</span>
                    <span className="text-xs font-display font-semibold">{rs.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{rs.style}</span>
                    {rs.isPlayer && <Badge variant="outline" className="text-[8px] text-primary border-primary/30">You</Badge>}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-mono">
                    <span className="text-arena-fame">+{rs.fameGained} fame</span>
                    <span className="text-muted-foreground">{rs.wins}W-{rs.losses}L</span>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Biggest Upsets */}
      <UpsetsList upsets={award.upsets} />
    </article>
  );
}

/* ── Main Page ───────────────────────────────────────────── */

export default function SeasonalAwards() {
  const { 
    roster, graveyard, retired, rivals, arenaHistory, player, week 
  } = useGameStore();

  const allWarriors = useMemo(() => [
    ...roster,
    ...graveyard,
    ...retired,
    ...(rivals ?? []).flatMap(r => r.roster),
  ], [roster, graveyard, retired, rivals]);

  const playerNames = useMemo(() => new Set([
    ...roster.map(w => w.name),
    ...graveyard.map(w => w.name),
    ...retired.map(w => w.name),
  ]), [roster, graveyard, retired]);

  const awards = useMemo(() =>
    computeSeasonalAwards(
      arenaHistory,
      allWarriors,
      playerNames,
      player.stableName,
      rivals ?? [],
      week,
    ),
    [arenaHistory, allWarriors, playerNames, player.stableName, rivals, week]
  );

  const currentSeasonIdx = Math.floor((week - 1) / 13) % 4;
  const currentSeason = SEASONS[currentSeasonIdx];
  const weeksIntoSeason = ((week - 1) % 13) + 1;
  const weeksRemaining = 13 - weeksIntoSeason;

  return (
    <div className="space-y-8">
      {/* Masthead */}
      <div className="text-center space-y-2 py-4">
        <div className="flex items-center justify-center gap-3">
          <Separator className="w-16" />
          <Award className="h-6 w-6 text-arena-gold" />
          <Separator className="w-16" />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl tracking-wide">
          Seasonal Awards
        </h1>
        <p className="text-sm text-muted-foreground font-mono tracking-widest uppercase">
          The Arena's Finest Each Season
        </p>
        <div className="flex items-center justify-center gap-2">
          <Separator className="w-20" />
          <span className="text-[10px] text-muted-foreground font-mono">
            {SEASON_ICONS[currentSeason]} {currentSeason} · Week {weeksIntoSeason}/13 · {weeksRemaining} weeks remain
          </span>
          <Separator className="w-20" />
        </div>
      </div>

      {/* Awards by Season */}
      {awards.length > 0 ? (
        <div className="space-y-8">
          {awards.map((award, i) => (
            <SeasonSection key={`${award.season}-${award.seasonIndex}`} award={award} />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center space-y-3">
            <Award className="h-12 w-12 text-muted-foreground mx-auto opacity-40" />
            <p className="text-muted-foreground text-sm font-display">
              No seasons completed yet.
            </p>
            <p className="text-muted-foreground text-xs">
              Complete your first 13-week season to see awards here.
              <br />
              <span className="font-mono text-primary">{weeksRemaining} weeks</span> until the first {currentSeason} ceremony.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
