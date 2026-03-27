import React, { useMemo } from 'react';
import { useGameStore } from '@/state/useGameStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Heart } from 'lucide-react';
import { CrowdMood, getMoodModifiers, MOOD_ICONS, MOOD_DESCRIPTIONS } from '@/engine/crowdMood';

// Radial gauge: map mood to an angle (0-180 arc)
const MOOD_ANGLE: Record<CrowdMood, number> = {
  Solemn: 20,
  Calm: 55,
  Theatrical: 90,
  Festive: 130,
  Bloodthirsty: 165,
};

export function CrowdMoodWidget() {
  const { state } = useGameStore();
  const mood = state.crowdMood as CrowdMood;
  const moodHistory = state.moodHistory || [];
  const mods = useMemo(() => getMoodModifiers(mood), [mood]);
  const icon = MOOD_ICONS[mood] ?? "😐";
  const desc = MOOD_DESCRIPTIONS[mood] ?? "";

  const angle = MOOD_ANGLE[mood] ?? 90;

  // Format modifier as percentage label
  const fmtMod = (v: number) => {
    const pct = Math.round((v - 1) * 100);
    if (pct === 0) return "—";
    return `${pct > 0 ? "+" : ""}${pct}%`;
  };
  const fmtKill = (v: number) => {
    const pct = Math.round(v * 100);
    if (pct === 0) return "—";
    return `${pct > 0 ? "+" : ""}${pct}%`;
  };

  const modColor = (v: number) =>
    v > 1 ? "text-arena-pop" : v < 1 ? "text-destructive" : "text-muted-foreground";
  const killColor = (v: number) =>
    v > 0 ? "text-destructive" : v < 0 ? "text-arena-pop" : "text-muted-foreground";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <Heart className="h-4 w-4 text-destructive" /> Crowd Mood
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Radial gauge */}
        <div className="flex justify-center">
          <div className="relative w-40 h-24">
            {/* Arc background */}
            <svg viewBox="0 0 160 90" className="w-full h-full">
              {/* Track */}
              <path
                d="M 15 80 A 65 65 0 0 1 145 80"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="10"
                strokeLinecap="round"
              />
              {/* Gradient colored arc segments */}
              <defs>
                <linearGradient id="moodGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="40%" stopColor="hsl(var(--accent))" />
                  <stop offset="70%" stopColor="hsl(var(--arena-gold, 45 93% 47%))" />
                  <stop offset="100%" stopColor="hsl(var(--destructive))" />
                </linearGradient>
              </defs>
              <path
                d="M 15 80 A 65 65 0 0 1 145 80"
                fill="none"
                stroke="url(#moodGrad)"
                strokeWidth="10"
                strokeLinecap="round"
                opacity="0.3"
              />
              {/* Needle */}
              <line
                x1="80"
                y1="80"
                x2={80 + 50 * Math.cos(Math.PI - (angle * Math.PI) / 180)}
                y2={80 - 50 * Math.sin(Math.PI - (angle * Math.PI) / 180)}
                stroke="hsl(var(--foreground))"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="transition-all duration-700"
              />
              {/* Center dot */}
              <circle cx="80" cy="80" r="4" fill="hsl(var(--foreground))" />
            </svg>
            {/* Labels at ends */}
            <span className="absolute bottom-0 left-0 text-[9px] text-muted-foreground">🕯️</span>
            <span className="absolute bottom-0 right-0 text-[9px] text-muted-foreground">🩸</span>
          </div>
        </div>

        {/* Current mood */}
        <div className="text-center">
          <div className="text-2xl">{icon}</div>
          <div className="font-display font-bold text-sm">{mood}</div>
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{desc}</p>
        </div>

        {/* Modifier breakdown */}
        <div className="grid grid-cols-3 gap-1.5 text-center">
          <div className="rounded-md bg-secondary/60 p-1.5 border border-border/50">
            <div className={`text-sm font-mono font-bold ${modColor(mods.fameMultiplier)}`}>
              {fmtMod(mods.fameMultiplier)}
            </div>
            <div className="text-[9px] text-muted-foreground uppercase">Fame</div>
          </div>
          <div className="rounded-md bg-secondary/60 p-1.5 border border-border/50">
            <div className={`text-sm font-mono font-bold ${modColor(mods.popMultiplier)}`}>
              {fmtMod(mods.popMultiplier)}
            </div>
            <div className="text-[9px] text-muted-foreground uppercase">Pop</div>
          </div>
          <div className="rounded-md bg-secondary/60 p-1.5 border border-border/50">
            <div className={`text-sm font-mono font-bold ${killColor(mods.killChanceBonus)}`}>
              {fmtKill(mods.killChanceBonus)}
            </div>
            <div className="text-[9px] text-muted-foreground uppercase">Kill %</div>
          </div>
        </div>

        {/* Mood History Sparkline */}
        {moodHistory.length >= 2 && (() => {
          const MOOD_Y: Record<string, number> = { Solemn: 4, Calm: 3, Theatrical: 2, Festive: 1, Bloodthirsty: 0 };
          const MOOD_COLOR: Record<string, string> = {
            Solemn: "hsl(var(--primary))",
            Calm: "hsl(var(--muted-foreground))",
            Theatrical: "hsl(var(--accent-foreground))",
            Festive: "hsl(var(--arena-pop, 142 71% 45%))",
            Bloodthirsty: "hsl(var(--destructive))",
          };
          const last10 = moodHistory.slice(-10);
          const w = 200, h = 40, px = 8, py = 4;
          const stepX = (w - px * 2) / Math.max(last10.length - 1, 1);
          const stepY = (h - py * 2) / 4;
          const pts = last10.map((entry, i) => ({
            x: px + i * stepX,
            y: py + (MOOD_Y[entry.mood] ?? 2) * stepY,
            mood: entry.mood as CrowdMood,
            week: entry.week,
          }));
          const polyline = pts.map(p => `${p.x},${p.y}`).join(" ");

          return (
            <div className="mt-1">
              <div className="text-[9px] text-muted-foreground uppercase mb-1">Mood History</div>
              <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10">
                {/* Grid lines */}
                {[0,1,2,3,4].map(i => (
                  <line key={i} x1={px} x2={w-px} y1={py + i*stepY} y2={py + i*stepY}
                    stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.4" />
                ))}
                {/* Line */}
                <polyline points={polyline} fill="none" stroke="hsl(var(--foreground))" strokeWidth="1.5"
                  strokeLinejoin="round" strokeLinecap="round" opacity="0.6" />
                {/* Dots */}
                {pts.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r="3"
                    fill={MOOD_COLOR[p.mood] ?? "hsl(var(--foreground))"}
                    stroke="hsl(var(--background))" strokeWidth="1">
                    <title>Week {p.week}: {p.mood}</title>
                  </circle>
                ))}
              </svg>
              {/* Y-axis labels */}
              <div className="flex justify-between text-[8px] text-muted-foreground -mt-0.5 px-1">
                <span>🩸</span><span>🎉</span><span>🎭</span><span>😐</span><span>🕯️</span>
              </div>
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
}
