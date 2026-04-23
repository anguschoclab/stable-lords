import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { FightPlan } from '@/types/game';

interface CommonControlsProps {
  plan: FightPlan;
  onPlanChange: (plan: FightPlan) => void;
}

export default function CommonControls({ plan, onPlanChange }: CommonControlsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-6 border border-white/5">
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-black uppercase tracking-widest text-arena-gold">
              Offensive Effort
            </Label>
            <span className="text-sm font-mono font-bold text-arena-gold">{plan.OE}</span>
          </div>
          <Slider
            value={[plan.OE]}
            onValueChange={([v]) => onPlanChange({ ...plan, OE: v ?? 5 })}
            min={1}
            max={10}
            step={1}
          />
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-black uppercase tracking-widest text-arena-fame">
              Activity Level
            </Label>
            <span className="text-sm font-mono font-bold text-arena-fame">{plan.AL ?? 5}</span>
          </div>
          <Slider
            value={[plan.AL ?? 5]}
            onValueChange={([v]) => onPlanChange({ ...plan, AL: v ?? 5 })}
            min={1}
            max={10}
            step={1}
          />
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-black uppercase tracking-widest text-destructive">
              Kill Desire
            </Label>
            <span className="text-sm font-mono font-bold text-destructive">
              {plan.killDesire ?? 5}
            </span>
          </div>
          <Slider
            value={[plan.killDesire ?? 5]}
            onValueChange={([v]) => onPlanChange({ ...plan, killDesire: v })}
            min={1}
            max={10}
            step={1}
          />
        </div>
        <div className="min-h-[60px] border-2 border-dashed flex items-center justify-center p-4 bg-black/20 border-white/10">
          <div className="flex gap-2">
            {plan.offensiveTactic && plan.offensiveTactic !== 'none' && (
              <Badge className="bg-arena-blood text-white rounded-none uppercase font-black tracking-widest px-3 py-1">
                {plan.offensiveTactic}
              </Badge>
            )}
            {plan.defensiveTactic && plan.defensiveTactic !== 'none' && (
              <Badge className="bg-arena-gold text-black rounded-none uppercase font-black tracking-widest px-3 py-1">
                {plan.defensiveTactic}
              </Badge>
            )}
            {!plan.offensiveTactic && !plan.defensiveTactic && (
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">
                Select tactics from the bank
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
