/**
 * Stable Lords — Scouting Page with Comparison Mode
 */
import React, { useState, useCallback, useMemo } from "react";
import { useGameStore } from "@/state/useGameStore";
import { generateScoutReport, getScoutCost, type ScoutQuality } from "@/engine/scouting";
import { ArenaHistory } from "@/engine/history/arenaHistory";
import type { Warrior, ScoutReportData, RivalStableData, FightSummary } from "@/types/game";
import { STYLE_DISPLAY_NAMES, ATTRIBUTE_KEYS, ATTRIBUTE_LABELS } from "@/types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatBadge } from "@/components/ui/StatBadge";
import { WarriorNameTag } from "@/components/ui/WarriorNameTag";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Eye, Shield, Coins, Users, Swords, ArrowLeftRight, Trophy, Skull, TrendingUp, UserRoundSearch } from "lucide-react";
import { toast } from "sonner";

const QUALITIES: ScoutQuality[] = ["Basic", "Detailed", "Expert"];

/* ── Comparison helpers ──────────────────────────────────── */

function stableStats(rival: RivalStableData) {
  const active = rival.roster.filter((w) => w.status === "Active");
  const totalWins = active.reduce((s, w) => s + w.career.wins, 0);
  const totalLosses = active.reduce((s, w) => s + w.career.losses, 0);
  const totalKills = active.reduce((s, w) => s + w.career.kills, 0);
  const totalFame = active.reduce((s, w) => s + (w.fame ?? 0), 0);
  const avgFame = active.length > 0 ? Math.round(totalFame / active.length) : 0;
  const winRate = totalWins + totalLosses > 0 ? Math.round((totalWins / (totalWins + totalLosses)) * 100) : 0;

  // Style breakdown
  const styleCounts: Record<string, number> = {};
  for (const w of active) {
    styleCounts[w.style] = (styleCounts[w.style] ?? 0) + 1;
  }

  // Avg attributes
  const avgAttrs: Record<string, number> = {};
  if (active.length > 0) {
    for (const key of ATTRIBUTE_KEYS) {
      avgAttrs[key] = Math.round(active.reduce((s, w) => s + (w.attributes[key] ?? 0), 0) / active.length);
    }
  }

  // Top warrior
  const topWarrior = active.length > 0 ? [...active].sort((a, b) => (b.fame ?? 0) - (a.fame ?? 0))[0] : null;

  return { active, totalWins, totalLosses, totalKills, totalFame, avgFame, winRate, styleCounts, avgAttrs, topWarrior, rosterSize: active.length };
}

function ComparisonBar({ label, valA, valB, maxVal, colorA, colorB }: {
  label: string; valA: number; valB: number; maxVal: number; colorA: string; colorB: string;
}) {
  const pctA = maxVal > 0 ? (valA / maxVal) * 100 : 0;
  const pctB = maxVal > 0 ? (valB / maxVal) * 100 : 0;
  const aWins = valA > valB;
  const bWins = valB > valA;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className={`font-mono ${aWins ? "text-foreground font-bold" : "text-muted-foreground"}`}>{valA}</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
        <span className={`font-mono ${bWins ? "text-foreground font-bold" : "text-muted-foreground"}`}>{valB}</span>
      </div>
      <div className="flex gap-1 items-center">
        <div className="flex-1 flex justify-end">
          <div className="h-2 bg-muted rounded-full overflow-hidden w-full flex justify-end">
            <div className={`h-full rounded-full ${colorA} transition-all`} style={{ width: `${pctA}%` }} />
          </div>
        </div>
        <div className="w-1" />
        <div className="flex-1">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${colorB} transition-all`} style={{ width: `${pctB}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Comparison Panel ────────────────────────────────────── */

function StableComparison({ rivals }: { rivals: RivalStableData[] }) {
  const [idA, setIdA] = useState<string | null>(null);
  const [idB, setIdB] = useState<string | null>(null);

  const rivalA = useMemo(() => rivals.find((r) => r.owner.id === idA), [rivals, idA]);
  const rivalB = useMemo(() => rivals.find((r) => r.owner.id === idB), [rivals, idB]);

  const statsA = useMemo(() => rivalA ? stableStats(rivalA) : null, [rivalA]);
  const statsB = useMemo(() => rivalB ? stableStats(rivalB) : null, [rivalB]);

  if (rivals.length < 2) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <ArrowLeftRight className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Need at least 2 rival stables to compare. Run more rounds to generate rivals.</p>
        </CardContent>
      </Card>
    );
  }

  const maxWins = Math.max(statsA?.totalWins ?? 0, statsB?.totalWins ?? 0, 1);
  const maxKills = Math.max(statsA?.totalKills ?? 0, statsB?.totalKills ?? 0, 1);
  const maxFame = Math.max(statsA?.totalFame ?? 0, statsB?.totalFame ?? 0, 1);
  const maxRoster = Math.max(statsA?.rosterSize ?? 0, statsB?.rosterSize ?? 0, 1);
  const maxAttr = 25;

  return (
    <div className="space-y-6">
      {/* Selector row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Stable A</label>
          <div className="space-y-1.5">
            {rivals.map((r) => (
              <button
                key={r.owner.id}
                onClick={() => setIdA(r.owner.id === idA ? null : r.owner.id)}
                disabled={r.owner.id === idB}
                className={`w-full text-left px-3 py-2 rounded-lg border text-sm font-display transition-all ${
                  idA === r.owner.id
                    ? "border-primary bg-primary/10 text-foreground"
                    : r.owner.id === idB
                    ? "border-border/30 text-muted-foreground/30 cursor-not-allowed"
                    : "border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5" />
                  {r.owner.stableName}
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Stable B</label>
          <div className="space-y-1.5">
            {rivals.map((r) => (
              <button
                key={r.owner.id}
                onClick={() => setIdB(r.owner.id === idB ? null : r.owner.id)}
                disabled={r.owner.id === idA}
                className={`w-full text-left px-3 py-2 rounded-lg border text-sm font-display transition-all ${
                  idB === r.owner.id
                    ? "border-accent bg-accent/10 text-foreground"
                    : r.owner.id === idA
                    ? "border-border/30 text-muted-foreground/30 cursor-not-allowed"
                    : "border-border hover:border-accent/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5" />
                  {r.owner.stableName}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison body */}
      {statsA && statsB && rivalA && rivalB && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <h3 className="font-display text-sm font-bold text-foreground">{rivalA.owner.stableName}</h3>
              <Badge variant="outline" className="text-[9px] mt-1">{rivalA.tier}</Badge>
            </div>
            <ArrowLeftRight className="h-5 w-5 text-muted-foreground mx-4 flex-shrink-0" />
            <div className="text-center flex-1">
              <h3 className="font-display text-sm font-bold text-foreground">{rivalB.owner.stableName}</h3>
              <Badge variant="outline" className="text-[9px] mt-1">{rivalB.tier}</Badge>
            </div>
          </div>

          {/* Key stats comparison bands */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-display flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Key Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ComparisonBar label="Roster Size" valA={statsA.rosterSize} valB={statsB.rosterSize} maxVal={maxRoster} colorA="bg-primary" colorB="bg-accent" />
              <ComparisonBar label="Total Wins" valA={statsA.totalWins} valB={statsB.totalWins} maxVal={maxWins} colorA="bg-primary" colorB="bg-accent" />
              <ComparisonBar label="Win Rate %" valA={statsA.winRate} valB={statsB.winRate} maxVal={100} colorA="bg-primary" colorB="bg-accent" />
              <ComparisonBar label="Total Kills" valA={statsA.totalKills} valB={statsB.totalKills} maxVal={maxKills} colorA="bg-primary" colorB="bg-accent" />
              <ComparisonBar label="Total Fame" valA={statsA.totalFame} valB={statsB.totalFame} maxVal={maxFame} colorA="bg-primary" colorB="bg-accent" />
              <ComparisonBar label="Avg Fame" valA={statsA.avgFame} valB={statsB.avgFame} maxVal={Math.max(statsA.avgFame, statsB.avgFame, 1)} colorA="bg-primary" colorB="bg-accent" />
            </CardContent>
          </Card>

          {/* Average attributes comparison */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-display flex items-center gap-2">
                <Swords className="h-4 w-4 text-arena-gold" /> Average Attributes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ATTRIBUTE_KEYS.map((key) => (
                <ComparisonBar
                  key={key}
                  label={key}
                  valA={statsA.avgAttrs[key] ?? 0}
                  valB={statsB.avgAttrs[key] ?? 0}
                  maxVal={maxAttr}
                  colorA="bg-primary"
                  colorB="bg-accent"
                />
              ))}
            </CardContent>
          </Card>

          {/* Style breakdown */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-display">{rivalA.owner.stableName} Styles</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {Object.entries(statsA.styleCounts).sort(([, a], [, b]) => b - a).map(([style, count]) => (
                  <div key={style} className="flex items-center justify-between py-1 text-[11px]">
                    <span className="text-foreground">{STYLE_DISPLAY_NAMES[style as keyof typeof STYLE_DISPLAY_NAMES] ?? style}</span>
                    <Badge variant="outline" className="text-[9px] font-mono">{count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-display">{rivalB.owner.stableName} Styles</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {Object.entries(statsB.styleCounts).sort(([, a], [, b]) => b - a).map(([style, count]) => (
                  <div key={style} className="flex items-center justify-between py-1 text-[11px]">
                    <span className="text-foreground">{STYLE_DISPLAY_NAMES[style as keyof typeof STYLE_DISPLAY_NAMES] ?? style}</span>
                    <Badge variant="outline" className="text-[9px] font-mono">{count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Top warriors face-off */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-display flex items-center gap-2">
                <Trophy className="h-4 w-4 text-arena-gold" /> Top Warriors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[statsA.topWarrior, statsB.topWarrior].map((w, i) => (
                  <div key={i} className={`p-3 rounded-lg border ${i === 0 ? "border-primary/30 bg-primary/5" : "border-accent/30 bg-accent/5"}`}>
                    {w ? (
                      <>
                        <div className="font-display text-sm font-bold text-foreground">{w.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-1">
                          {STYLE_DISPLAY_NAMES[w.style as keyof typeof STYLE_DISPLAY_NAMES] ?? w.style}
                        </div>
                        <div className="flex gap-3 mt-2 text-[10px] font-mono">
                          <span>{w.career.wins}W-{w.career.losses}L</span>
                          {w.career.kills > 0 && <span className="text-arena-blood">{w.career.kills}K</span>}
                          <span className="text-arena-fame">{w.fame ?? 0}F</span>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No active warriors</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Head-to-Head Bout History */}
      {statsA && statsB && rivalA && rivalB && (
        <HeadToHead nameA={rivalA.owner.stableName} nameB={rivalB.owner.stableName} rosterA={rivalA.roster} rosterB={rivalB.roster} />
      )}

      {(!statsA || !statsB) && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground">
            <ArrowLeftRight className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Select two rival stables to compare side-by-side.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ── Head-to-Head History ────────────────────────────────── */

function HeadToHead({ nameA, nameB, rosterA, rosterB }: { nameA: string; nameB: string; rosterA: Warrior[]; rosterB: Warrior[] }) {
  const allFights = useMemo(() => ArenaHistory.all(), []);
  const namesA = useMemo(() => new Set(rosterA.map(w => w.name)), [rosterA]);
  const namesB = useMemo(() => new Set(rosterB.map(w => w.name)), [rosterB]);

  const h2h = useMemo(() => {
    return allFights.filter(f =>
      (namesA.has(f.a) && namesB.has(f.d)) || (namesA.has(f.d) && namesB.has(f.a))
    );
  }, [allFights, namesA, namesB]);

  const winsA = h2h.filter(f => (namesA.has(f.a) && f.winner === "A") || (namesA.has(f.d) && f.winner === "D")).length;
  const winsB = h2h.filter(f => (namesB.has(f.a) && f.winner === "A") || (namesB.has(f.d) && f.winner === "D")).length;
  const draws = h2h.length - winsA - winsB;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-display flex items-center gap-2">
          <Swords className="h-4 w-4 text-arena-gold" /> Head-to-Head Record
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {h2h.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No direct matchups recorded between these stables.</p>
        ) : (
          <>
            <div className="flex items-center justify-between text-sm font-display">
              <span className="text-primary font-bold">{nameA}: {winsA}W</span>
              {draws > 0 && <span className="text-muted-foreground text-xs">{draws} Draw{draws !== 1 ? "s" : ""}</span>}
              <span className="text-accent font-bold">{nameB}: {winsB}W</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden flex bg-muted">
              {winsA > 0 && <div className="h-full bg-primary transition-all" style={{ width: `${(winsA / h2h.length) * 100}%` }} />}
              {draws > 0 && <div className="h-full bg-muted-foreground/30 transition-all" style={{ width: `${(draws / h2h.length) * 100}%` }} />}
              {winsB > 0 && <div className="h-full bg-accent transition-all" style={{ width: `${(winsB / h2h.length) * 100}%` }} />}
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {h2h.slice().reverse().map(f => {
                const aIsStableA = namesA.has(f.a);
                return (
                  <div key={f.id} className="flex items-center justify-between text-[11px] py-1 border-b border-border/20 last:border-0">
                    <span className="font-mono text-muted-foreground/50 w-10">Wk{f.week}</span>
                    <span className={`flex-1 truncate ${(aIsStableA && f.winner === "A") || (!aIsStableA && f.winner === "D") ? "font-bold text-foreground" : "text-muted-foreground"}`}>
                      {f.a}
                    </span>
                    <Badge variant="outline" className="text-[9px] mx-1">{f.by ?? "Draw"}</Badge>
                    <span className={`flex-1 truncate text-right ${(!aIsStableA && f.winner === "A") || (aIsStableA && f.winner === "D") ? "font-bold text-foreground" : "text-muted-foreground"}`}>
                      {f.d}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Warrior Comparison ──────────────────────────────────── */

function WarriorComparison({ rivals, playerRoster }: { rivals: RivalStableData[]; playerRoster: Warrior[] }) {
  const [wIdA, setWIdA] = useState<string | null>(null);
  const [wIdB, setWIdB] = useState<string | null>(null);

  const allWarriors = useMemo(() => {
    const list: { warrior: Warrior; stable: string }[] = [];
    for (const w of playerRoster.filter(w => w.status === "Active")) list.push({ warrior: w, stable: "Your Stable" });
    for (const r of rivals) {
      for (const w of r.roster.filter(w => w.status === "Active")) list.push({ warrior: w, stable: r.owner.stableName });
    }
    return list;
  }, [rivals, playerRoster]);

  const entryA = useMemo(() => allWarriors.find(e => e.warrior.id === wIdA), [allWarriors, wIdA]);
  const entryB = useMemo(() => allWarriors.find(e => e.warrior.id === wIdB), [allWarriors, wIdB]);

  if (allWarriors.length < 2) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <UserRoundSearch className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Need at least 2 warriors to compare.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Warrior selectors */}
      <div className="grid grid-cols-2 gap-4">
        {[{ sel: wIdA, setSel: setWIdA, other: wIdB, label: "Warrior A", color: "primary" },
          { sel: wIdB, setSel: setWIdB, other: wIdA, label: "Warrior B", color: "accent" }].map(({ sel, setSel, other, label, color }) => (
          <div key={label} className="space-y-2">
            <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{label}</label>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {allWarriors.map(({ warrior: w, stable }) => (
                <button
                  key={w.id}
                  onClick={() => setSel(w.id === sel ? null : w.id)}
                  disabled={w.id === other}
                  className={`w-full text-left px-3 py-1.5 rounded-lg border text-[11px] transition-all ${
                    sel === w.id
                      ? `border-${color} bg-${color}/10 text-foreground`
                      : w.id === other
                      ? "border-border/30 text-muted-foreground/30 cursor-not-allowed"
                      : "border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <WarriorNameTag id={w.id} name={w.name} />
                    <StatBadge styleName={w.style} showFullName />
                  </div>
                  <div className="text-[9px] text-muted-foreground">{stable}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Comparison */}
      {entryA && entryB && (() => {
        const a = entryA.warrior;
        const b = entryB.warrior;
        const maxAttr = 25;
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <h3 className="font-display text-sm font-bold">{a.name}</h3>
                <div className="text-[10px] text-muted-foreground">{STYLE_DISPLAY_NAMES[a.style]} · {entryA.stable}</div>
              </div>
              <Swords className="h-5 w-5 text-muted-foreground mx-3" />
              <div className="text-center flex-1">
                <h3 className="font-display text-sm font-bold">{b.name}</h3>
                <div className="text-[10px] text-muted-foreground">{STYLE_DISPLAY_NAMES[b.style]} · {entryB.stable}</div>
              </div>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-display">Attributes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {ATTRIBUTE_KEYS.map(key => (
                  <ComparisonBar key={key} label={key} valA={a.attributes[key] ?? 0} valB={b.attributes[key] ?? 0} maxVal={maxAttr} colorA="bg-primary" colorB="bg-accent" />
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-display">Career</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <ComparisonBar label="Wins" valA={a.career.wins} valB={b.career.wins} maxVal={Math.max(a.career.wins, b.career.wins, 1)} colorA="bg-primary" colorB="bg-accent" />
                <ComparisonBar label="Losses" valA={a.career.losses} valB={b.career.losses} maxVal={Math.max(a.career.losses, b.career.losses, 1)} colorA="bg-primary" colorB="bg-accent" />
                <ComparisonBar label="Kills" valA={a.career.kills} valB={b.career.kills} maxVal={Math.max(a.career.kills, b.career.kills, 1)} colorA="bg-primary" colorB="bg-accent" />
                <ComparisonBar label="Fame" valA={a.fame ?? 0} valB={b.fame ?? 0} maxVal={Math.max(a.fame ?? 0, b.fame ?? 0, 1)} colorA="bg-primary" colorB="bg-accent" />
                <ComparisonBar label="Popularity" valA={a.popularity ?? 0} valB={b.popularity ?? 0} maxVal={Math.max(a.popularity ?? 0, b.popularity ?? 0, 1)} colorA="bg-primary" colorB="bg-accent" />
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {(!entryA || !entryB) && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground">
            <UserRoundSearch className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Select two warriors to compare side-by-side.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────── */

export default function Scouting() {
  const { state, setState } = useGameStore();
  const [selectedRival, setSelectedRival] = useState<string | null>(null);
  const [selectedWarrior, setSelectedWarrior] = useState<string | null>(null);

  const activeRival = useMemo(
    () => (state.rivals ?? []).find((r) => r.owner.id === selectedRival),
    [state.rivals, selectedRival]
  );

  const activeWarrior = useMemo(
    () => activeRival?.roster.find((w) => w.id === selectedWarrior),
    [activeRival, selectedWarrior]
  );

  const rivals = useMemo(() => state.rivals ?? [], [state.rivals]);
  const reports = useMemo(() => state.scoutReports ?? [], [state.scoutReports]);

  const existingReport = useMemo(
    () => activeWarrior ? reports.find((r) => r.warriorName === activeWarrior.name) : null,
    [reports, activeWarrior]
  );

  const handleScout = useCallback(
    (quality: ScoutQuality) => {
      if (!activeWarrior) return;
      const cost = getScoutCost(quality);
      if ((state.gold ?? 0) < cost) {
        toast.error(`Not enough gold! Scouting costs ${cost}g.`);
        return;
      }

      const report = generateScoutReport(activeWarrior, quality, state.week);
      const reportData: ScoutReportData = report;

      const newReports = [
        ...(state.scoutReports ?? []).filter((r) => r.warriorName !== activeWarrior.name),
        reportData,
      ];

      setState({
        ...state,
        scoutReports: newReports,
        gold: (state.gold ?? 0) - cost,
        ledger: [...(state.ledger ?? []), {
          week: state.week,
          label: `Scout: ${activeWarrior.name} (${quality})`,
          amount: -cost,
          category: "other" as const,
        }],
      });
      toast.success(`Intel gathered on ${activeWarrior.name}! (-${cost}g)`);
    },
    [state, setState, activeWarrior]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-display font-bold flex items-center gap-2">
          <Search className="h-6 w-6 text-primary" /> Perception Intel
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Scout rival warriors or compare stables side-by-side.
        </p>
      </div>

      <Tabs defaultValue="scout" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="scout" className="gap-1.5">
            <Eye className="h-3.5 w-3.5" /> Scout Intel
          </TabsTrigger>
          <TabsTrigger value="compare" className="gap-1.5">
            <ArrowLeftRight className="h-3.5 w-3.5" /> Stables
          </TabsTrigger>
          <TabsTrigger value="warriors" className="gap-1.5">
            <UserRoundSearch className="h-3.5 w-3.5" /> Warriors
          </TabsTrigger>
        </TabsList>

        {/* Scout Tab */}
        <TabsContent value="scout" className="mt-4">
          {rivals.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No rival stables detected. Start a new game to generate rivals.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Rival Stables List */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Rival Stables
                </h3>
                {rivals.map((rival) => (
                  <Card
                    key={rival.owner.id}
                    className={`cursor-pointer transition-all ${
                      selectedRival === rival.owner.id ? "border-primary ring-1 ring-primary/30" : "hover:border-primary/30"
                    }`}
                    onClick={() => {
                      setSelectedRival(rival.owner.id);
                      setSelectedWarrior(null);
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-accent" />
                        <span className="font-display font-semibold text-sm">{rival.owner.stableName}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {rival.roster.filter((w) => w.status === "Active").length} warriors
                        </span>
                        <span>{rival.owner.personality}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Warriors in selected rival */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {activeRival ? `${activeRival.owner.stableName} Warriors` : "Select a Stable"}
                </h3>
                {activeRival?.roster.filter((w) => w.status === "Active").map((w) => {
                  const hasReport = reports.some((r) => r.warriorName === w.name);
                  return (
                    <Card
                      key={w.id}
                      className={`cursor-pointer transition-all ${
                        selectedWarrior === w.id ? "border-primary ring-1 ring-primary/30" : "hover:border-primary/30"
                      }`}
                      onClick={() => setSelectedWarrior(w.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <WarriorNameTag id={w.id} name={w.name} />
                            <StatBadge styleName={w.style} showFullName />
                          </div>
                          {hasReport && (
                            <Badge variant="secondary" className="text-[10px] gap-1">
                              <Eye className="h-3 w-3" /> Scouted
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {w.career.wins}W-{w.career.losses}L
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {!activeRival && (
                  <p className="text-sm text-muted-foreground italic">Click a rival stable to see their warriors.</p>
                )}
              </div>

              {/* Scout Report / Action */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Intel Report
                </h3>
                {activeWarrior ? (
                  <>
                    {!existingReport && (
                      <Card>
                        <CardContent className="p-4 space-y-3">
                          <p className="text-sm text-muted-foreground">
                            Commission a scouting report on <span className="text-foreground font-semibold">{activeWarrior.name}</span>.
                          </p>
                          <div className="space-y-2">
                            {QUALITIES.map((q) => {
                              const cost = getScoutCost(q);
                              const canAfford = (state.gold ?? 0) >= cost;
                              return (
                                <Button
                                  key={q}
                                  variant={q === "Expert" ? "default" : "outline"}
                                  className="w-full justify-between"
                                  disabled={!canAfford}
                                  onClick={() => handleScout(q)}
                                >
                                  <span className="flex items-center gap-2">
                                    <Eye className="h-3.5 w-3.5" /> {q} Scout
                                  </span>
                                  <Badge variant="outline" className="font-mono gap-1">
                                    <Coins className="h-3 w-3 text-arena-gold" /> {cost}g
                                  </Badge>
                                </Button>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {existingReport && (
                      <Card className="border-primary/30">
                        <CardHeader className="pb-2">
                          <CardTitle className="font-display text-base flex items-center gap-2">
                            <Eye className="h-4 w-4 text-primary" />
                            {existingReport.warriorName}
                            <Badge variant="secondary" className="text-[10px]">{existingReport.quality}</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Style:</span>{" "}
                            <span className="font-semibold">{STYLE_DISPLAY_NAMES[existingReport.style as keyof typeof STYLE_DISPLAY_NAMES] ?? existingReport.style}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Record:</span>{" "}
                            <span className="font-mono">{existingReport.record}</span>
                          </div>

                          <div className="space-y-1.5">
                            <div className="text-xs font-medium text-muted-foreground">Estimated Attributes</div>
                            {ATTRIBUTE_KEYS.map((key) => {
                              const range = existingReport.attributeRanges[key];
                              if (!range) return null;
                              return (
                                <div key={key} className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground w-8 font-mono">{key}</span>
                                  <div className="flex-1">
                                    <div className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{range}</div>
                                  </div>

                                </div>
                              );
                            })}
                          </div>

                          {existingReport.suspectedOE && (
                            <div className="flex gap-3 text-xs">
                              <span className="text-muted-foreground">Suspected OE: <span className="text-foreground font-medium">{existingReport.suspectedOE}</span></span>
                              <span className="text-muted-foreground">AL: <span className="text-foreground font-medium">{existingReport.suspectedAL}</span></span>
                            </div>
                          )}

                          {existingReport.knownInjuries.length > 0 && (
                            <div className="text-xs">
                              <span className="text-muted-foreground">Known injuries:</span>{" "}
                              <span className="text-destructive">{existingReport.knownInjuries.join(", ")}</span>
                            </div>
                          )}

                          <p className="text-xs text-muted-foreground italic">{existingReport.notes}</p>

                          {existingReport.quality !== "Expert" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => handleScout(existingReport.quality === "Basic" ? "Detailed" : "Expert")}
                            >
                              Upgrade Intel
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Select a warrior to scout.</p>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Compare Stables Tab */}
        <TabsContent value="compare" className="mt-4">
          <StableComparison rivals={rivals} />
        </TabsContent>

        {/* Compare Warriors Tab */}
        <TabsContent value="warriors" className="mt-4">
          <WarriorComparison rivals={rivals} playerRoster={state.roster} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
