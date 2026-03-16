import React from "react";
import { STYLE_DISPLAY_NAMES } from "@/types/game";
import type { Warrior, FightSummary } from "@/types/game";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Swords, Trophy } from "lucide-react";

/* ── helpers ─────────────────────────────────────────────── */

function bestFight(warrior: Warrior, fights: FightSummary[]): FightSummary | null {
  const wFights = fights.filter(f => f.a === warrior.name || f.d === warrior.name);
  if (wFights.length === 0) return null;
  return wFights.reduce((best, f) => {
    const score = (t: FightSummary) => {
      let s = 0;
      if (t.by === "Kill") s += 5;
      if (t.by === "KO") s += 3;
      if (t.flashyTags?.includes("Comeback")) s += 4;
      if (t.flashyTags?.includes("Flashy")) s += 2;
      return s;
    };
    return score(f) > score(best) ? f : best;
  }, wFights[0]);
}

/* ── Inductee Card ───────────────────────────────────────── */

export function InducteeCard({ warrior, title, icon, fights }: { warrior: Warrior; title: string; icon: React.ReactNode; fights: FightSummary[] }) {
  const best = bestFight(warrior, fights);
  const winRate = (warrior.career.wins + warrior.career.losses) > 0
    ? Math.round((warrior.career.wins / (warrior.career.wins + warrior.career.losses)) * 100)
    : 0;

  return (
    <Card className="border-accent/30 hover:glow-gold transition-shadow">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              {icon}
              <span className="font-display font-bold text-foreground">{warrior.name}</span>
            </div>
            <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
              {STYLE_DISPLAY_NAMES[warrior.style]} · Age {warrior.age ?? "?"}
            </div>
          </div>
          <Badge variant="outline" className="text-[9px] font-mono text-arena-gold border-arena-gold/30">
            {title}
          </Badge>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-lg font-display font-bold text-foreground">{warrior.career.wins}</div>
            <div className="text-[9px] text-muted-foreground uppercase">Wins</div>
          </div>
          <div>
            <div className="text-lg font-display font-bold text-foreground">{warrior.career.losses}</div>
            <div className="text-[9px] text-muted-foreground uppercase">Losses</div>
          </div>
          <div>
            <div className="text-lg font-display font-bold text-arena-blood">{warrior.career.kills}</div>
            <div className="text-[9px] text-muted-foreground uppercase">Kills</div>
          </div>
          <div>
            <div className="text-lg font-display font-bold text-arena-fame">{warrior.fame ?? 0}</div>
            <div className="text-[9px] text-muted-foreground uppercase">Fame</div>
          </div>
        </div>

        {/* Win rate bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Win Rate</span>
            <span className="font-mono text-foreground">{winRate}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${winRate}%` }} />
          </div>
        </div>

        {/* Titles */}
        {warrior.titles.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {warrior.titles.map((t, i) => (
              <Badge key={i} variant="secondary" className="text-[9px] gap-1">
                <Trophy className="h-2.5 w-2.5" /> {t}
              </Badge>
            ))}
          </div>
        )}

        {/* Greatest fight */}
        {best && (
          <div className="border-t border-border/30 pt-2">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Greatest Fight</div>
            <div className="flex items-center justify-between text-[11px]">
              <span className={`font-display ${best.winner === "A" && best.a === warrior.name || best.winner === "D" && best.d === warrior.name ? "text-foreground font-bold" : "text-muted-foreground"}`}>
                {best.a}
              </span>
              <div className="flex items-center gap-1">
                <Swords className="h-3 w-3 text-muted-foreground" />
                <Badge variant="outline" className="text-[8px]">{best.by}</Badge>
              </div>
              <span className={`font-display ${best.winner === "D" && best.d === warrior.name || best.winner === "A" && best.a === warrior.name ? "text-foreground font-bold" : "text-muted-foreground"}`}>
                {best.d}
              </span>
            </div>
            {best.flashyTags && best.flashyTags.length > 0 && (
              <div className="flex gap-1 mt-1 justify-center">
                {best.flashyTags.map(t => (
                  <Badge key={t} variant="outline" className="text-[8px] text-arena-gold border-arena-gold/30">{t}</Badge>
                ))}
              </div>
            )}
            <div className="text-[9px] text-muted-foreground text-center mt-1">Week {best.week}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
