/**
 * Stable Lords — Arena Hub (FM26-inspired modular portal)
 * Each section is a self-contained widget in a responsive grid.
 */
import React, { useMemo, useState, useCallback } from "react";
import { useGameStore } from "@/state/useGameStore";
import { STYLE_DISPLAY_NAMES, STYLE_ABBREV, ATTRIBUTE_KEYS, ATTRIBUTE_LABELS, type Warrior } from "@/types/game";
import { BASE_ROSTER_CAP } from "@/data/constants";
import { Badge } from "@/components/ui/badge";
import { StatBadge } from "@/components/ui/StatBadge";
import TagBadge from "@/components/TagBadge";
import { WarriorNameTag } from "@/components/ui/WarriorNameTag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Swords, Trophy, Users, Flame, Star, TrendingUp, UserPlus,
  ScrollText, Coins, ArrowUpRight, ArrowDownRight, Calendar,
  Zap, Heart, Shield, ChevronRight, Skull, GripVertical, RotateCcw, Dumbbell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "@tanstack/react-router";
import { WarriorLink, StableLink } from "@/components/EntityLink";
import { MOOD_DESCRIPTIONS, MOOD_ICONS, CROWD_MOODS, getMoodModifiers, type CrowdMood } from "@/engine/crowdMood";
import { selectActiveWarriors } from "@/state/selectors";
import { computeMetaDrift, getMetaLabel, getMetaColor } from "@/engine/metaDrift";
import { computeWeeklyBreakdown } from "@/engine/economy";
import { loadUIPrefs, saveUIPrefs } from "@/state/uiPrefs";
import { cn } from "@/lib/utils";
import { CrowdMoodWidget } from "@/components/widgets/CrowdMoodWidget";


// ─── Widget: Season & Calendar ─────────────────────────────────────────────

function SeasonWidget() {
  const { state, doAdvanceWeek } = useGameStore();
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
  // Tournament availability
  const hasActiveTournament = state.tournaments.some((t) => t.season === state.season && !t.completed);
  const hadTournamentThisSeason = state.tournaments.some((t) => t.season === state.season);
  if (!hasActiveTournament && !hadTournamentThisSeason) {
    events.push({ label: `${state.season} Tournament`, week: state.week, type: "bout" });
  }

  // Season progress
  const weeksIntoSeason = ((state.week - 1) % 13) + 1;
  const seasonProgress = (weeksIntoSeason / 13) * 100;
  const weeksRemaining = 13 - weeksIntoSeason;

  const SEASON_EMOJIS: Record<string, string> = {
    Spring: "🌱", Summer: "☀️", Fall: "🍂", Winter: "❄️",
  };
  const seasonEmoji = SEASON_EMOJIS[state.season] ?? "📅";

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
            <div className="flex items-center gap-1 justify-center">
              {CROWD_MOODS.map((mood) => (
                <span
                  key={mood}
                  className={`text-lg transition-opacity ${mood === state.crowdMood ? "opacity-100" : "opacity-25"}`}
                  title={mood}
                >
                  {MOOD_ICONS[mood]}
                </span>
              ))}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{state.crowdMood}</div>
          </div>
        </div>

        {/* Season Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1">
              {seasonEmoji} {state.season} Progress
            </span>
            <span className="font-mono text-muted-foreground">{weeksIntoSeason}/13</span>
          </div>
          <div className="relative h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
              style={{ width: `${seasonProgress}%` }}
            />
            {/* Tick marks at quarters */}
            {[25, 50, 75].map(pct => (
              <div
                key={pct}
                className="absolute top-0 bottom-0 w-px bg-background/40"
                style={{ left: `${pct}%` }}
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <Link to="/seasonal-awards" className="hover:text-primary transition-colors">
              {weeksRemaining === 0
                ? "🏆 Awards ceremony!"
                : `${weeksRemaining} week${weeksRemaining !== 1 ? "s" : ""} until awards`}
            </Link>
            <span className="font-mono">{Math.round(seasonProgress)}%</span>
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
  const { state } = useGameStore();
  // ⚡ Bolt: Use memoized selector to prevent unnecessary array allocation on render
  const activeWarriors = selectActiveWarriors(state);
  // Sort warriors by fame or wins for the "Top 5" list
  const topWarriors = [...activeWarriors].sort((a, b) => b.fame - a.fame).slice(0, 5);

  return (
    <Card className="flex flex-col h-full border-border/50 shadow-sm">
      <CardHeader className="pb-2 border-b border-border/20 bg-secondary/10">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-sm tracking-wide flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" /> STABLE OVERVIEW
          </CardTitle>
          <span className="text-[10px] text-muted-foreground font-mono bg-secondary px-1.5 py-0.5 rounded">
            {activeWarriors.length}/{BASE_ROSTER_CAP + state.rosterBonus} ACTIVE
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col">
        <div className="flex-1">
          {topWarriors.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No active warriors.</div>
          ) : (
            <div className="divide-y divide-border/20">
              {topWarriors.map(w => {
                 const hasInjuries = w.injuries && w.injuries.length > 0;
                 return (
                  <div key={w.id} className="p-2.5 flex items-center gap-3 hover:bg-secondary/20 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-secondary/80 border border-border flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold">{w.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <Link to={`/warrior/${w.id}` as any} className="text-xs font-bold truncate hover:underline">{w.name}</Link>
                        <span className="text-[10px] font-mono whitespace-nowrap">
                           <span className="text-arena-pop">{w.career.wins}</span>-<span className="text-muted-foreground">{w.career.losses}</span>-<span className="text-destructive">{w.career.kills}</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-muted-foreground truncate">{STYLE_DISPLAY_NAMES[w.style as keyof typeof STYLE_DISPLAY_NAMES] || w.style}</span>
                        {hasInjuries ? (
                           <span className="text-[9px] uppercase tracking-wider bg-destructive/10 text-destructive px-1 rounded font-bold">Injured</span>
                        ) : (
                           <span className="text-[9px] uppercase tracking-wider bg-green-500/10 text-green-500 px-1 rounded font-bold">Healthy</span>
                        )}
                      </div>
                    </div>
                  </div>
                 )
              })}
            </div>
          )}
        </div>

        {/* Actions stuck to bottom */}
        <div className="p-2.5 border-t border-border/20 bg-background/50 grid grid-cols-2 gap-2 mt-auto">
          <Link to="/recruit">
            <Button variant="secondary" size="sm" className="w-full h-7 text-[10px] uppercase tracking-wider font-bold">
              <UserPlus className="h-3 w-3 mr-1" /> Recruit
            </Button>
          </Link>
          <Link to="/stable-hall">
            <Button variant="outline" size="sm" className="w-full h-7 text-[10px] uppercase tracking-wider font-bold">
              <Users className="h-3 w-3 mr-1" /> View All
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Widget: Warrior Rankings ──────────────────────────────────────────────

function RankingsWidget() {
  const { state } = useGameStore();
  const navigate = useNavigate();

  const ranked = useMemo(
    () => [...selectActiveWarriors(state)]
      .sort((a, b) => b.fame - a.fame)
      .slice(0, 5),
    [state]
  );

  return (
    <Card className="md:col-span-2">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-arena-gold" /> Warrior Rankings
        </CardTitle>
        <Badge variant="outline" className="text-[10px] text-muted-foreground">
          {selectActiveWarriors(state).length} active
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
                onClick={() => navigate({ to: `/warrior/${w.id}` })}
              >
                {/* Rank */}
                <span className={`text-sm font-mono font-bold w-5 text-center ${
                  i === 0 ? "text-arena-gold" : i === 1 ? "text-arena-steel" : "text-muted-foreground"
                }`}>
                  {i + 1}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <WarriorNameTag id={w.id} name={w.name} isChampion={w.champion} />
                  <StatBadge styleName={w.style} career={w.career} />
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
  const { state } = useGameStore();
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
  const { state } = useGameStore();
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
  const { state } = useGameStore();
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
  const { state } = useGameStore();

  // Get the last 5 bouts involving the player's stable
  const recentBouts = useMemo(() => {
    return state.arenaHistory
      .filter(bout => bout.a === state.player.stableName || bout.d === state.player.stableName)
      .slice(0, 5);
  }, [state.arenaHistory, state.player.stableName]);

  return (
    <Card className="flex flex-col h-full border-border/50 shadow-sm col-span-1 md:col-span-2">
      <CardHeader className="pb-2 border-b border-border/20 bg-secondary/10">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-sm tracking-wide flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-primary" /> RECENT BOUTS
          </CardTitle>
          <span className="text-[10px] text-muted-foreground font-mono">LAST 5 MATCHES</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-muted-foreground uppercase bg-secondary/5 border-b border-border/20 font-bold tracking-wider">
              <tr>
                <th className="px-4 py-2">Week</th>
                <th className="px-4 py-2">Fighter</th>
                <th className="px-4 py-2">Opponent</th>
                <th className="px-4 py-2">Result</th>
                <th className="px-4 py-2 text-right">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {recentBouts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-xs">No match history available</td>
                </tr>
              ) : (
                recentBouts.map((bout) => {
                  const isPlayerA = bout.a === state.player.stableName;
                  const playerWon = (isPlayerA && bout.winner === "A") || (!isPlayerA && bout.winner === "D");
                  const resultColor = playerWon ? "text-arena-pop" : "text-destructive";

                  return (
                    <tr key={bout.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">Wk {bout.week}</td>
                      <td className="px-4 py-2.5 font-bold">
                        {isPlayerA ? bout.a : bout.d}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">
                         {isPlayerA ? bout.d : bout.a}
                      </td>
                      <td className={`px-4 py-2.5 font-bold ${resultColor}`}>
                         {playerWon ? "WIN" : "LOSS"}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-[10px] uppercase text-muted-foreground">
                        {bout.by || "DECISION"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="p-2 border-t border-border/20 bg-background/50 text-center">
            <Link to="/hall-of-fights" className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors font-bold flex items-center justify-center gap-1">
               Full History <ChevronRight className="h-3 w-3" />
            </Link>
        </div>
      </CardContent>
    </Card>
  );
}
// ─── Widget: Training Status ───────────────────────────────────────────────

function TrainingWidget() {
  const { state } = useGameStore();
  // Map warrior IDs to warriors for display
  const trainingWarriors = useMemo(() => {
    const assignments = state.trainingAssignments ?? [];
    return assignments.map(a => ({
      ...a,
      warrior: state.roster.find(w => w.id === a.warriorId),
    })).filter(a => a.warrior);
  }, [state.trainingAssignments, state.roster]);

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <Dumbbell className="h-4 w-4 text-primary" /> Training
        </CardTitle>
        <Link to="/training">
          <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-muted-foreground">
            Manage <ChevronRight className="h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {trainingWarriors.length === 0 ? (
          <div className="text-center py-3">
            <p className="text-xs text-muted-foreground italic">No warriors in training.</p>
            <Link to="/training">
              <Button variant="outline" size="sm" className="mt-2 text-xs gap-1">
                <Dumbbell className="h-3 w-3" /> Assign Training
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {trainingWarriors.map(({ warriorId, attribute, warrior }) => {
              const w = warrior!;
              const current = w.attributes[attribute];
              const potential = w.potential?.[attribute];
              const atCeiling = potential !== undefined && current >= potential;
              const nearCeiling = potential !== undefined && (potential - current) <= 2;

              return (
                <div key={warriorId} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <WarriorNameTag id={w.id} name={w.name} />
                      <StatBadge styleName={w.style} />
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">Training</span>
                      <Badge
                        variant={atCeiling ? "secondary" : "default"}
                        className="text-[10px] h-4 px-1.5"
                      >
                        {ATTRIBUTE_LABELS[attribute]}
                      </Badge>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        ({current})
                      </span>
                      {atCeiling && (
                        <span className="text-[9px] text-muted-foreground italic">at ceiling</span>
                      )}
                      {!atCeiling && nearCeiling && (
                        <span className="text-[9px] text-arena-gold italic">nearing peak</span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0">
                    <div className={`h-2 w-2 rounded-full ${atCeiling ? "bg-muted-foreground" : "bg-arena-pop animate-pulse"}`} />
                  </div>
                </div>
              );
            })}
            <div className="text-[10px] text-muted-foreground pt-1 border-t border-border/50">
              {trainingWarriors.length} warrior{trainingWarriors.length !== 1 ? "s" : ""} training · gains apply at week end
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Widget: Rival Stables ─────────────────────────────────────────────────

function RivalsWidget() {
  const { state } = useGameStore();
  const rivals = state.rivals ?? [];

  // Find recent bouts involving rival warriors
  const recentRivalBouts = useMemo(() => {
    const rosterNames = new Set(state.roster.map(w => w.name));
    return state.arenaHistory
      .filter(f => {
        const aIsPlayer = rosterNames.has(f.a);
        const dIsPlayer = rosterNames.has(f.d);
        return (aIsPlayer && !dIsPlayer) || (!aIsPlayer && dIsPlayer);
      })
      .slice(-3)
      .reverse();
  }, [state.arenaHistory, state.roster]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <Skull className="h-4 w-4 text-destructive" /> Rival Stables
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rivals.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No rival stables yet.</p>
        ) : (
          <div className="space-y-2">
            {rivals.slice(0, 6).map(r => {
              const active = r.roster.filter(w => w.status === "Active").length;
              const topWarrior = [...r.roster].sort((a, b) => b.fame - a.fame)[0];
              const tierColors: Record<string, string> = {
                Major: "text-arena-gold border-arena-gold/40",
                Established: "text-primary border-primary/40",
                Minor: "text-muted-foreground border-border",
                Legendary: "text-destructive border-destructive/40",
              };
              const tierClass = tierColors[r.tier ?? "Minor"] ?? tierColors.Minor;
              return (
                <div key={r.owner.id} className="flex items-center gap-3 py-1">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <StableLink name={r.owner.stableName} className="text-sm font-display font-semibold truncate">
                        {r.owner.stableName}
                      </StableLink>
                      {r.tier && (
                        <Badge variant="outline" className={`text-[9px] h-4 px-1 shrink-0 ${tierClass}`}>
                          {r.tier}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[9px] h-4 px-1 shrink-0">
                        {r.owner.personality ?? "Unknown"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                      <span>{active} warriors</span>
                      <span>·</span>
                      <span className="text-arena-fame">{r.owner.fame} fame</span>
                      {r.philosophy && (
                        <>
                          <span>·</span>
                          <span className="italic">{r.philosophy}</span>
                        </>
                      )}
                      {topWarrior && (
                        <>
                          <span>·</span>
                          <span className="truncate flex items-center gap-1">★ <WarriorNameTag name={topWarrior.name} id={topWarrior.id} /></span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Recent rival bouts */}
            {recentRivalBouts.length > 0 && (
              <div className="pt-2 mt-1 border-t border-border/50">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                  Recent vs Rivals
                </div>
                {recentRivalBouts.map(f => {
                  const rosterNames = new Set(state.roster.map(w => w.name));
                  const playerIsA = rosterNames.has(f.a);
                  const won = (playerIsA && f.winner === "A") || (!playerIsA && f.winner === "D");
                  return (
                    <div key={f.id} className="flex items-center gap-2 py-0.5">
                      <Badge
                        variant={won ? "default" : f.winner ? "destructive" : "secondary"}
                        className="text-[9px] w-5 h-4 justify-center p-0"
                      >
                        {won ? "W" : f.winner ? "L" : "D"}
                      </Badge>
                      <span className="text-[11px] truncate flex items-center gap-1">
                        <WarriorNameTag name={playerIsA ? f.a : f.d} /> vs <WarriorNameTag name={playerIsA ? f.d : f.a} />
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Widget: Rivalry Panel ─────────────────────────────────────────────────

interface DerivedRivalry {
  stableName: string;
  ownerId: string;
  intensity: number;
  kills: { killer: string; victim: string; week: number }[];
  bouts: number;
  playerWins: number;
  playerLosses: number;
}

function RivalryWidget() {
  const { state } = useGameStore();
  const rosterNames = useMemo(() => new Set(state.roster.map(w => w.name).concat(state.graveyard?.map(w => w.name) ?? [])), [state.roster, state.graveyard]);

  const rivalWarriorStable = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of (state.rivals ?? [])) {
      for (const w of r.roster) m.set(w.name, r.owner.stableName);
    }
    return m;
  }, [state.rivals]);

  const rivalries = useMemo(() => {
    const map = new Map<string, DerivedRivalry>();

    for (const bout of state.arenaHistory) {
      const aIsPlayer = rosterNames.has(bout.a);
      const dIsPlayer = rosterNames.has(bout.d);
      if (!aIsPlayer && !dIsPlayer) continue;

      const rivalName = aIsPlayer ? bout.d : bout.a;
      const stable = rivalWarriorStable.get(rivalName);
      if (!stable) continue;

      if (!map.has(stable)) {
        const owner = (state.rivals ?? []).find(r => r.owner.stableName === stable);
        map.set(stable, {
          stableName: stable,
          ownerId: owner?.owner.id ?? stable,
          intensity: 0,
          kills: [],
          bouts: 0,
          playerWins: 0,
          playerLosses: 0,
        });
      }

      const r = map.get(stable)!;
      r.bouts++;

      const playerIsA = aIsPlayer;
      const playerWon = (playerIsA && bout.winner === "A") || (!playerIsA && bout.winner === "D");
      if (playerWon) r.playerWins++;
      else if (bout.winner) r.playerLosses++;

      if (bout.by === "Kill" && bout.winner) {
        const killerIsPlayer = playerWon;
        r.kills.push({
          killer: killerIsPlayer ? (playerIsA ? bout.a : bout.d) : rivalName,
          victim: killerIsPlayer ? rivalName : (playerIsA ? bout.a : bout.d),
          week: bout.week,
        });
      }
    }

    for (const r of map.values()) {
      let intensity = 0;
      intensity += Math.min(r.kills.length * 2, 4);
      intensity += r.bouts >= 5 ? 1 : 0;
      r.intensity = Math.max(1, Math.min(5, intensity));
    }

    return [...map.values()].filter(r => r.bouts > 0).sort((a, b) => b.intensity - a.intensity);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.arenaHistory, rosterNames, rivalWarriorStable]);

  const mostWanted = useMemo(() => {
    const winCounts = new Map<string, { name: string; stable: string; wins: number; kills: number }>();
    for (const bout of state.arenaHistory) {
      const aIsPlayer = rosterNames.has(bout.a);
      const dIsPlayer = rosterNames.has(bout.d);
      if (!aIsPlayer && !dIsPlayer) continue;

      const playerWon = (aIsPlayer && bout.winner === "A") || (dIsPlayer && bout.winner === "D");
      if (playerWon || !bout.winner) continue;

      const rivalName = aIsPlayer ? bout.d : bout.a;
      const stable = rivalWarriorStable.get(rivalName) ?? "Unknown";
      const entry = winCounts.get(rivalName) ?? { name: rivalName, stable, wins: 0, kills: 0 };
      entry.wins++;
      if (bout.by === "Kill") entry.kills++;
      winCounts.set(rivalName, entry);
    }
    return [...winCounts.values()].sort((a, b) => b.wins - a.wins || b.kills - a.kills)[0] ?? null;

  }, [state.arenaHistory, rosterNames, rivalWarriorStable]);

  const intensityColor = (n: number) =>
    n >= 4 ? "text-destructive" : n >= 2 ? "text-arena-gold" : "text-muted-foreground";

  const intensityLabel = (n: number) =>
    n >= 5 ? "Blood Feud" : n >= 4 ? "Bitter" : n >= 3 ? "Heated" : n >= 2 ? "Tense" : "Simmering";

  return (
    <Card className="md:col-span-2">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <Flame className="h-4 w-4 text-destructive" /> Rivalries
        </CardTitle>
        {rivalries.length > 0 && (
          <Badge variant="outline" className="text-[10px] text-muted-foreground">
            {rivalries.length} active
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {rivalries.length === 0 ? (
          <div className="text-center py-4 space-y-1">
            <p className="text-xs text-muted-foreground italic">No rivalries yet.</p>
            <p className="text-[10px] text-muted-foreground">Fight rival stables to forge vendettas and blood feuds.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3">
              {rivalries.slice(0, 4).map(r => (
                <div key={r.ownerId} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StableLink name={r.stableName} className="font-display font-semibold text-sm">
                        {r.stableName}
                      </StableLink>
                      <Badge variant="outline" className={`text-[9px] ${intensityColor(r.intensity)}`}>
                        🔥 {intensityLabel(r.intensity)}
                      </Badge>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {r.playerWins}W-{r.playerLosses}L
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div
                          key={i}
                          className={`h-2 w-5 rounded-sm transition-colors ${
                            i <= r.intensity
                              ? i >= 4 ? "bg-destructive" : i >= 2 ? "bg-arena-gold" : "bg-primary"
                              : "bg-secondary"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{r.bouts} bouts</span>
                  </div>

                  {r.kills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {r.kills.slice(-3).map((k, i) => {
                        const playerKilled = rosterNames.has(k.killer);
                        return (
                          <Badge
                            key={i}
                            variant={playerKilled ? "default" : "destructive"}
                            className="text-[9px] gap-1 h-5"
                          >
                            <Skull className="h-2.5 w-2.5" />
                            {k.killer} → {k.victim} (Wk {k.week})
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {mostWanted && (
              <div className="border-t border-border/50 pt-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">
                  ⚔ Most Wanted
                </div>
                <div className="flex items-center gap-3 rounded-md bg-destructive/5 border border-destructive/20 p-2.5">
                  <Skull className="h-5 w-5 text-destructive shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <WarriorLink name={mostWanted.name} className="font-display font-bold text-sm" />
                      <span className="text-[10px] text-muted-foreground">({mostWanted.stable})</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {mostWanted.wins} win{mostWanted.wins !== 1 ? "s" : ""} vs your warriors
                      {mostWanted.kills > 0 && <span className="text-destructive"> · {mostWanted.kills} kill{mostWanted.kills !== 1 ? "s" : ""}</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


// ─── Widget: Stable Comparison ─────────────────────────────────────────────

function StableComparisonWidget() {
  const { state } = useGameStore();

  const playerNames = useMemo(() => new Set(state.roster.map(w => w.name)), [state.roster]);

  const playerStats = useMemo(() => {
    // ⚡ Bolt: Combines multiple filter/reduce iterations into a single O(n) pass
    let activeCount = 0;
    let totalFame = 0;
    let wins = 0;
    let kills = 0;
    for (const w of state.roster) {
      wins += w.career.wins;
      kills += w.career.kills;
      if (w.status === "Active") {
        activeCount++;
        totalFame += w.fame ?? 0;
      }
    }
    const avgFame = activeCount > 0 ? Math.round(totalFame / activeCount) : 0;
    return { name: state.player.stableName, warriors: activeCount, wins, kills, avgFame, isPlayer: true };
  }, [state.roster, state.player.stableName]);

  // Build rival name sets and H2H records
  const { rivalStats, h2hRecords } = useMemo(() => {
    const rivals = (state.rivals ?? []).slice(0, 3);
    const h2h: Record<string, { wins: number; losses: number; kills: number; deaths: number }> = {};

    const stats = rivals.map(r => {
      const rivalNameSet = new Set(r.roster.map(w => w.name));

      // ⚡ Bolt: Single O(n) pass to extract wins, kills, active count, and active fame
      let activeCount = 0;
      let totalFame = 0;
      let wins = 0;
      let kills = 0;
      for (const w of r.roster) {
        wins += w.career.wins;
        kills += w.career.kills;
        if (w.status === "Active") {
          activeCount++;
          totalFame += w.fame ?? 0;
        }
      }
      const avgFame = activeCount > 0 ? Math.round(totalFame / activeCount) : 0;

      // Compute H2H from arena history
      const record = { wins: 0, losses: 0, kills: 0, deaths: 0 };
      for (const f of state.arenaHistory) {
        const aIsPlayer = playerNames.has(f.a);
        const dIsPlayer = playerNames.has(f.d);
        const aIsRival = rivalNameSet.has(f.a);
        const dIsRival = rivalNameSet.has(f.d);

        if ((aIsPlayer && dIsRival) || (dIsPlayer && aIsRival)) {
          const playerIsA = aIsPlayer;
          const playerWon = (playerIsA && f.winner === "A") || (!playerIsA && f.winner === "D");
          const playerLost = (playerIsA && f.winner === "D") || (!playerIsA && f.winner === "A");
          if (playerWon) {
            record.wins++;
            if (f.by === "Kill") record.kills++;
          } else if (playerLost) {
            record.losses++;
            if (f.by === "Kill") record.deaths++;
          }
        }
      }
      h2h[r.owner.stableName] = record;

      return { name: r.owner.stableName, warriors: activeCount, wins, kills, avgFame, isPlayer: false };
    });

    return { rivalStats: stats, h2hRecords: h2h };
  }, [state.rivals, state.arenaHistory, playerNames]);

  const allStables = [playerStats, ...rivalStats];
  if (rivalStats.length === 0) {
    return (
      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Stable Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground italic">No rival stables to compare yet.</p>
        </CardContent>
      </Card>
    );
  }

  const maxWins = Math.max(...allStables.map(s => s.wins), 1);
  const maxFame = Math.max(...allStables.map(s => s.avgFame), 1);

  return (
    <Card className="md:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" /> Stable Comparison
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {/* Header row */}
          <div className="grid grid-cols-[1fr_60px_80px_50px_70px] gap-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium border-b border-border pb-1.5">
            <span>Stable</span>
            <span className="text-center">Size</span>
            <span className="text-center">Victories</span>
            <span className="text-center">Kills</span>
            <span className="text-center">Avg Fame</span>
          </div>
          {allStables.map((s, i) => (
            <div
              key={i}
              className={`grid grid-cols-[1fr_60px_80px_50px_70px] gap-2 items-center py-1.5 rounded-md px-1.5 ${
                s.isPlayer ? "bg-primary/5 border border-primary/20" : "hover:bg-secondary/40"
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                {s.isPlayer && <Shield className="h-3 w-3 text-primary shrink-0" />}
                <span className={`text-sm truncate ${s.isPlayer ? "font-semibold" : ""}`}>{s.name}</span>
              </div>
              <div className="text-center text-sm font-mono">{s.warriors}</div>
              <div className="flex items-center gap-1.5">
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-arena-pop rounded-full transition-all" style={{ width: `${(s.wins / maxWins) * 100}%` }} />
                </div>
                <span className="text-xs font-mono w-6 text-right">{s.wins}</span>
              </div>
              <div className="text-center text-sm font-mono text-destructive">{s.kills}</div>
              <div className="flex items-center gap-1.5">
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-arena-fame rounded-full transition-all" style={{ width: `${(s.avgFame / maxFame) * 100}%` }} />
                </div>
                <span className="text-xs font-mono w-6 text-right">{s.avgFame}</span>
              </div>
            </div>
          ))}
        </div>

        {/* H2H Breakdown */}
        {rivalStats.some(r => {
          const rec = h2hRecords[r.name];
          return rec && (rec.wins + rec.losses) > 0;
        }) && (
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
              <Swords className="h-3 w-3" /> Head-to-Head
            </div>
            {rivalStats.map(r => {
              const rec = h2hRecords[r.name];
              if (!rec || (rec.wins + rec.losses) === 0) return null;
              const total = rec.wins + rec.losses;
              const winPct = Math.round((rec.wins / total) * 100);

              return (
                <div key={r.name} className="flex items-center gap-3">
                  <span className="text-xs text-foreground/80 w-28 truncate" title={r.name}>vs {r.name}</span>
                  <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-arena-pop transition-all"
                      style={{ width: `${winPct}%` }}
                      title={`${rec.wins} wins`}
                    />
                    <div
                      className="h-full bg-destructive/70 transition-all"
                      style={{ width: `${100 - winPct}%` }}
                      title={`${rec.losses} losses`}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-mono font-semibold text-arena-pop">{rec.wins}W</span>
                    <span className="text-[10px] text-muted-foreground">-</span>
                    <span className="text-xs font-mono font-semibold text-destructive">{rec.losses}L</span>
                    {(rec.kills > 0 || rec.deaths > 0) && (
                      <span className="text-[10px] font-mono text-muted-foreground ml-1">
                        {rec.kills > 0 && <span className="text-arena-gold">☠{rec.kills}</span>}
                        {rec.deaths > 0 && <span className="text-destructive ml-0.5">💀{rec.deaths}</span>}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Widget Registry ───────────────────────────────────────────────────────

type WidgetDef = {
  id: string;
  label: string;
  wide?: boolean; // spans 2 columns
  component: React.FC;
};

// Memoize all widgets to prevent unnecessary re-renders from context changes
const MemoSeasonWidget = React.memo(SeasonWidget);
const MemoStableWidget = React.memo(StableWidget);
const MemoFinancesWidget = React.memo(FinancesWidget);
const MemoTrainingWidget = React.memo(TrainingWidget);
const MemoRivalsWidget = React.memo(RivalsWidget);
const MemoRivalryWidget = React.memo(RivalryWidget);
const MemoRankingsWidget = React.memo(RankingsWidget);
const MemoMetaPulseWidget = React.memo(MetaPulseWidget);
const MemoRecentBoutsWidget = React.memo(RecentBoutsWidget);
const MemoGazetteWidget = React.memo(GazetteWidget);
const MemoCrowdMoodWidget = React.memo(CrowdMoodWidget);
const MemoStableComparisonWidget = React.memo(StableComparisonWidget);

const WIDGET_REGISTRY: WidgetDef[] = [
  { id: "season",   label: "Season & Schedule", component: MemoSeasonWidget },
  { id: "stable",   label: "Stable Overview",   component: MemoStableWidget },
  { id: "crowd",    label: "Crowd Mood",         component: MemoCrowdMoodWidget },
  { id: "finances", label: "Finances",           component: MemoFinancesWidget },
  { id: "training", label: "Training Status",    component: MemoTrainingWidget },
  { id: "rivals",    label: "Rival Stables",      component: MemoRivalsWidget },
  { id: "stableCompare", label: "Stable Comparison", component: MemoStableComparisonWidget, wide: true },
  { id: "rivalries", label: "Rivalries",          component: MemoRivalryWidget, wide: true },
  { id: "rankings", label: "Warrior Rankings",   component: MemoRankingsWidget, wide: true },
  { id: "meta",     label: "Meta Pulse",         component: MemoMetaPulseWidget },
  { id: "bouts",    label: "Recent Bouts",       component: MemoRecentBoutsWidget, wide: true },
  { id: "gazette",  label: "Arena Gazette",       component: MemoGazetteWidget, wide: true },
];

const DEFAULT_ORDER = WIDGET_REGISTRY.map(w => w.id);

// ─── Drag & Drop Hook ─────────────────────────────────────────────────────

function useDraggableWidgets() {
  const prefs = loadUIPrefs();
  const savedOrder = prefs.dashboardLayout ?? DEFAULT_ORDER;
  // Ensure all widgets are present (handles new widgets added after save)
  const validIds = new Set(DEFAULT_ORDER);
  const savedOrderSet = new Set(savedOrder);
  const order = [
    ...savedOrder.filter(id => validIds.has(id)),
    ...DEFAULT_ORDER.filter(id => !savedOrderSet.has(id)),
  ];

  const [widgetOrder, setWidgetOrder] = useState(order);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleDragStart = useCallback((idx: number) => {
    setDragIdx(idx);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  }, []);

  const handleDrop = useCallback((idx: number) => {
    if (dragIdx === null || dragIdx === idx) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }
    setWidgetOrder(prev => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(idx, 0, moved);
      // Persist
      const prefs = loadUIPrefs();
      saveUIPrefs({ ...prefs, dashboardLayout: next });
      return next;
    });
    setDragIdx(null);
    setDragOverIdx(null);
  }, [dragIdx]);

  const handleDragEnd = useCallback(() => {
    setDragIdx(null);
    setDragOverIdx(null);
  }, []);

  const resetLayout = useCallback(() => {
    setWidgetOrder(DEFAULT_ORDER);
    const prefs = loadUIPrefs();
    saveUIPrefs({ ...prefs, dashboardLayout: DEFAULT_ORDER });
  }, []);

  return {
    widgetOrder,
    dragIdx,
    dragOverIdx,
    isEditing,
    setIsEditing,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    resetLayout,
  };
}

// ─── Main Dashboard ────────────────────────────────────────────────────────

export default function Dashboard() {
  const { state } = useGameStore();
  const {
    widgetOrder, dragIdx, dragOverIdx, isEditing, setIsEditing,
    handleDragStart, handleDragOver, handleDrop, handleDragEnd, resetLayout,
  } = useDraggableWidgets();

  const widgetMap = useMemo(
    () => new Map(WIDGET_REGISTRY.map(w => [w.id, w])),
    []
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-secondary/30 p-4 rounded-xl border border-border/50">
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold tracking-wide flex items-center gap-2 text-foreground">
            Arena Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, <span className="text-foreground font-medium">{state.player.name}</span> of <span className="text-primary font-bold">{state.player.stableName}</span>
          </p>
        </div>

        <div className="flex items-center gap-4 text-sm bg-background/50 px-4 py-2 rounded-lg border border-border/40 shrink-0 shadow-inner">
           <div className="flex items-center gap-2 border-r border-border/50 pr-4">
              <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">Gold</span>
              <span className="font-mono text-arena-gold font-bold">{state.gold.toLocaleString()} G</span>
           </div>
           <div className="flex items-center gap-2 border-r border-border/50 pr-4">
              <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">Fame</span>
              <span className="font-mono text-arena-fame font-bold">{state.fame.toLocaleString()}</span>
           </div>
           <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">Pop</span>
              <span className="font-mono text-arena-pop font-bold">{Math.round(state.popularity)}%</span>
           </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isEditing && (
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={resetLayout}>
              <RotateCcw className="h-3 w-3" /> Reset
            </Button>
          )}
          <Button
            variant={isEditing ? "default" : "secondary"}
            size="sm"
            className={cn("text-xs gap-1 transition-colors shadow-sm", isEditing && "bg-primary text-primary-foreground")}
            onClick={() => setIsEditing(v => !v)}
          >
            <GripVertical className="h-3 w-3" />
            {isEditing ? "Done" : "Customize"}
          </Button>
        </div>
      </div>

      {/* Widget Grid */}
      <div className="grid gap-4 md:grid-cols-3 auto-rows-min">
        {widgetOrder.map((id, idx) => {
          const def = widgetMap.get(id);
          if (!def) return null;
          const Widget = def.component;
          const isDragging = dragIdx === idx;
          const isDragOver = dragOverIdx === idx && dragIdx !== idx;

          return (
            <div
              key={id}
              draggable={isEditing}
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={handleDragEnd}
              className={cn(
                "transition-all duration-200",
                def.wide && "md:col-span-2",
                isEditing && "cursor-grab active:cursor-grabbing",
                isDragging && "opacity-40 scale-[0.97]",
                isDragOver && "ring-2 ring-primary/50 ring-offset-1 ring-offset-background rounded-xl",
              )}
            >
              {isEditing && (
                <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-muted-foreground">
                  <GripVertical className="h-3 w-3" />
                  <span className="uppercase tracking-wider font-medium">{def.label}</span>
                </div>
              )}
              <Widget />
            </div>
          );
        })}
      </div>
    </div>
  );
}
