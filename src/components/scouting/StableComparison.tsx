import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, ArrowLeftRight, TrendingUp, Swords, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { RivalStableData, Warrior } from "@/types/game";
import { ATTRIBUTE_KEYS, STYLE_DISPLAY_NAMES } from "@/types/game";
import { ComparisonBar } from "./ComparisonBar";
import { ComparisonHeader } from "./ComparisonHeader";
import { HeadToHead } from "./HeadToHead";

interface StableComparisonProps {
  rivals: RivalStableData[];
}

function stableStats(rival: RivalStableData) {
  const active: Warrior[] = [];
  let totalWins = 0;
  let totalLosses = 0;
  let totalKills = 0;
  let totalFame = 0;

  const styleCounts: Record<string, number> = {};
  const sumAttrs: Record<string, number> = {};
  let topWarrior: Warrior | null = null;

  // ⚡ Bolt: Single O(N) pass to collect stats, compute totals, and find max
  for (let i = 0; i < rival.roster.length; i++) {
    const w = rival.roster[i];
    if (w.status !== "Active") continue;

    active.push(w);
    totalWins += w.career.wins;
    totalLosses += w.career.losses;
    totalKills += w.career.kills;
    totalFame += w.fame ?? 0;

    styleCounts[w.style] = (styleCounts[w.style] ?? 0) + 1;

    for (let j = 0; j < ATTRIBUTE_KEYS.length; j++) {
      const key = ATTRIBUTE_KEYS[j];
      sumAttrs[key] = (sumAttrs[key] ?? 0) + (w.attributes[key] ?? 0);
    }

    if (!topWarrior || (w.fame ?? 0) > (topWarrior.fame ?? 0)) {
      topWarrior = w;
    }
  }

  const avgFame = active.length > 0 ? Math.round(totalFame / active.length) : 0;
  const winRate = totalWins + totalLosses > 0 ? Math.round((totalWins / (totalWins + totalLosses)) * 100) : 0;

  const avgAttrs: Record<string, number> = {};
  if (active.length > 0) {
    for (let j = 0; j < ATTRIBUTE_KEYS.length; j++) {
      const key = ATTRIBUTE_KEYS[j];
      avgAttrs[key] = Math.round((sumAttrs[key] ?? 0) / active.length);
    }
  }

  return { active, totalWins, totalLosses, totalKills, totalFame, avgFame, winRate, styleCounts, avgAttrs, topWarrior, rosterSize: active.length };
}

function StableSelector({
  rivals, idA, setIdA, idB, setIdB
}: {
  rivals: RivalStableData[]; idA: string | null; setIdA: (id: string | null) => void; idB: string | null; setIdB: (id: string | null) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-3">
        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2">TACTICAL_ASSET_A</label>
        <div className="grid grid-cols-1 gap-1.5">
          {rivals.map((r) => (
            <Tooltip key={r.owner.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIdA(r.owner.id === idA ? null : r.owner.id)}
                  disabled={r.owner.id === idB}
                  className={cn(
                    "w-full text-left px-4 py-2.5 rounded-xl border font-display font-black uppercase text-[10px] tracking-tight transition-all",
                    idA === r.owner.id
                      ? "border-primary bg-primary/10 text-primary shadow-[0_0_15px_-5px_rgba(var(--primary-rgb),0.3)]"
                      : r.owner.id === idB
                      ? "border-border/10 text-muted-foreground/20 cursor-not-allowed grayscale"
                      : "border-border/30 bg-glass-card hover:border-primary/40 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Shield className="h-3.5 w-3.5" />
                    {r.owner.stableName}
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p className="text-[10px] font-black uppercase tracking-widest">Compare this stable (A)</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2">TACTICAL_ASSET_B</label>
        <div className="grid grid-cols-1 gap-1.5">
          {rivals.map((r) => (
            <Tooltip key={r.owner.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIdB(r.owner.id === idB ? null : r.owner.id)}
                  disabled={r.owner.id === idA}
                  className={cn(
                    "w-full text-left px-4 py-2.5 rounded-xl border font-display font-black uppercase text-[10px] tracking-tight transition-all",
                    idB === r.owner.id
                      ? "border-accent bg-accent/10 text-accent shadow-[0_0_15px_-5px_rgba(var(--accent-rgb),0.3)]"
                      : r.owner.id === idA
                      ? "border-border/10 text-muted-foreground/20 cursor-not-allowed grayscale"
                      : "border-border/30 bg-glass-card hover:border-accent/40 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Shield className="h-3.5 w-3.5" />
                    {r.owner.stableName}
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="text-[10px] font-black uppercase tracking-widest">Compare this stable (B)</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StableComparison({ rivals }: StableComparisonProps) {
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
      <StableSelector rivals={rivals} idA={idA} setIdA={setIdA} idB={idB} setIdB={setIdB} />

      {statsA && statsB && rivalA && rivalB && (
        <div className="space-y-6">
          <ComparisonHeader rivalA={rivalA} rivalB={rivalB} />

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

          <HeadToHead nameA={rivalA.owner.stableName} nameB={rivalB.owner.stableName} rosterA={rivalA.roster} rosterB={rivalB.roster} />
        </div>
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
