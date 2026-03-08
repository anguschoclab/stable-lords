/**
 * Stable Lords — Arena Hub (FM26-inspired modular portal)
 * Each section is a self-contained widget in a responsive grid.
 */
import React, { useMemo, useState, useCallback } from "react";
import { useGame } from "@/state/GameContext";
import { STYLE_DISPLAY_NAMES, STYLE_ABBREV, ATTRIBUTE_KEYS, ATTRIBUTE_LABELS, type Warrior } from "@/types/game";
import { Badge } from "@/components/ui/badge";
import TagBadge from "@/components/TagBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Swords, Trophy, Users, Flame, Star, TrendingUp, UserPlus,
  ScrollText, Coins, ArrowUpRight, ArrowDownRight, Calendar,
  Zap, Heart, Shield, ChevronRight, Skull, GripVertical, RotateCcw, Dumbbell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { WarriorLink, StableLink } from "@/components/EntityLink";
import { MOOD_DESCRIPTIONS, MOOD_ICONS } from "@/engine/crowdMood";
import { computeMetaDrift, getMetaLabel, getMetaColor } from "@/engine/metaDrift";
import { computeWeeklyBreakdown } from "@/engine/economy";
import { loadUIPrefs, saveUIPrefs } from "@/state/uiPrefs";
import { cn } from "@/lib/utils";

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
                      <WarriorLink name={f.a} className={`font-medium ${isPlayerA ? "text-foreground" : "text-muted-foreground"}`} />
                      <span className="text-muted-foreground mx-1.5">vs</span>
                      <WarriorLink name={f.d} className={`font-medium ${isPlayerD ? "text-foreground" : "text-muted-foreground"}`} />
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

// ─── Widget: Training Status ───────────────────────────────────────────────

function TrainingWidget() {
  const { state } = useGame();
  const assignments = state.trainingAssignments ?? [];

  // Map warrior IDs to warriors for display
  const trainingWarriors = useMemo(() =>
    assignments.map(a => ({
      ...a,
      warrior: state.roster.find(w => w.id === a.warriorId),
    })).filter(a => a.warrior),
    [assignments, state.roster]
  );

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
                      <span className="text-sm font-display font-semibold truncate">{w.name}</span>
                      <Badge variant="outline" className="text-[10px] font-mono h-4 px-1">
                        {STYLE_ABBREV[w.style]}
                      </Badge>
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
  const { state } = useGame();
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
            {rivals.slice(0, 4).map(r => {
              const active = r.roster.filter(w => w.status === "Active").length;
              const topWarrior = [...r.roster].sort((a, b) => b.fame - a.fame)[0];
              return (
                <div key={r.owner.id} className="flex items-center gap-3 py-1">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-display font-semibold truncate">
                        {r.owner.stableName}
                      </span>
                      <Badge variant="outline" className="text-[9px] h-4 px-1 shrink-0">
                        {r.owner.personality ?? "Unknown"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                      <span>{active} warriors</span>
                      <span>·</span>
                      <span className="text-arena-fame">{r.owner.fame} fame</span>
                      {topWarrior && (
                        <>
                          <span>·</span>
                          <span className="truncate">★ {topWarrior.name}</span>
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
                      <span className="text-[11px] truncate">
                        {playerIsA ? f.a : f.d} vs {playerIsA ? f.d : f.a}
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

// ─── Widget Registry ───────────────────────────────────────────────────────

type WidgetDef = {
  id: string;
  label: string;
  wide?: boolean; // spans 2 columns
  component: React.FC;
};

const WIDGET_REGISTRY: WidgetDef[] = [
  { id: "season",   label: "Season & Schedule", component: SeasonWidget },
  { id: "stable",   label: "Stable Overview",   component: StableWidget },
  { id: "finances", label: "Finances",           component: FinancesWidget },
  { id: "training", label: "Training Status",    component: TrainingWidget },
  { id: "rivals",   label: "Rival Stables",      component: RivalsWidget },
  { id: "rankings", label: "Warrior Rankings",   component: RankingsWidget, wide: true },
  { id: "meta",     label: "Meta Pulse",         component: MetaPulseWidget },
  { id: "bouts",    label: "Recent Bouts",       component: RecentBoutsWidget, wide: true },
  { id: "gazette",  label: "Arena Gazette",       component: GazetteWidget, wide: true },
];

const DEFAULT_ORDER = WIDGET_REGISTRY.map(w => w.id);

// ─── Drag & Drop Hook ─────────────────────────────────────────────────────

function useDraggableWidgets() {
  const prefs = loadUIPrefs();
  const savedOrder = prefs.dashboardLayout ?? DEFAULT_ORDER;
  // Ensure all widgets are present (handles new widgets added after save)
  const validIds = new Set(DEFAULT_ORDER);
  const order = [
    ...savedOrder.filter(id => validIds.has(id)),
    ...DEFAULT_ORDER.filter(id => !savedOrder.includes(id)),
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
  const { state } = useGame();
  const {
    widgetOrder, dragIdx, dragOverIdx, isEditing, setIsEditing,
    handleDragStart, handleDragOver, handleDrop, handleDragEnd, resetLayout,
  } = useDraggableWidgets();

  const widgetMap = useMemo(
    () => new Map(WIDGET_REGISTRY.map(w => [w.id, w])),
    []
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold tracking-wide">
            Arena Hub
          </h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, <span className="text-foreground font-medium">{state.player.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {isEditing && (
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground" onClick={resetLayout}>
              <RotateCcw className="h-3 w-3" /> Reset
            </Button>
          )}
          <Button
            variant={isEditing ? "default" : "outline"}
            size="sm"
            className="text-xs gap-1"
            onClick={() => setIsEditing(v => !v)}
          >
            <GripVertical className="h-3 w-3" />
            {isEditing ? "Done" : "Customize"}
          </Button>
        </div>
      </div>

      {/* Widget Grid */}
      <div className="grid gap-3 md:grid-cols-3">
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
