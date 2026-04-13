/**
 * Stable Lords — Tournament Awards Ceremony
 * Post-tournament recap: MVP, deadliest, biggest upsets per completed tournament.
 */
import { useMemo } from "react";
import { useGameStore, useWorldState } from "@/state/useGameStore";
import AwardCard from "@/components/awards/AwardCard";
import UpsetsList from "@/components/awards/UpsetsList";
import FightsList from "@/components/awards/FightsList";
import { STYLE_DISPLAY_NAMES } from "@/types/game";
import type { TournamentEntry, FightSummary } from "@/types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Trophy, Crown, Skull, Swords, Star, Shield, Zap,
  ChevronDown, Award, Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Types ───────────────────────────────────────────────── */

interface TournamentAward {
  tournament: TournamentEntry;
  fights: FightSummary[];
  mvp: WarriorStat | null;
  deadliest: WarriorStat | null;
  ironWill: WarriorStat | null;
  upsets: UpsetEntry[];
  totalKills: number;
  totalBouts: number;
  rounds: number;
}

interface WarriorStat {
  name: string;
  style: string;
  isPlayer: boolean;
  wins: number;
  losses: number;
  kills: number;
  fameGained: number;
}

interface UpsetEntry {
  winner: string;
  loser: string;
  winnerFame: number;
  loserFame: number;
  by: string | null;
  fameDiff: number;
  round: number;
}

const SEASON_ICONS: Record<string, string> = {
  Spring: "🌿", Summer: "☀️", Fall: "🍂", Winter: "❄️",
};

/* ── Computation ─────────────────────────────────────────── */

function computeTournamentAwards(
  tournament: TournamentEntry,
  allFights: FightSummary[],
  playerNames: Set<string>,
): TournamentAward {
  const fights = allFights.filter(f => f.tournamentId === tournament.id);

  const stats = new Map<string, WarriorStat>();
  const ensure = (name: string, style: string) => {
    if (!stats.has(name)) {
      stats.set(name, { name, style, isPlayer: playerNames.has(name), wins: 0, losses: 0, kills: 0, fameGained: 0 });
    }
    return stats.get(name)!;
  };

  let totalKills = 0;

  for (const f of fights) {
    const a = ensure(f.a, f.styleA);
    const d = ensure(f.d, f.styleD);

    a.fameGained += f.fameDeltaA ?? 0;
    d.fameGained += f.fameDeltaD ?? 0;

    if (f.winner === "A") {
      a.wins++; d.losses++;
      if (f.by === "Kill") { a.kills++; totalKills++; }
    } else if (f.winner === "D") {
      d.wins++; a.losses++;
      if (f.by === "Kill") { d.kills++; totalKills++; }
    }
  }

  const allStats = [...stats.values()];

  // ⚡ Bolt: Reduced O(N log N) sorts to O(N) linear scans for single max value lookups
  const champion = tournament.champion;
  let bestMvp = null;
  let bestMvpScore = -Infinity;
  let bestKill = null;
  let bestKillScore = 0;

  for (const s of allStats) {
    if (s.name === champion) {
      bestMvp = s;
      bestMvpScore = Infinity; // Champion always wins MVP
    } else {
      const score = s.wins * 2 + s.kills * 3;
      if (score > bestMvpScore) {
        bestMvpScore = score;
        bestMvp = s;
      }
    }

    if (s.kills > bestKillScore) {
      bestKillScore = s.kills;
      bestKill = s;
    }
  }

  // Iron Will: survived most rounds (most wins)
  let bestIron = null;
  let bestIronWins = -Infinity;
  let bestIronRate = -Infinity;
  const mvpName = bestMvp?.name;

  for (const s of allStats) {
    if (s.name !== mvpName && s.wins >= 2) {
      const rate = s.wins / (s.wins + s.losses);
      if (s.wins > bestIronWins || (s.wins === bestIronWins && rate > bestIronRate)) {
        bestIronWins = s.wins;
        bestIronRate = rate;
        bestIron = s;
      }
    }
  }

  // Upsets
  const upsets: UpsetEntry[] = [];
  for (const f of fights) {
    if (!f.winner) continue;
    const winnerFame = f.winner === "A" ? (f.fameA ?? 0) : (f.fameD ?? 0);
    const loserFame = f.winner === "A" ? (f.fameD ?? 0) : (f.fameA ?? 0);
    const diff = loserFame - winnerFame;
    if (diff >= 3) {
      const bout = tournament.bracket.find(b => b.fightId === f.id);
      upsets.push({
        winner: f.winner === "A" ? f.a : f.d,
        loser: f.winner === "A" ? f.d : f.a,
        winnerFame, loserFame, by: f.by, fameDiff: diff,
        round: bout?.round ?? 0,
      });
    }
  }
  upsets.sort((a, b) => b.fameDiff - a.fameDiff);

  const rounds = Math.max(...tournament.bracket.map(b => b.round), 0);

  return {
    tournament,
    fights,
    mvp: bestMvp ?? null,
    deadliest: bestKill ?? null,
    ironWill: bestIron ?? null,
    upsets: upsets.slice(0, 5),
    totalKills,
    totalBouts: fights.length,
    rounds,
  };
}

/* ── Award Card ──────────────────────────────────────────── */



/* ── Tournament Section ──────────────────────────────────── */

function TournamentSection({ award }: { award: TournamentAward }) {
  const t = award.tournament;
  const icon = SEASON_ICONS[t.season] ?? "⚔️";

  return (
    <article className="space-y-4">
      {/* Header */}
      <div className="rounded-xl border border-accent/30 p-5 bg-gradient-to-br from-accent/5 to-primary/5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{icon}</span>
            <div>
              <h2 className="font-display text-xl font-bold tracking-wide">{t.name}</h2>
              <p className="text-xs text-muted-foreground font-mono">
                Week {t.week} · {award.rounds} round{award.rounds !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {t.champion && (
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-arena-gold" />
                <div>
                  <p className="text-sm font-display font-bold text-arena-gold">{t.champion}</p>
                  <p className="text-[9px] text-muted-foreground uppercase">Champion</p>
                </div>
              </div>
            )}
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
      </div>

      {/* Awards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AwardCard entry={award.mvp} title="Tournament MVP" icon={<Crown className="h-5 w-5 text-arena-gold" />} accentClass="bg-arena-gold" />
        <AwardCard entry={award.deadliest} title="Deadliest" icon={<Skull className="h-5 w-5 text-destructive" />} accentClass="bg-destructive" />
        <AwardCard entry={award.ironWill} title="Iron Will" icon={<Shield className="h-5 w-5 text-primary" />} accentClass="bg-primary" />
      </div>

      {/* Upsets */}
      <UpsetsList upsets={award.upsets} />

      {/* Fight List */}
      <FightsList
        fights={award.fights}
        getRound={(id) => award.tournament.bracket.find(b => b.fightId === id)?.round}
      />
    </article>
  );
}

/* ── Main Page ───────────────────────────────────────────── */

export default function TournamentAwards() {
  const state = useWorldState();
  const playerNames = useMemo(() => new Set([
    ...state.roster.map((w: any) => w.name),
    ...state.graveyard.map((w: any) => w.name),
    ...state.retired.map((w: any) => w.name),
  ]), [state]);

  const awards = useMemo(() => {
    const completed = state.tournaments.filter((t: any) => t.completed).reverse();
    return completed.map((t: any) => computeTournamentAwards(t, state.arenaHistory, playerNames));
  }, [state.tournaments, state.arenaHistory, playerNames]);

  return (
    <div className="space-y-8">
      {/* Masthead */}
      <div className="text-center space-y-2 py-4">
        <div className="flex items-center justify-center gap-3">
          <Separator className="w-16" />
          <Trophy className="h-6 w-6 text-arena-gold" />
          <Separator className="w-16" />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl tracking-wide">
          Tournament Awards
        </h1>
        <p className="text-sm text-muted-foreground font-mono tracking-widest uppercase">
          Champions & Legends of the Arena
        </p>
        <div className="flex items-center justify-center gap-2">
          <Separator className="w-24" />
          <span className="text-[10px] text-muted-foreground font-mono">
            {awards.length} tournament{awards.length !== 1 ? "s" : ""} completed
          </span>
          <Separator className="w-24" />
        </div>
      </div>

      {awards.length > 0 ? (
        <div className="space-y-8">
          {awards.map(a => (
            <TournamentSection key={a.tournament.id} award={a} />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center space-y-3">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto opacity-40" />
            <p className="text-muted-foreground text-sm font-display">
              No tournaments completed yet.
            </p>
            <p className="text-muted-foreground text-xs">
              Start and complete a seasonal tournament to see awards here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
