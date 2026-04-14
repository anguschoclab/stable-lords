import React, { useMemo } from "react";
import { useGameStore, useWorldState } from "@/state/useGameStore";
import { ArenaHistory } from "@/engine/history/arenaHistory";
import { StyleRollups, type StyleRecord } from "@/engine/stats/styleRollups";
import type { FightSummary, Warrior } from "@/types/game";
import { STYLE_DISPLAY_NAMES } from "@/types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Skull, Target, TrendingUp, Swords, BarChart3, 
  Activity, Users, Info, ChevronRight, PieChart
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, 
  Cell, Legend, PieChart as RePieChart, Pie
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

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
  return fights.reduce((acc, f) => {
    if (f.by === "Kill" && f.winner) {
      acc.push({
        week: f.week,
        killer: f.winner === "A" ? f.a : f.d,
        killerStyle: f.winner === "A" ? f.styleA : f.styleD,
        victim: f.winner === "A" ? f.d : f.a,
        victimStyle: f.winner === "A" ? f.styleD : f.styleA,
        fightId: f.id,
      });
    }
    return acc;
  }, [] as KillRecord[]);
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

function computeKillTrend(kills: KillRecord[], maxWeek: number): { week: string; count: number }[] {
  const byWeek = new Map<number, number>();
  for (const k of kills) byWeek.set(k.week, (byWeek.get(k.week) ?? 0) + 1);

  const points: { week: string; count: number }[] = [];
  let cum = 0;
  for (let w = 1; w <= maxWeek; w++) {
    cum += byWeek.get(w) ?? 0;
    points.push({ week: `W${w}`, count: cum });
  }
  return points;
}

/* ── Layout Theme ────────────────────────────────────────── */

const COLORS = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

/* ── Main Page ───────────────────────────────────────────── */

export default function KillAnalytics() {
  const state = useWorldState();
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
    return [...m.values()].sort((a, b) => b.kills - a.kills).slice(0, 10);
  }, [kills]);

  const recentKills = useMemo(() => kills.slice().reverse().slice(0, 8), [kills]);

  const chartConfig = {
    count: {
      label: "Total Kills",
      color: "hsl(var(--destructive))",
    },
    kills: {
      label: "Kills",
      color: "hsl(var(--destructive))",
    },
    deaths: {
      label: "Deaths",
      color: "hsl(var(--muted-foreground))",
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header Stat Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div>
          <h1 className="text-3xl font-display font-black tracking-tighter uppercase flex items-center gap-3">
             <Skull className="h-8 w-8 text-destructive" /> Mortality Analytics
          </h1>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest pl-11">
             Post-Mortem Engine v1.4 · {totalKills} Recorded Exterminations
          </p>
        </div>
        <div className="flex items-center gap-4">
           <div className="text-right">
              <div className="text-[10px] text-muted-foreground font-bold uppercase">Lethal Ratio</div>
              <div className="text-lg font-display font-bold text-destructive">{killRate}%</div>
           </div>
           <div className="text-right ml-4">
              <div className="text-[10px] text-muted-foreground font-bold uppercase">In Ground</div>
              <div className="text-lg font-display font-bold text-muted-foreground">{state.graveyard.length}</div>
           </div>
        </div>
      </div>

      {totalKills === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-24 text-center text-muted-foreground">
            <Skull className="h-16 w-16 mx-auto mb-4 opacity-10 animate-pulse" />
            <p className="text-sm font-bold uppercase tracking-widest">No fatalities logged in current history</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Trend Chart (2 columns) */}
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-display font-black flex items-center gap-2 uppercase tracking-tighter">
                <TrendingUp className="h-4 w-4 text-destructive" /> Cumulative Mortality Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 h-[300px]">
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted)/0.2)" />
                    <XAxis 
                       dataKey="week" 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{fontSize: 10, fontWeight: 700}}
                       tickMargin={10}
                    />
                    <YAxis 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{fontSize: 10, fontWeight: 700}}
                       tickMargin={10}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="hsl(var(--destructive))" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorCount)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Hit Locations Pie (1 column) */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-display font-black flex items-center gap-2 uppercase tracking-tighter">
                <Target className="h-4 w-4 text-primary" /> Lethal Strike Zones
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 h-[300px] flex flex-col justify-center">
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={locations}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="location"
                      animationBegin={500}
                    >
                      {locations.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {locations.slice(0, 4).map((loc, i) => (
                   <div key={loc.location} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i]}} />
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">{loc.location}</span>
                      <span className="text-[10px] font-mono font-black ml-auto">{loc.pct}%</span>
                   </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Style Lethality Bar (3 columns) */}
          <Card className="lg:col-span-3 shadow-sm">
             <CardHeader className="pb-2">
                <CardTitle className="text-sm font-display font-black flex items-center gap-2 uppercase tracking-tighter">
                  <BarChart3 className="h-4 w-4 text-arena-blood" /> Style lethality Comparison
                </CardTitle>
             </CardHeader>
             <CardContent className="pt-6 h-[250px]">
                <ChartContainer config={chartConfig}>
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={styleStats.slice(0, 8)}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted)/0.2)" />
                         <XAxis 
                            dataKey="style" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 9, fontWeight: 700}}
                            tickFormatter={(v) => (STYLE_DISPLAY_NAMES[v as keyof typeof STYLE_DISPLAY_NAMES] || v).slice(0, 8)}
                         />
                         <YAxis hide />
                         <ChartTooltip content={<ChartTooltipContent />} />
                         <Bar dataKey="kills" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                         <Bar dataKey="deaths" fill="hsl(var(--muted-foreground))" opacity={0.3} radius={[4, 4, 0, 0]} />
                      </BarChart>
                   </ResponsiveContainer>
                </ChartContainer>
             </CardContent>
          </Card>

          {/* Leaders & Feed */}
          <Card className="lg:col-span-1 border-l-4 border-l-destructive/50">
             <CardHeader className="pb-2 border-b border-border/50 bg-destructive/5">
                <CardTitle className="text-xs font-display font-black uppercase tracking-widest flex items-center gap-2">
                   <Swords className="h-3 w-3 text-destructive" /> Reaper Leaderboard
                </CardTitle>
             </CardHeader>
             <CardContent className="p-0">
                {killerLeaders.map((k, i) => (
                   <div key={k.name} className="flex items-center justify-between p-3 border-b border-border/20 last:border-0 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-mono font-black text-muted-foreground/40">{String(i+1).padStart(2, '0')}</span>
                         <div>
                            <div className="text-[11px] font-black uppercase leading-none mb-1">{k.name}</div>
                            <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{STYLE_DISPLAY_NAMES[k.style as keyof typeof STYLE_DISPLAY_NAMES] || k.style}</div>
                         </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono font-black text-destructive border-destructive/20">{k.kills} KILLS</Badge>
                   </div>
                ))}
             </CardContent>
          </Card>

          <Card className="lg:col-span-2">
             <CardHeader className="pb-2 border-b border-border/50">
                <CardTitle className="text-xs font-display font-black uppercase tracking-widest flex items-center gap-2">
                   <Activity className="h-3 w-3 text-muted-foreground" /> Sequential Lethality Feed
                </CardTitle>
             </CardHeader>
             <CardContent className="p-0">
                <div className="divide-y divide-border/20">
                   {recentKills.map((k, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 hover:bg-muted/30 transition-colors group">
                         <div className="text-[10px] font-mono text-muted-foreground/40 w-12 shrink-0">Wk {k.week}</div>
                         <div className="flex-1 flex items-center gap-2 min-w-0">
                            <span className="text-xs font-black truncate">{k.killer}</span>
                            <ChevronRight className="h-3 w-3 text-destructive animate-pulse" />
                            <span className="text-xs font-medium text-muted-foreground truncate">{k.victim}</span>
                         </div>
                         <div className="flex flex-col items-end shrink-0">
                            <div className="text-[9px] font-bold uppercase tracking-tighter">{STYLE_DISPLAY_NAMES[k.killerStyle as keyof typeof STYLE_DISPLAY_NAMES] || k.killerStyle}</div>
                            <div className="text-[8px] text-muted-foreground uppercase opacity-0 group-hover:opacity-100 transition-opacity">Execution by Skill</div>
                         </div>
                      </div>
                   ))}
                </div>
             </CardContent>
          </Card>

        </div>
      )}
    </div>
  );
}
