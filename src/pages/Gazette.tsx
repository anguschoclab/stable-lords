import { useMemo } from "react";
import { useGame } from "@/state/GameContext";
import { ArenaHistory } from "@/engine/history/arenaHistory";
import { StyleRollups } from "@/engine/stats/styleRollups";
import { LoreArchive } from "@/lore/LoreArchive";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Newspaper, Trophy, Swords, TrendingUp, Skull, Flame, Star } from "lucide-react";
import type { FightSummary, HallEntry } from "@/types/game";

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

/* ── main page ───────────────────────────────────────────── */

export default function Gazette() {
  const { state } = useGame();

  const allFights = useMemo(() => ArenaHistory.all(), [state.week]);
  const hallEntries = useMemo(() => LoreArchive.allHall(), [state.week]);

  // Group fights by week, descending
  const weeklyIssues = useMemo(() => {
    const byWeek = new Map<number, FightSummary[]>();
    for (const f of allFights) {
      const arr = byWeek.get(f.week) ?? [];
      arr.push(f);
      byWeek.set(f.week, arr);
    }
    return [...byWeek.entries()]
      .sort(([a], [b]) => b - a)
      .map(([week, fights]) => {
        // Find fight of the week
        const fotwEntry = hallEntries.find(
          (h) => h.week === week && h.label === "Fight of the Week"
        );
        let fotwId = fotwEntry?.fightId ?? null;
        // Fallback: highest scored fight
        if (!fotwId && fights.length > 0) {
          fotwId = fights.reduce((best, f) => (scoreFight(f) > scoreFight(best) ? f : best), fights[0]).id;
        }

        const kills = fights.filter((f) => f.by === "Kill").length;
        const kos = fights.filter((f) => f.by === "KO").length;

        // Style rollups for this week
        const rollup = StyleRollups.getWeekRollup(week);

        return { week, fights, fotwId, kills, kos, rollup };
      });
  }, [allFights, hallEntries]);

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

      {!hasContent && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Newspaper className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground text-sm">No fights have been recorded yet.</p>
            <p className="text-muted-foreground text-xs mt-1">Run some rounds to fill the Gazette!</p>
          </CardContent>
        </Card>
      )}

      {/* Weekly Issues */}
      {weeklyIssues.map(({ week, fights, fotwId, kills, kos, rollup }) => {
        const fotw = fights.find((f) => f.id === fotwId);
        const otherFights = fights.filter((f) => f.id !== fotwId);
        const styleEntries = Object.entries(rollup).sort(
          ([, a], [, b]) => b.fights - a.fights
        );

        return (
          <article key={week} className="space-y-4">
            {/* Week Header */}
            <div className="flex items-end gap-3 border-b-2 border-accent/30 pb-2">
              <h2 className="font-display text-xl text-foreground leading-none">
                Week {week}
              </h2>
              <div className="flex gap-2 mb-0.5">
                <Badge variant="outline" className="text-[10px] font-mono gap-1">
                  <Swords className="h-3 w-3" /> {fights.length} bout{fights.length !== 1 ? "s" : ""}
                </Badge>
                {kos > 0 && (
                  <Badge variant="outline" className="text-[10px] font-mono gap-1 text-arena-gold border-arena-gold/30">
                    <Flame className="h-3 w-3" /> {kos} KO{kos !== 1 ? "s" : ""}
                  </Badge>
                )}
                {kills > 0 && (
                  <Badge variant="outline" className="text-[10px] font-mono gap-1 text-arena-blood border-arena-blood/30">
                    <Skull className="h-3 w-3" /> {kills} kill{kills !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left column: Fights */}
              <div className="lg:col-span-2 space-y-3">
                {/* Fight of the Week highlight */}
                {fotw && <FightCard fight={fotw} isFOTW />}

                {/* Other fights */}
                {otherFights.map((f) => (
                  <FightCard key={f.id} fight={f} isFOTW={false} />
                ))}

                {fights.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No bouts this week.</p>
                )}
              </div>

              {/* Right column: Style Trends */}
              <div className="space-y-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-display flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-arena-fame" />
                      Style Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {styleEntries.length > 0 ? (
                      <div className="space-y-0.5">
                        {styleEntries.map(([style, data]) => (
                          <StyleTrendRow key={style} style={style} {...data} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No style data.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Headlines / flavor */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-display flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-arena-gold" />
                      Headlines
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    {fotw && (
                      <p className="text-xs text-foreground">
                        <span className="font-semibold">{winnerName(fotw)}</span>
                        {fotw.by === "Kill"
                          ? " slays "
                          : fotw.by === "KO"
                          ? " knocks out "
                          : " defeats "}
                        <span className="font-semibold">
                          {fotw.winner === "A" ? fotw.d : fotw.a}
                        </span>{" "}
                        in the bout of the week!
                      </p>
                    )}
                    {kills > 0 && (
                      <p className="text-xs text-arena-blood">
                        {kills} warrior{kills !== 1 ? "s" : ""} fell to the sands this week. The crowd roars.
                      </p>
                    )}
                    {fights.length > 3 && (
                      <p className="text-xs text-muted-foreground italic">
                        A busy week at the arena — {fights.length} bouts kept the fans entertained.
                      </p>
                    )}
                    {fights.length <= 3 && fights.length > 0 && (
                      <p className="text-xs text-muted-foreground italic">
                        A quiet week. The sands thirst for more.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            <Separator className="mt-6" />
          </article>
        );
      })}
    </div>
  );
}
