/**
 * Kill Analytics — Death Visualizer
 * Death cause chains, hit location breakdowns, aggregate kill trends.
 */
import React, { useMemo } from "react";
import { useGame } from "@/state/GameContext";
import { ArenaHistory } from "@/engine/history/arenaHistory";
import { StyleRollups, type StyleRecord } from "@/engine/stats/styleRollups";
import type { FightSummary, Warrior } from "@/types/game";
import { STYLE_DISPLAY_NAMES } from "@/types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skull, Target, TrendingUp, Swords, BarChart3, Activity, Users } from "lucide-react";

/* ── Aggregate Types ─────────────────────────────────────── */

interface KillRecord {
  week: number;
  killer: string;
  killerStyle: string;
  victim: string;
  victimStyle: string;
  fightId: string;
}

interface LocationBreakdown {
  location: string;
  count: number;
  pct: number;
}

interface StyleKillStats {
  style: string;
  kills: number;
  deaths: number;
  kdr: number;
  totalFights: number;
}

/* ── Data Extraction ─────────────────────────────────────── */

function extractKills(fights: FightSummary[]): KillRecord[] {
  return fights
    .filter(f => f.by === "Kill" && f.winner)
    .map(f => ({
      week: f.week,
      killer: f.winner === "A" ? f.a : f.d,
      killerStyle: f.winner === "A" ? f.styleA : f.styleD,
      victim: f.winner === "A" ? f.d : f.a,
      victimStyle: f.winner === "A" ? f.styleD : f.styleA,
      fightId: f.id,
    }));
}

function extractLocationData(fights: FightSummary[]): LocationBreakdown[] {
  const kills = fights.filter(f => f.by === "Kill");
  const locations: Record<string, number> = { Head: 0, Chest: 0, Abdomen: 0, Arms: 0, Legs: 0 };

  for (const f of kills) {
    if (!f.transcript) continue;
    const lastLines = f.transcript.slice(-5).join(" ").toLowerCase();
    if (lastLines.includes("head")) locations.Head++;
    else if (lastLines.includes("chest")) locations.Chest++;
    else if (lastLines.includes("abdomen")) locations.Abdomen++;
    else if (lastLines.includes("arm")) locations.Arms++;
    else if (lastLines.includes("leg")) locations.Legs++;
    else locations.Chest++; // default
  }

  const total = Object.values(locations).reduce((s, v) => s + v, 0) || 1;
  return Object.entries(locations)
    .map(([location, count]) => ({ location, count, pct: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count);
}

function computeStyleKillStats(fights: FightSummary[]): StyleKillStats[] {
  const m: Record<string, { kills: number; deaths: number; fights: number }> = {};
  const ensure = (s: string) => { if (!m[s]) m[s] = { kills: 0, deaths: 0, fights: 0 }; };

  for (const f of fights) {
    ensure(f.styleA);
    ensure(f.styleD);
    m[f.styleA].fights++;
    m[f.styleD].fights++;
    if (f.by === "Kill") {
      if (f.winner === "A") { m[f.styleA].kills++; m[f.styleD].deaths++; }
      else if (f.winner === "D") { m[f.styleD].kills++; m[f.styleA].deaths++; }
    }
  }

  return Object.entries(m)
    .map(([style, d]) => ({
      style,
      kills: d.kills,
      deaths: d.deaths,
      kdr: d.deaths > 0 ? Math.round((d.kills / d.deaths) * 100) / 100 : d.kills,
      totalFights: d.fights,
    }))
    .sort((a, b) => b.kills - a.kills);
}

function computeKillTrend(kills: KillRecord[], maxWeek: number): { week: number; cumulative: number }[] {
  const byWeek = new Map<number, number>();
  for (const k of kills) byWeek.set(k.week, (byWeek.get(k.week) ?? 0) + 1);

  const points: { week: number; cumulative: number }[] = [];
  let cum = 0;
  for (let w = 1; w <= maxWeek; w++) {
    cum += byWeek.get(w) ?? 0;
    points.push({ week: w, cumulative: cum });
  }
  return points;
}

/* ── Location Badge ──────────────────────────────────────── */

const LOCATION_COLORS: Record<string, string> = {
  Head: "bg-destructive/20 text-destructive border-destructive/30",
  Chest: "bg-primary/20 text-primary border-primary/30",
  Abdomen: "bg-accent/20 text-accent border-accent/30",
  Arms: "bg-arena-pop/20 text-arena-pop border-arena-pop/30",
  Legs: "bg-arena-fame/20 text-arena-fame border-arena-fame/30",
};

/* ── Trend Sparkline ─────────────────────────────────────── */

function KillTrendChart({ points }: { points: { week: number; cumulative: number }[] }) {
  if (points.length < 2) return null;
  const w = 320, h = 80, pad = { l: 30, r: 8, t: 8, b: 20 };
  const cw = w - pad.l - pad.r;
  const ch = h - pad.t - pad.b;
  const max = Math.max(...points.map(p => p.cumulative), 1);

  const pathD = points.map((p, i) => {
    const x = pad.l + (i / (points.length - 1)) * cw;
    const y = pad.t + ch - (p.cumulative / max) * ch;
    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxHeight: 80 }}>
      {[0, 0.25, 0.5, 0.75, 1].map(pct => {
        const y = pad.t + ch - pct * ch;
        return <line key={pct} x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="hsl(var(--border))" strokeWidth="0.3" />;
      })}
      <path d={pathD} fill="none" stroke="hsl(var(--destructive))" strokeWidth="2" />
      {points.filter((_, i) => i === 0 || i === points.length - 1).map((p, i) => {
        const x = pad.l + ((points.indexOf(p)) / (points.length - 1)) * cw;
        const y = pad.t + ch - (p.cumulative / max) * ch;
        return <circle key={i} cx={x} cy={y} r="3" fill="hsl(var(--destructive))" />;
      })}
      <text x={pad.l - 4} y={pad.t + 8} textAnchor="end" className="fill-muted-foreground" style={{ fontSize: 8 }}>{max}</text>
      <text x={pad.l - 4} y={h - pad.b + 2} textAnchor="end" className="fill-muted-foreground" style={{ fontSize: 8 }}>0</text>
      <text x={pad.l} y={h - 2} textAnchor="start" className="fill-muted-foreground" style={{ fontSize: 8 }}>Wk 1</text>
      <text x={w - pad.r} y={h - 2} textAnchor="end" className="fill-muted-foreground" style={{ fontSize: 8 }}>Wk {points[points.length - 1].week}</text>
    </svg>
  );
}

/* ── Main Page ───────────────────────────────────────────── */

export default function KillAnalytics() {
  const { state } = useGame();
  const allFights = useMemo(() => {
    const hist = ArenaHistory.all();
    return hist.length > 0 ? hist : state.arenaHistory;
  }, [state.arenaHistory]);

  const kills = useMemo(() => extractKills(allFights), [allFights]);
  const locations = useMemo(() => extractLocationData(allFights), [allFights]);
  const styleStats = useMemo(() => computeStyleKillStats(allFights), [allFights]);
  const trend = useMemo(() => computeKillTrend(kills, state.week), [kills, state.week]);

  const totalKills = kills.length;
  const totalFights = allFights.length;
  const killRate = totalFights > 0 ? Math.round((totalKills / totalFights) * 100) : 0;

  // Deadliest killers
  const killerLeaders = useMemo(() => {
    const m = new Map<string, { name: string; style: string; kills: number }>();
    for (const k of kills) {
      const e = m.get(k.killer) ?? { name: k.killer, style: k.killerStyle, kills: 0 };
      e.kills++;
      m.set(k.killer, e);
    }
    return [...m.values()].sort((a, b) => b.kills - a.kills).slice(0, 8);
  }, [kills]);

  // Death chains (recent kills with context)
  const recentKills = useMemo(() => kills.slice().reverse().slice(0, 10), [kills]);

  // Graveyard data
  const graveyardByStyle = useMemo(() => {
    const m: Record<string, number> = {};
    for (const w of state.graveyard) {
      m[w.style] = (m[w.style] ?? 0) + 1;
    }
    return Object.entries(m).sort(([, a], [, b]) => b - a);
  }, [state.graveyard]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl border border-destructive/30 bg-gradient-to-br from-destructive/5 via-card to-card p-6 sm:p-8">
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <Skull className="h-6 w-6 text-destructive" />
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-wide">Kill Analytics</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-xl">
            Every death is data. Analyze kill patterns, lethal styles, and the mechanics of mortality in the arena.
          </p>
          <div className="flex items-center gap-4 mt-4 flex-wrap">
            <div className="text-center">
              <div className="text-2xl font-display font-bold text-destructive">{totalKills}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Kills</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-display font-bold text-foreground">{totalFights}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Bouts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-display font-bold text-arena-blood">{killRate}%</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Kill Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-display font-bold text-muted-foreground">{state.graveyard.length}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">In Graveyard</div>
            </div>
          </div>
        </div>
      </div>

      {totalKills === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Skull className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No kills recorded yet. Run rounds to generate combat data.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Kill Trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-display flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-destructive" /> Cumulative Kill Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <KillTrendChart points={trend} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Hit Location Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-display flex items-center gap-2">
                  <Target className="h-4 w-4 text-arena-blood" /> Killing Blow Locations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {locations.map(loc => (
                  <div key={loc.location} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={`text-[10px] ${LOCATION_COLORS[loc.location] ?? ""}`}>
                        {loc.location}
                      </Badge>
                      <span className="text-xs font-mono text-muted-foreground">{loc.count} ({loc.pct}%)</span>
                    </div>
                    <Progress value={loc.pct} className="h-2 [&>div]:bg-destructive/60" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Deadliest Killers */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-display flex items-center gap-2">
                  <Swords className="h-4 w-4 text-arena-blood" /> Deadliest Warriors
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {killerLeaders.map((k, i) => (
                  <div key={k.name} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono w-4 ${i === 0 ? "text-destructive font-bold" : "text-muted-foreground"}`}>{i + 1}</span>
                      <div>
                        <span className="text-xs font-display text-foreground">{k.name}</span>
                        <div className="text-[9px] text-muted-foreground font-mono">
                          {STYLE_DISPLAY_NAMES[k.style as keyof typeof STYLE_DISPLAY_NAMES] ?? k.style}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-destructive border-destructive/30 text-[10px] font-mono">
                      {k.kills} kill{k.kills !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                ))}
                {killerLeaders.length === 0 && <p className="text-xs text-muted-foreground italic py-4">No data.</p>}
              </CardContent>
            </Card>
          </div>

          {/* Style Kill/Death Ratios */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-display flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-arena-blood" /> Style Lethality Breakdown
              </CardTitle>
              <p className="text-[10px] text-muted-foreground font-mono">Kills vs deaths by fighting style</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {styleStats.filter(s => s.kills > 0 || s.deaths > 0).map(s => {
                const maxKD = Math.max(...styleStats.map(x => x.kills + x.deaths), 1);
                const killWidth = (s.kills / maxKD) * 100;
                const deathWidth = (s.deaths / maxKD) * 100;
                return (
                  <div key={s.style} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-display text-foreground">
                        {STYLE_DISPLAY_NAMES[s.style as keyof typeof STYLE_DISPLAY_NAMES] ?? s.style}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] font-mono">
                        <span className="text-destructive">{s.kills}K</span>
                        <span className="text-muted-foreground">{s.deaths}D</span>
                        <span className="text-foreground font-semibold">KDR: {s.kdr}</span>
                      </div>
                    </div>
                    <div className="flex gap-0.5 h-2.5">
                      <div className="bg-destructive/70 rounded-l-full transition-all" style={{ width: `${killWidth}%` }} />
                      <div className="bg-muted-foreground/30 rounded-r-full transition-all" style={{ width: `${deathWidth}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Recent Kill Feed */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-display flex items-center gap-2">
                <Activity className="h-4 w-4 text-destructive" /> Recent Kills
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentKills.map((k, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-border/20 last:border-0">
                  <span className="text-[10px] font-mono text-muted-foreground/50 w-10 shrink-0">Wk {k.week}</span>
                  <Skull className="h-3.5 w-3.5 text-destructive shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-display text-foreground font-semibold">{k.killer}</span>
                    <span className="text-[10px] text-muted-foreground mx-1">slew</span>
                    <span className="text-xs font-display text-muted-foreground">{k.victim}</span>
                  </div>
                  <div className="text-[9px] text-muted-foreground font-mono shrink-0">
                    {STYLE_DISPLAY_NAMES[k.killerStyle as keyof typeof STYLE_DISPLAY_NAMES] ?? k.killerStyle} vs {STYLE_DISPLAY_NAMES[k.victimStyle as keyof typeof STYLE_DISPLAY_NAMES] ?? k.victimStyle}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Graveyard by Style */}
          {graveyardByStyle.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-display flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" /> Graveyard by Style
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {graveyardByStyle.map(([style, count]) => (
                  <div key={style} className="flex items-center justify-between py-1">
                    <span className="text-xs font-display text-foreground">
                      {STYLE_DISPLAY_NAMES[style as keyof typeof STYLE_DISPLAY_NAMES] ?? style}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">{count} fallen</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
