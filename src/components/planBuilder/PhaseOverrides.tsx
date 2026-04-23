import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Timer } from 'lucide-react';
import type { FightPlan } from '@/types/game';

interface PhaseOverridesProps {
  plan: FightPlan;
  onPlanChange: (plan: FightPlan) => void;
}

export default function PhaseOverrides({ plan, onPlanChange }: PhaseOverridesProps) {
  const [phaseMode, setPhaseMode] = useState(!!plan.phases);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest">Phase Overrides</span>
        </div>
        <Switch checked={phaseMode} onCheckedChange={setPhaseMode} />
      </div>

      {phaseMode && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['opening', 'mid', 'late'] as const).map((p) => (
            <div key={p} className="p-4 border border-white/5 bg-black/40 min-h-[120px] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {p}
                </span>
                {plan.phases?.[p] && (
                  <button
                    onClick={() => {
                      if (!plan.phases) return;
                      const { [p]: _, ...rest } = plan.phases;
                      onPlanChange({
                        ...plan,
                        phases: Object.keys(rest).length ? rest : undefined,
                      });
                    }}
                    className="text-[9px] font-black uppercase text-arena-blood hover:underline"
                    aria-label={`Clear phase ${p}`}
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1">
                {plan.phases?.[p]?.offensiveTactic && (
                  <Badge className="bg-arena-blood/20 text-arena-blood border border-arena-blood/30 text-[9px] uppercase font-black px-1.5 py-0.5">
                    {plan.phases[p]?.offensiveTactic}
                  </Badge>
                )}
                {plan.phases?.[p]?.defensiveTactic && (
                  <Badge className="bg-arena-gold/20 text-arena-gold border border-arena-gold/30 text-[9px] uppercase font-black px-1.5 py-0.5">
                    {plan.phases[p]?.defensiveTactic}
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[9px] uppercase font-bold text-muted-foreground/60">
                  <span>OE</span>
                  <span>{plan.phases?.[p]?.OE ?? plan.OE}</span>
                </div>
                <Slider
                  value={[plan.phases?.[p]?.OE ?? plan.OE]}
                  onValueChange={([v]) => {
                    const next = { ...(plan.phases || {}) };
                    next[p] = {
                      ...(next[p] || {
                        OE: plan.OE,
                        AL: plan.AL ?? 5,
                        killDesire: plan.killDesire ?? 5,
                      }),
                      OE: v ?? plan.OE,
                    };
                    onPlanChange({ ...plan, phases: next });
                  }}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
