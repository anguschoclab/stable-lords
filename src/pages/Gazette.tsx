import { useMemo, useState, useCallback } from "react";
import { useGameStore } from "@/state/useGameStore";
import { ArenaHistory } from "@/engine/history/arenaHistory";
// import { StyleRollups } from "@/engine/stats/styleRollups";
import { LoreArchive } from "@/lore/LoreArchive";
import { MarkdownReader } from "@/components/MarkdownReader";
import type { GazetteStory } from "@/types/game";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Newspaper, Trophy, Swords, TrendingUp, Skull, Flame, Star, ChevronDown, BarChart3, Crown, Grid3X3, Zap, BookOpen } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { FightSummary } from "@/types/game";
import { StatBadge } from "@/components/ui/StatBadge";

/* ── helpers ─────────────────────────────────────────────── */

function outcomeBadge(by: string | null) {
  if (!by) return null;
  const map: Record<string, { label: string; cls: string }> = {
    KO: { label: "KO", cls: "bg-accent text-accent-foreground" },
    Kill: { label: "KILL", cls: "bg-destructive text-destructive-foreground" },
    Decision: { label: "Decision", cls: "bg-secondary text-secondary-foreground" },
    Draw: { label: "Draw", cls: "bg-muted text-muted-foreground" },
    Submission: { label: "Submission", cls: "bg-primary text-primary-foreground" },
  };
  const m = map[by] ?? { label: by, cls: "bg-muted text-muted-foreground" };
  return <Badge className={m.cls + " text-[10px] font-mono uppercase"}>{m.label}</Badge>;
}

function winnerName(f: FightSummary) {
  if (f.winner === "A") return f.a;
  if (f.winner === "D") return f.d;
  return "Draw";
}

function scoreFight(f: FightSummary): number {
  let s = 0;
  if (f.flashyTags?.includes("Comeback")) s += 3;
  if (f.flashyTags?.includes("Flashy")) s += 2;
  if (f.by === "KO") s += 2;
  if (f.by === "Kill") s += 3;
  if (f.by === "Draw") s += 1;
  return s;
}

/* ── components ──────────────────────────────────────────── */

function FightCard({ fight, isFOTW }: { fight: FightSummary; isFOTW: boolean }) {
  const hasTranscript = fight.transcript && fight.transcript.length > 0;
  const [open, setOpen] = useState(false);

  return (
    <div className={`relative rounded-lg border p-4 transition-colors ${isFOTW ? "border-accent glow-gold bg-accent/5" : "border-border bg-card"}`}>
      {isFOTW && (
        <div className="absolute -top-2.5 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-wider">
          <Star className="h-3 w-3" /> Fight of the Week
        </div>
      )}
      <div className="flex items-center justify-between mt-1">
        <div className="flex-1 text-right pr-3">
          <span className={`font-display text-sm ${fight.winner === "A" ? "text-foreground font-bold" : "text-muted-foreground"}`}>
            {fight.a}
          </span>
          <div className="text-[10px] text-muted-foreground font-mono">{fight.styleA}</div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Swords className="h-4 w-4 text-muted-foreground" />
          {outcomeBadge(fight.by)}
        </div>
        <div className="flex-1 pl-3">
          <span className={`font-display text-sm ${fight.winner === "D" ? "text-foreground font-bold" : "text-muted-foreground"}`}>
            {fight.d}
          </span>
          <div className="text-[10px] text-muted-foreground font-mono">{fight.styleD}</div>
        </div>
      </div>
      {fight.flashyTags && fight.flashyTags.length > 0 && (
        <div className="flex gap-1 mt-2 justify-center">
          {fight.flashyTags.map((t) => (
            <Badge key={t} variant="outline" className="text-[9px] text-arena-gold border-arena-gold/30">
              {t}
            </Badge>
          ))}
        </div>
      )}

      {/* Expandable transcript */}
      {hasTranscript && (
        <Collapsible open={open} onOpenChange={setOpen} className="mt-2">
          <CollapsibleTrigger className="flex items-center gap-1 mx-auto text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer group">
            <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
            {open ? "Hide" : "Read"} blow-by-blow
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 border-t border-border/50 pt-2 space-y-1 max-h-60 overflow-y-auto">
              {fight.transcript!.map((line, i) => (
                <p key={i} className="text-[11px] leading-relaxed text-muted-foreground font-mono">
                  <span className="text-muted-foreground/40 mr-2 select-none">{i + 1}.</span>
                  {line}
                </p>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

function StyleTrendRow({ style, w, l, k, pct, fights }: { style: string; w: number; l: number; k: number; pct: number; fights: number }) {
  const barWidth = Math.min(pct * 100, 100);
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-28 text-xs font-display text-foreground truncate">{style}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <span className="text-[11px] font-mono text-muted-foreground w-16 text-right">
        {(pct * 100).toFixed(0)}% W
      </span>
      <span className="text-[11px] font-mono text-muted-foreground w-20 text-right">
        {w}W {l}L {k > 0 ? `${k}K` : ""}
      </span>
    </div>
  );
}

/* ── All-time meta chart ─────────────────────────────────── */

function AllTimeMetaChart({ allFights }: { allFights: FightSummary[] }) {
  const meta = useMemo(() => {
    const m: Record<string, { w: number; l: number; k: number; fights: number }> = {};
    const ensure = (s: string) => {
      if (!m[s]) m[s] = { w: 0, l: 0, k: 0, fights: 0 };
    };
    for (const f of allFights) {
      ensure(f.styleA);
      ensure(f.styleD);
      m[f.styleA].fights++;
      m[f.styleD].fights++;
      if (f.winner === "A") { m[f.styleA].w++; m[f.styleD].l++; }
      else if (f.winner === "D") { m[f.styleD].w++; m[f.styleA].l++; }
      if (f.by === "Kill") {
        if (f.winner === "A") m[f.styleA].k++;
        else if (f.winner === "D") m[f.styleD].k++;
      }
    }
    return Object.entries(m)
      .map(([style, d]) => ({ style, ...d, pct: d.fights > 0 ? d.w / d.fights : 0 }))
      .sort((a, b) => b.fights - a.fights);
  }, [allFights]);

  if (meta.length === 0) return null;

  const maxFights = Math.max(...meta.map((m) => m.fights), 1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-display flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-arena-fame" />
          All-Time Style Meta
        </CardTitle>
        <p className="text-[10px] text-muted-foreground font-mono">
          Cumulative across {allFights.length} recorded bouts
        </p>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {meta.map((s) => {
          const winPct = (s.pct * 100).toFixed(0);
          const usageWidth = (s.fights / maxFights) * 100;
          return (
            <div key={s.style} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-display text-foreground">{s.style}</span>
                <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                  <span>{s.fights} bout{s.fights !== 1 ? "s" : ""}</span>
                  <span className="text-primary font-semibold">{winPct}% W</span>
                  {s.k > 0 && <span className="text-arena-blood">{s.k}K</span>}
                </div>
              </div>
              {/* Stacked bar: wins vs losses */}
              <div className="h-3 bg-muted rounded-full overflow-hidden flex" style={{ width: `${usageWidth}%`, minWidth: "2rem" }}>
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${s.pct * 100}%` }}
                />
                <div
                  className="h-full bg-destructive/40 transition-all"
                  style={{ width: `${(1 - s.pct) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

/* ── Warrior Leaderboard ─────────────────────────────────── */

function WarriorLeaderboard({ allFights }: { allFights: FightSummary[] }) {
  const leaders = useMemo(() => {
    const m = new Map<string, { name: string; wins: number; losses: number; kills: number; streak: number; bestStreak: number; fame: number }>();
    const ensure = (n: string) => {
      if (!m.has(n)) m.set(n, { name: n, wins: 0, losses: 0, kills: 0, streak: 0, bestStreak: 0, fame: 0 });
      return m.get(n)!;
    };

    // Process in chronological order for streaks
    const sorted = [...allFights].sort((a, b) => a.week - b.week);
    for (const f of sorted) {
      const a = ensure(f.a);
      const d = ensure(f.d);
      a.fame += f.fameDeltaA ?? 0;
      d.fame += f.fameDeltaD ?? 0;

      if (f.winner === "A") {
        a.wins++; d.losses++;
        a.streak = a.streak >= 0 ? a.streak + 1 : 1;
        d.streak = d.streak <= 0 ? d.streak - 1 : -1;
        if (f.by === "Kill") a.kills++;
      } else if (f.winner === "D") {
        d.wins++; a.losses++;
        d.streak = d.streak >= 0 ? d.streak + 1 : 1;
        a.streak = a.streak <= 0 ? a.streak - 1 : -1;
        if (f.by === "Kill") d.kills++;
      } else {
        a.streak = 0; d.streak = 0;
      }
      a.bestStreak = Math.max(a.bestStreak, a.streak);
      d.bestStreak = Math.max(d.bestStreak, d.streak);
    }

    return [...m.values()];
  }, [allFights]);

  if (leaders.length === 0) return null;

  const byFame = [...leaders].sort((a, b) => b.fame - a.fame).slice(0, 5);
  const byKills = [...leaders].filter((l) => l.kills > 0).sort((a, b) => b.kills - a.kills).slice(0, 5);
  const byStreak = [...leaders].filter((l) => l.bestStreak > 1).sort((a, b) => b.bestStreak - a.bestStreak).slice(0, 5);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Fame leaders */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-display flex items-center gap-2">
            <Crown className="h-4 w-4 text-arena-gold" /> Top by Fame
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {byFame.map((l, i) => (
            <div key={l.name} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono w-4 ${i === 0 ? "text-arena-gold font-bold" : "text-muted-foreground"}`}>{i + 1}</span>
                <span className="text-xs font-display text-foreground truncate max-w-[120px]">{l.name}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="text-arena-fame">{l.fame} fame</span>
                <span className="text-muted-foreground">{l.wins}W-{l.losses}L</span>
              </div>
            </div>
          ))}
          {byFame.length === 0 && <p className="text-xs text-muted-foreground italic">No data yet.</p>}
        </CardContent>
      </Card>

      {/* Kill leaders */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-display flex items-center gap-2">
            <Skull className="h-4 w-4 text-arena-blood" /> Deadliest Fighters
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {byKills.map((l, i) => (
            <div key={l.name} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono w-4 ${i === 0 ? "text-arena-blood font-bold" : "text-muted-foreground"}`}>{i + 1}</span>
                <span className="text-xs font-display text-foreground truncate max-w-[120px]">{l.name}</span>
              </div>
              <span className="text-[10px] font-mono text-arena-blood">{l.kills} kill{l.kills !== 1 ? "s" : ""}</span>
            </div>
          ))}
          {byKills.length === 0 && <p className="text-xs text-muted-foreground italic">No kills yet.</p>}
        </CardContent>
      </Card>

      {/* Streak leaders */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-display flex items-center gap-2">
            <Zap className="h-4 w-4 text-arena-pop" /> Longest Win Streaks
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {byStreak.map((l, i) => (
            <div key={l.name} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono w-4 ${i === 0 ? "text-arena-pop font-bold" : "text-muted-foreground"}`}>{i + 1}</span>
                <span className="text-xs font-display text-foreground truncate max-w-[120px]">{l.name}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-mono">
                <span className="text-arena-pop">{l.bestStreak} streak</span>
                {l.streak > 1 && <Badge variant="outline" className="text-[8px] px-1 py-0 text-arena-pop border-arena-pop/30">ACTIVE</Badge>}
              </div>
            </div>
          ))}
          {byStreak.length === 0 && <p className="text-xs text-muted-foreground italic">No streaks yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Style Matchup Heatmap ───────────────────────────────── */

function StyleMatchupHeatmap({ allFights }: { allFights: FightSummary[] }) {
  const { styles, matrix } = useMemo(() => {
    // matrix[attacker][defender] = { wins, total }
    const m = new Map<string, Map<string, { wins: number; total: number }>>();
    const styleSet = new Set<string>();

    for (const f of allFights) {
      styleSet.add(f.styleA);
      styleSet.add(f.styleD);

      // A vs D
      if (!m.has(f.styleA)) m.set(f.styleA, new Map());
      if (!m.has(f.styleD)) m.set(f.styleD, new Map());

      const adEntry = m.get(f.styleA)!.get(f.styleD) ?? { wins: 0, total: 0 };
      const daEntry = m.get(f.styleD)!.get(f.styleA) ?? { wins: 0, total: 0 };
      adEntry.total++;
      daEntry.total++;
      if (f.winner === "A") adEntry.wins++;
      else if (f.winner === "D") daEntry.wins++;
      m.get(f.styleA)!.set(f.styleD, adEntry);
      m.get(f.styleD)!.set(f.styleA, daEntry);
    }

    const styles = [...styleSet].sort();
    return { styles, matrix: m };
  }, [allFights]);

  if (styles.length < 2) return null;

  function cellColor(pct: number): string {
    if (pct >= 0.7) return "bg-primary/80 text-primary-foreground";
    if (pct >= 0.55) return "bg-primary/40 text-foreground";
    if (pct >= 0.45) return "bg-muted text-muted-foreground";
    if (pct >= 0.3) return "bg-destructive/30 text-foreground";
    return "bg-destructive/60 text-destructive-foreground";
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-display flex items-center gap-2">
          <Grid3X3 className="h-4 w-4 text-primary" /> Style Matchup Heatmap
        </CardTitle>
        <p className="text-[10px] text-muted-foreground font-mono">
          Row style win % vs column style · hover for details
        </p>
      </CardHeader>
      <CardContent className="pt-0 overflow-x-auto">
        <table className="w-full border-collapse text-[10px]">
          <thead>
            <tr>
              <th className="p-1 text-left font-display text-muted-foreground sticky left-0 bg-card z-10">vs ↓</th>
              {styles.map((s) => (
                <th key={s} className="p-1 font-display text-muted-foreground text-center whitespace-nowrap" style={{ writingMode: "vertical-lr", transform: "rotate(180deg)", maxWidth: "2rem" }}>
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {styles.map((rowStyle) => (
              <tr key={rowStyle}>
                <td className="p-1 font-display text-foreground whitespace-nowrap sticky left-0 bg-card z-10 border-r border-border/30">
                  {rowStyle}
                </td>
                {styles.map((colStyle) => {
                  if (rowStyle === colStyle) {
                    return <td key={colStyle} className="p-1 text-center bg-border/20 text-muted-foreground/30">—</td>;
                  }
                  const entry = matrix.get(rowStyle)?.get(colStyle);
                  if (!entry || entry.total === 0) {
                    return <td key={colStyle} className="p-1 text-center text-muted-foreground/30">·</td>;
                  }
                  const pct = entry.wins / entry.total;
                  return (
                    <td key={colStyle} className="p-0.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={`rounded px-1 py-0.5 text-center font-mono font-semibold cursor-default ${cellColor(pct)}`}>
                            {Math.round(pct * 100)}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <span className="font-display">{rowStyle}</span> vs <span className="font-display">{colStyle}</span>
                          <br />
                          {entry.wins}W / {entry.total} bouts ({Math.round(pct * 100)}%)
                        </TooltipContent>
                      </Tooltip>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

/* ── Best Warrior by Style ───────────────────────────────── */

function BestByStyle({ allFights }: { allFights: FightSummary[] }) {
  const byStyle = useMemo(() => {
    // For each style, track each warrior's record
    const styleMap = new Map<string, Map<string, { wins: number; losses: number; kills: number; fame: number }>>();

    for (const f of allFights) {
      for (const side of ["A", "D"] as const) {
        const style = side === "A" ? f.styleA : f.styleD;
        const name = side === "A" ? f.a : f.d;
        if (!styleMap.has(style)) styleMap.set(style, new Map());
        const warriors = styleMap.get(style)!;
        if (!warriors.has(name)) warriors.set(name, { wins: 0, losses: 0, kills: 0, fame: 0 });
        const w = warriors.get(name)!;
        w.fame += (side === "A" ? f.fameDeltaA : f.fameDeltaD) ?? 0;
        if (f.winner === side) {
          w.wins++;
          if (f.by === "Kill") w.kills++;
        } else if (f.winner !== null) {
          w.losses++;
        }
      }
    }

    return [...styleMap.entries()]
      .map(([style, warriors]) => {
        const ranked = [...warriors.entries()]
          .map(([name, d]) => ({ name, ...d, pct: (d.wins + d.losses) > 0 ? d.wins / (d.wins + d.losses) : 0 }))
          .filter((w) => w.wins + w.losses >= 1)
          .sort((a, b) => b.wins - a.wins || b.pct - a.pct || b.fame - a.fame)
          .slice(0, 3);
        return { style, top: ranked };
      })
      .filter((s) => s.top.length > 0)
      .sort((a, b) => a.style.localeCompare(b.style));
  }, [allFights]);

  if (byStyle.length === 0) return null;

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-display flex items-center gap-2">
          <Trophy className="h-4 w-4 text-arena-gold" /> Champions by Style
        </CardTitle>
        <p className="text-[10px] text-muted-foreground font-mono">
          Top 3 warriors in each fighting style by wins
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {byStyle.map(({ style, top }) => (
            <div key={style} className="space-y-1.5">
              <h3 className="text-xs font-display text-foreground border-b border-border/50 pb-1">{style}</h3>
              {top.map((w, i) => (
                <div key={w.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm leading-none">{medals[i] ?? ""}</span>
                    <span className={`text-[11px] font-display truncate max-w-[100px] ${i === 0 ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                      {w.name}
                    </span>
                  </div>
                  <StatBadge styleName={style as any} career={{ wins: w.wins, losses: w.losses, kills: w.kills }} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Rising Stars ────────────────────────────────────────── */

function RisingStars({ allFights, currentWeek }: { allFights: FightSummary[]; currentWeek: number }) {
  const stars = useMemo(() => {
    const cutoff = Math.max(1, currentWeek - 2); // last 3 weeks inclusive
    const recent = allFights.filter((f) => f.week >= cutoff);

    const m = new Map<string, { name: string; fame: number; wins: number; losses: number; bouts: number }>();
    for (const f of recent) {
      for (const side of ["A", "D"] as const) {
        const name = side === "A" ? f.a : f.d;
        const entry = m.get(name) ?? { name, fame: 0, wins: 0, losses: 0, bouts: 0 };
        entry.fame += (side === "A" ? f.fameDeltaA : f.fameDeltaD) ?? 0;
        entry.bouts++;
        if (f.winner === side) entry.wins++;
        else if (f.winner !== null) entry.losses++;
        m.set(name, entry);
      }
    }

    return [...m.values()]
      .filter((w) => w.fame > 0)
      .sort((a, b) => b.fame - a.fame)
      .slice(0, 8);
  }, [allFights, currentWeek]);

  if (stars.length === 0) return null;

  const maxFame = Math.max(...stars.map((s) => s.fame), 1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-display flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-arena-pop" /> Rising Stars
        </CardTitle>
        <p className="text-[10px] text-muted-foreground font-mono">
          Biggest fame gains over the last 3 weeks
        </p>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {stars.map((s, i) => {
          const barW = (s.fame / maxFame) * 100;
          return (
            <div key={s.name} className="space-y-0.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono w-4 ${i === 0 ? "text-arena-pop font-bold" : "text-muted-foreground"}`}>{i + 1}</span>
                  <span className={`text-xs font-display truncate max-w-[140px] ${i === 0 ? "text-foreground font-semibold" : "text-foreground"}`}>{s.name}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                  <span className="text-arena-pop font-semibold">+{s.fame}</span>
                  <span>{s.wins}W-{s.losses}L</span>
                </div>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-arena-pop/70 transition-all" style={{ width: `${barW}%` }} />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}


import { Calendar } from "lucide-react";

function WeeklyIssue({ issue, state }: { issue: GazetteStory; state: any }) {
  const paragraphs = (issue.body || "").split("\n\n").filter(p => p.trim().length > 0);
  
  return (
    <article key={issue.week} className="space-y-6 relative overflow-hidden bg-card/50 p-6 md:p-10 rounded-none border border-border shadow-sm font-serif">
      {/* Decorative corners or borders could be added for more "paper" feel */}
      
      <div className="flex flex-col gap-4 border-b-2 border-foreground/20 pb-6">
        <div className="flex items-center justify-between text-[10px] font-mono tracking-[0.2em] uppercase text-muted-foreground border-b border-foreground/10 pb-2">
          <span>Vol. {Math.floor(issue.week / 4) + 1} · No. {issue.week}</span>
          <span>{state.season} · Week {issue.week}</span>
          <span>Arena District Edition</span>
        </div>
        
        <h2 className="text-4xl md:text-5xl lg:text-6xl text-foreground font-black tracking-tighter leading-[0.9] uppercase text-center md:text-left py-2">
          {issue.headline}
        </h2>

        <div className="flex flex-wrap gap-2 items-center justify-center md:justify-start">
          <Badge variant="destructive" className="bg-arena-blood text-white text-[10px] uppercase font-bold px-2 py-0 border-none rounded-none">
            LATEST
          </Badge>
          {issue.tags.map(tag => (
            <span key={tag} className="text-[10px] font-mono font-bold tracking-tighter text-muted-foreground px-2 border-l border-foreground/20 first:border-l-0">
              #{tag.toUpperCase()}
            </span>
          ))}
        </div>
      </div>

      <div className="columns-1 md:columns-2 lg:columns-3 gap-10 [column-rule:1px_solid_hsl(var(--border))]">
        {paragraphs.map((p, i) => (
          <p key={i} className={`text-[15px] leading-relaxed text-foreground/80 mb-6 text-justify ${i === 0 ? "first-letter:text-6xl first-letter:font-black first-letter:mr-3 first-letter:float-left first-letter:leading-[0.8] first-letter:text-primary first-letter:mt-1" : ""}`}>
            {p}
          </p>
        ))}
      </div>
      
      <div className="flex items-center justify-between border-t-2 border-foreground/20 pt-4 mt-4 opacity-70">
        <span className="text-[9px] font-mono uppercase tracking-[0.3em] font-bold">The Truth remains when the blood dries</span>
        <div className="flex items-center gap-4">
            <span className="text-[9px] font-mono uppercase tracking-widest font-bold">Price: 2 Copper</span>
            <Separator orientation="vertical" className="h-3 bg-foreground/20" />
            <span className="text-[9px] font-mono uppercase tracking-widest font-bold">Est. 412 AE</span>
        </div>
      </div>
    </article>
  );
}

/* ── main page ───────────────────────────────────────────── */

export default function Gazette() {
  const { state } = useGameStore();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allFights = useMemo(() => ArenaHistory.all(), [state.week]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const hallEntries = useMemo(() => LoreArchive.allHall(), [state.week]);

  const weeklyIssues = useMemo(() => {
    return [...(state.gazettes || [])].sort((a, b) => b.week - a.week);
  }, [state.gazettes]);

  const PAGE_SIZE = 4;
  const [shown, setShown] = useState(PAGE_SIZE);
  const visibleIssues = weeklyIssues.slice(0, shown);
  const hasMore = shown < weeklyIssues.length;
  const loadMore = useCallback(() => setShown((s) => s + PAGE_SIZE), []);
  const hasContent = weeklyIssues.length > 0;

  return (
    <div className="space-y-8">
      {/* Masthead */}
      <div className="text-center space-y-2 py-4">
        <div className="flex items-center justify-center gap-3">
          <Separator className="w-16" />
          <Newspaper className="h-6 w-6 text-arena-gold" />
          <Separator className="w-16" />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl tracking-wide text-foreground">
          The Arena Gazette
        </h1>
        <p className="text-sm text-muted-foreground font-mono tracking-widest uppercase">
          All the blood, glory & gossip from the sands
        </p>
        <div className="flex items-center justify-center gap-2">
          <Separator className="w-24" />
          <span className="text-[10px] text-muted-foreground font-mono">
            Week {state.week} · {state.season}
          </span>
          <Separator className="w-24" />
        </div>
      </div>

      {/* All-Time Meta Chart */}
      {hasContent && <AllTimeMetaChart allFights={allFights} />}

      {/* Warrior Leaderboard */}
      {hasContent && <WarriorLeaderboard allFights={allFights} />}

      {/* Style Matchup Heatmap */}
      {hasContent && <StyleMatchupHeatmap allFights={allFights} />}

      {/* Best Warrior by Style */}
      {hasContent && <BestByStyle allFights={allFights} />}

      {/* Rising Stars */}
      {hasContent && <RisingStars allFights={allFights} currentWeek={state.week} />}

      {!hasContent && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Newspaper className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground text-sm">No fights have been recorded yet.</p>
            <p className="text-muted-foreground text-xs mt-1">Run some rounds to fill the Gazette!</p>
          </CardContent>
        </Card>
      )}

      {/* Weekly Issues — paginated */}
            {visibleIssues.map((issue) => (
        <WeeklyIssue key={issue.week} issue={issue} state={state} />
      ))}      {/* Load More button */}
      {hasMore && (
        <div className="flex justify-center py-4">
          <button
            onClick={loadMore}
            className="px-6 py-2 rounded-lg border border-border bg-card hover:bg-secondary text-sm font-display text-foreground transition-colors"
          >
            Load Older Issues ({weeklyIssues.length - shown} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
