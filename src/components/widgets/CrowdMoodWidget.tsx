import { useMemo } from 'react';
import { useWorldState } from '@/state/useGameStore';
import { Surface } from '@/components/ui/Surface';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { Heart } from 'lucide-react';
import { CrowdMood, getMoodModifiers, MOOD_ICONS, MOOD_DESCRIPTIONS } from '@/engine/crowdMood';
import { cn } from '@/lib/utils';

// Radial gauge: map mood to an angle (0-180 arc)
const MOOD_ANGLE: Record<CrowdMood, number> = {
  Solemn: 20,
  Calm: 55,
  Theatrical: 90,
  Festive: 130,
  Bloodthirsty: 165,
};

export function CrowdMoodWidget() {
  const state = useWorldState();
  const mood = state.crowdMood as CrowdMood;
  const moodHistory = state.moodHistory || [];
  const mods = useMemo(() => getMoodModifiers(mood), [mood]);
  const icon = MOOD_ICONS[mood] ?? '😐';
  const desc = MOOD_DESCRIPTIONS[mood] ?? '';

  const angle = MOOD_ANGLE[mood] ?? 90;

  // Format modifier as percentage label
  const fmtMod = (v: number) => {
    const pct = Math.round((v - 1) * 100);
    if (pct === 0) return '—';
    return `${pct > 0 ? '+' : ''}${pct}%`;
  };
  const fmtKill = (v: number) => {
    const pct = Math.round(v * 100);
    if (pct === 0) return '—';
    return `${pct > 0 ? '+' : ''}${pct}%`;
  };

  const modColor = (v: number) =>
    v > 1 ? 'text-arena-pop' : v < 1 ? 'text-destructive' : 'text-muted-foreground/40';
  const killColor = (v: number) =>
    v > 0 ? 'text-primary' : v < 0 ? 'text-arena-pop' : 'text-muted-foreground/40';

  return (
    <Surface variant="glass" className="h-full border-white/5 bg-white/[0.01]">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ImperialRing size="xs" variant="blood">
            <Heart className="h-3.5 w-3.5 text-primary" />
          </ImperialRing>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">
            Crowd Resonance
          </span>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Radial gauge */}
        <div className="flex justify-center">
          <div className="relative w-48 h-28">
            <svg viewBox="0 0 160 90" className="w-full h-full">
              <path
                d="M 15 80 A 65 65 0 0 1 145 80"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="moodGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="50%" stopColor="hsl(var(--arena-gold))" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" />
                </linearGradient>
              </defs>
              <path
                d="M 15 80 A 65 65 0 0 1 145 80"
                fill="none"
                stroke="url(#moodGrad)"
                strokeWidth="8"
                strokeLinecap="round"
                opacity="0.1"
              />
              <line
                x1="80"
                y1="80"
                x2={80 + 55 * Math.cos(Math.PI - (angle * Math.PI) / 180)}
                y2={80 - 55 * Math.sin(Math.PI - (angle * Math.PI) / 180)}
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
              />
              <circle cx="80" cy="80" r="3" fill="hsl(var(--primary))" />
            </svg>
            <span className="absolute bottom-2 left-2 text-[10px] opacity-20 grayscale">🕯️</span>
            <span className="absolute bottom-2 right-2 text-[10px] opacity-20 grayscale">🩸</span>
          </div>
        </div>

        <div className="text-center space-y-2">
          <div className="text-2xl animate-pulse">{icon}</div>
          <div className="text-[12px] font-display font-black uppercase tracking-widest text-foreground">
            {mood}
          </div>
          <p className="text-[10px] font-black uppercase tracking-tight text-muted-foreground/40 max-w-[200px] mx-auto leading-relaxed">
            {desc}
          </p>
        </div>

        {/* Modifier grid */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: 'Fame',
              value: fmtMod(mods.fameMultiplier),
              color: modColor(mods.fameMultiplier),
            },
            {
              label: 'Pop',
              value: fmtMod(mods.popMultiplier),
              color: modColor(mods.popMultiplier),
            },
            {
              label: 'Lethality',
              value: fmtKill(mods.killChanceBonus),
              color: killColor(mods.killChanceBonus),
            },
          ].map((m) => (
            <div key={m.label} className="text-center p-3 bg-white/[0.02] border border-white/5">
              <div className={cn('text-xs font-display font-black mb-1', m.color)}>{m.value}</div>
              <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30">
                {m.label}
              </div>
            </div>
          ))}
        </div>

        {/* Mood History */}
        {moodHistory.length >= 2 && (
          <div className="pt-6 border-t border-white/5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/20">
                Temporal Shift
              </span>
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/20">
                Last 10 Cycles
              </span>
            </div>
            {(() => {
              const MOOD_Y: Record<string, number> = {
                Solemn: 4,
                Calm: 3,
                Theatrical: 2,
                Festive: 1,
                Bloodthirsty: 0,
              };
              const last10 = moodHistory.slice(-10);
              const w = 240,
                h = 32,
                px = 8,
                py = 4;
              const stepX = (w - px * 2) / Math.max(last10.length - 1, 1);
              const stepY = (h - py * 2) / 4;
              const pts = last10.map((entry, i) => ({
                x: px + i * stepX,
                y: py + (MOOD_Y[entry.mood] ?? 2) * stepY,
                mood: entry.mood as CrowdMood,
              }));
              const polyline = pts.map((p) => `${p.x},${p.y}`).join(' ');

              return (
                <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8 overflow-visible">
                  <polyline
                    points={polyline}
                    fill="none"
                    stroke="rgba(var(--primary-rgb), 0.2)"
                    strokeWidth="1"
                    strokeLinejoin="round"
                  />
                  {pts.map((p, i) => (
                    <circle
                      key={i}
                      cx={p.x}
                      cy={p.y}
                      r="1.5"
                      fill={p.mood === mood ? 'hsl(var(--primary))' : 'rgba(255,255,255,0.1)'}
                    />
                  ))}
                </svg>
              );
            })()}
          </div>
        )}
      </div>
    </Surface>
  );
}
