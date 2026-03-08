/**
 * Stable Lords — Arena Hub (FM26-inspired modular portal)
 * Each section is a self-contained widget in a responsive grid.
 */
import React, { useMemo } from "react";
import { useGame } from "@/state/GameContext";
import { STYLE_DISPLAY_NAMES, STYLE_ABBREV, ATTRIBUTE_KEYS, type Warrior } from "@/types/game";
import { Badge } from "@/components/ui/badge";
import TagBadge from "@/components/TagBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Swords, Trophy, Users, Flame, Star, TrendingUp, UserPlus,
  ScrollText, Coins, ArrowUpRight, ArrowDownRight, Calendar,
  Zap, Heart, Shield, ChevronRight, Skull,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { MOOD_DESCRIPTIONS, MOOD_ICONS } from "@/engine/crowdMood";
import { computeMetaDrift, getMetaLabel, getMetaColor } from "@/engine/metaDrift";
import { computeWeeklyBreakdown } from "@/engine/economy";

// ─── Widget: Season & Calendar ─────────────────────────────────────────────

function SeasonWidget() {
  const { state, doAdvanceWeek } = useGame();
  const moodIcon = MOOD_ICONS[state.crowdMood as keyof typeof MOOD_ICONS] ?? "😐";
  const moodDesc = MOOD_DESCRIPTIONS[state.crowdMood as keyof typeof MOOD_DESCRIPTIONS] ?? "";

  // Upcoming events
  const events: { label: string; week: number; type: "bout" | "season" | "recruit" }[] = [];
  // Next bout is always current week
  events.push({ label: "Arena Day", week: state.week, type: "bout" });
  // Pool refresh every 4 weeks
  const nextDraft = state.week + (4 - (state.week % 4));
  events.push({ label: "Scout Pool Refresh", week: nextDraft, type: "recruit" });
  // Season change every 13 weeks
  const nextSeason = state.week + (13 - ((state.week - 1) % 13));
  events.push({ label: "Season Change", week: nextSeason, type: "season" });

  return (
    <Card className="row-span-1">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" /> Season & Schedule
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Current state */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-display font-bold">Week {state.week}</div>
            <div className="text-sm text-muted-foreground">{state.season}</div>
          </div>
          <div className="text-center">
            <span className="text-2xl">{moodIcon}</span>
            <div className="text-[10px] text-muted-foreground mt-0.5">{state.crowdMood}</div>
          </div>
        </div>

        {/* Upcoming timeline */}
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Upcoming</div>
          {events.sort((a, b) => a.week - b.week).map((ev, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className={`h-1.5 w-1.5 rounded-full ${
                  ev.type === "bout" ? "bg-destructive" :
                  ev.type === "season" ? "bg-primary" : "bg-arena-pop"
                }`} />
                <span className="text-foreground/80">{ev.label}</span>
              </div>
              <span className="text-xs text-muted-foreground font-mono">Wk {ev.week}</span>
            </div>
          ))}
        </div>

        <Link to="/run-round" className="block">
          <Button size="sm" className="w-full gap-1.5">
            <Zap className="h-3.5 w-3.5" /> Run Round
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

// ─── Widget: Stable Overview ───────────────────────────────────────────────

function StableWidget() {
  const { state } = useGame();
  const activeWarriors = state.roster.filter(w => w.status === "Active").length;
  const totalWins = state.roster.reduce((s, w) => s + w.career.wins, 0);
  const totalKills = state.roster.reduce((s, w) => s + w.career.kills, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" /> {state.player.stableName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md bg-secondary/60 p-2.5 border border-border/50">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Warriors</div>
            <div className="text-lg font-bold">{activeWarriors}</div>
          </div>
          <div className="rounded-md bg-secondary/60 p-2.5 border border-border/50">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Fame</div>
            <div className="text-lg font-bold text-arena-fame">{state.fame}</div>
          </div>
          <div className="rounded-md bg-secondary/60 p-2.5 border border-border/50">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Victories</div>
            <div className="text-lg font-bold text-arena-pop">{totalWins}</div>
          </div>
          <div className="rounded-md bg-secondary/60 p-2.5 border border-border/50">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Kills</div>
            <div className="text-lg font-bold text-destructive">{totalKills}</div>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Link to="/recruit" className="flex-1">
            <Button variant="outline" size="sm" className="w-full gap-1 text-xs">
              <UserPlus className="h-3 w-3" /> Recruit
            </Button>
          </Link>
          <Link to="/training" className="flex-1">
            <Button variant="outline" size="sm" className="w-full gap-1 text-xs">
              <TrendingUp className="h-3 w-3" /> Train
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Widget: Warrior Rankings ──────────────────────────────────────────────

function RankingsWidget() {
  const { state } = useGame();
  const navigate = useNavigate();

  const ranked = useMemo(
    () => [...state.roster]
      .filter(w => w.status === "Active")
      .sort((a, b) => b.fame - a.fame)
      .slice(0, 5),
    [state.roster]
  );

  return (
    <Card className="md:col-span-2">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-arena-gold" /> Warrior Rankings
        </CardTitle>
        <Badge variant="outline" className="text-[10px] text-muted-foreground">
          {state.roster.filter(w => w.status === "Active").length} active
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        {ranked.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            No warriors yet. <Link to="/recruit" className="text-primary hover:underline">Recruit your first.</Link>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {ranked.map((w, i) => (
              <button
                key={w.id}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/40 transition-colors text-left"
                onClick={() => navigate(`/warrior/${w.id}`)}
              >
                {/* Rank */}
                <span className={`text-sm font-mono font-bold w-5 text-center ${
                  i === 0 ? "text-arena-gold" : i === 1 ? "text-arena-steel" : "text-muted-foreground"
                }`}>
                  {i + 1}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-display font-semibold text-sm truncate">{w.name}</span>
                    {w.champion && <Trophy className="h-3 w-3 text-arena-gold shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-[10px] font-mono h-4 px-1">
                      {STYLE_ABBREV[w.style]}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {w.career.wins}W-{w.career.losses}L
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-center">
                    <div className="text-xs font-bold text-arena-fame">{w.fame}</div>
                    <div className="text-[9px] text-muted-foreground">Fame</div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Widget: Finances ──────────────────────────────────────────────────────

function FinancesWidget() {
  const { state } = useGame();
  const breakdown = useMemo(() => computeWeeklyBreakdown(state), [state]);
  const gold = state.gold ?? 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <Coins className="h-4 w-4 text-arena-gold" /> Finances
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center">
          <div className="text-3xl font-bold text-arena-gold">{gold}g</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Treasury</div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-md bg-secondary/60 p-2 border border-border/50">
            <div className="text-sm font-semibold text-arena-pop flex items-center justify-center gap-0.5">
              <ArrowUpRight className="h-3 w-3" /> {breakdown.totalIncome}g
            </div>
            <div className="text-[10px] text-muted-foreground">Income</div>
          </div>
          <div className="rounded-md bg-secondary/60 p-2 border border-border/50">
            <div className="text-sm font-semibold text-destructive flex items-center justify-center gap-0.5">
              <ArrowDownRight className="h-3 w-3" /> {breakdown.totalExpenses}g
            </div>
            <div className="text-[10px] text-muted-foreground">Expenses</div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-1 border-t border-border/50">
          <span className="text-xs text-muted-foreground">Net / week</span>
          <span className={`text-sm font-mono font-bold ${breakdown.net >= 0 ? "text-arena-pop" : "text-destructive"}`}>
            {breakdown.net >= 0 ? "+" : ""}{breakdown.net}g
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Widget: Meta Pulse ────────────────────────────────────────────────────

function MetaPulseWidget() {
  const { state } = useGame();
  const metaDrift = useMemo(
    () => computeMetaDrift(state.arenaHistory),
    [state.arenaHistory]
  );
  const activeStyles = useMemo(
    () => Object.entries(metaDrift)
      .filter(([, drift]) => drift !== 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4),
    [metaDrift]
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" /> Meta Pulse
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeStyles.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No meta shift detected yet.</p>
        ) : (
          <div className="space-y-2">
            {activeStyles.map(([style, drift]) => (
              <div key={style} className="flex items-center justify-between">
                <span className="text-xs text-foreground/80">
                  {STYLE_DISPLAY_NAMES[style as keyof typeof STYLE_DISPLAY_NAMES] ?? style}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${getMetaColor(drift)}`}
                >
                  {getMetaLabel(drift)} {drift > 0 ? "↑" : "↓"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Widget: Arena Gazette ─────────────────────────────────────────────────

function GazetteWidget() {
  const { state } = useGame();
  const recentNews = state.newsletter.slice(-3).reverse();

  return (
    <Card className="md:col-span-2">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-accent" /> Arena Gazette
        </CardTitle>
        {state.newsletter.length > 3 && (
          <span className="text-[10px] text-muted-foreground">
            {state.newsletter.length} dispatches
          </span>
        )}
      </CardHeader>
      <CardContent>
        {recentNews.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            No news dispatches yet. Run some rounds to generate arena buzz.
          </p>
        ) : (
          <div className="space-y-3">
            {recentNews.map((n, i) => (
              <div key={i}>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                  Week {n.week} — {n.title}
                </div>
                <ul className="space-y-0.5">
                  {n.items.slice(0, 3).map((item, j) => (
                    <li key={j} className="text-xs text-foreground/80 pl-2.5 border-l-2 border-primary/30">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Widget: Recent Bouts ──────────────────────────────────────────────────

function RecentBoutsWidget() {
  const { state } = useGame();
  const recent = state.arenaHistory.slice(-4).reverse();

  return (
    <Card className="md:col-span-2">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <Swords className="h-4 w-4 text-destructive" /> Recent Bouts
        </CardTitle>
        <Link to="/hall-of-fights">
          <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-muted-foreground">
            View All <ChevronRight className="h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No bouts recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {recent.map((f) => {
              const isPlayerA = state.roster.some(w => w.name === f.a);
              const isPlayerD = state.roster.some(w => w.name === f.d);
              const playerWarrior = isPlayerA ? f.a : isPlayerD ? f.d : null;
              const won = playerWarrior && (
                (playerWarrior === f.a && f.winner === "A") ||
                (playerWarrior === f.d && f.winner === "D")
              );

              return (
                <div key={f.id} className="flex items-center gap-3 py-1.5">
                  <Badge
                    variant={won ? "default" : f.winner ? "destructive" : "secondary"}
                    className="text-[10px] w-6 h-5 justify-center p-0"
                  >
                    {won ? "W" : f.winner ? "L" : "D"}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs">
                      <span className={`font-medium ${isPlayerA ? "text-foreground" : "text-muted-foreground"}`}>{f.a}</span>
                      <span className="text-muted-foreground mx-1.5">vs</span>
                      <span className={`font-medium ${isPlayerD ? "text-foreground" : "text-muted-foreground"}`}>{f.d}</span>
                    </div>
                    <div className="flex gap-1 mt-0.5">
                      {f.by && <Badge variant="outline" className="text-[9px] h-3.5 px-1">{f.by}</Badge>}
                      {f.flashyTags?.slice(0, 2).map(t => (
                        <Badge key={t} variant="outline" className="text-[9px] h-3.5 px-1">{t}</Badge>
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">Wk {f.week}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────

export default function Dashboard() {
  const { state } = useGame();

  return (
    <div className="space-y-4">
      {/* Compact header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-display font-bold tracking-wide">
          Arena Hub
        </h1>
        <p className="text-sm text-muted-foreground">
          Welcome back, <span className="text-foreground font-medium">{state.player.name}</span>
        </p>
      </div>

      {/* Widget Grid — FM26 inspired modular layout */}
      <div className="grid gap-3 md:grid-cols-3">
        {/* Row 1: Season | Stable | Finances */}
        <SeasonWidget />
        <StableWidget />
        <FinancesWidget />

        {/* Row 2: Rankings (2-wide) | Meta */}
        <RankingsWidget />
        <MetaPulseWidget />

        {/* Row 3: Recent Bouts (2-wide) | Gazette */}
        <RecentBoutsWidget />
        <GazetteWidget />
      </div>
    </div>
  );
}
