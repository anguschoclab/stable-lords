/**
 * StaminaCurve — tiny SVG sparkline visualising estimated endurance over a
 * 20-minute bout for the current plan. Deterministic preview, not a full sim.
 */
import { useMemo } from 'react';
import type { FightPlan } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import { estimateStaminaCurve } from '@/engine/strategyValidator';

interface Props {
  plan: FightPlan;
  warrior?: Warrior;
  width?: number;
  height?: number;
}

export default function StaminaCurve({ plan, warrior, width = 240, height = 56 }: Props) {
  const { path, lastPct } = useMemo(() => {
    const series = estimateStaminaCurve(plan, warrior);
    const max = series[0] || 1;
    const step = width / (series.length - 1);
    const pts = series.map((v, i) => {
      const x = i * step;
      const y = height - (v / max) * (height - 4) - 2;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const last = series[series.length - 1] ?? 0;
    return { path: pts.join(' '), lastPct: Math.round((last / max) * 100) };
  }, [plan, warrior, width, height]);

  const stroke = lastPct >= 40 ? '#4ade80' : lastPct >= 20 ? '#facc15' : '#ef4444';

  return (
    <div className="flex items-center gap-3">
      <div className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
        Stamina Curve
      </div>
      <svg width={width} height={height} className="border border-white/5 bg-black/40">
        <path d={path} fill="none" stroke={stroke} strokeWidth={1.5} />
      </svg>
      <div className="text-[10px] font-mono font-black" style={{ color: stroke }}>
        {lastPct}%
      </div>
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground/40">
        @minute 20
      </div>
    </div>
  );
}
