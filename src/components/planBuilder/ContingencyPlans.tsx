import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { GitBranch } from 'lucide-react';
import type { FightPlan, PlanCondition } from '@/types/game';
import ConditionEditor from '@/components/warrior/ConditionEditor';

interface ContingencyPlansProps {
  plan: FightPlan;
  onPlanChange: (plan: FightPlan) => void;
}

export default function ContingencyPlans({ plan, onPlanChange }: ContingencyPlansProps) {
  const [showConditions, setShowConditions] = useState(!!plan.conditions?.length);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-arena-pop" />
          <span className="text-[10px] font-black uppercase tracking-widest text-arena-pop">
            Contingency Plans
          </span>
          {(plan.conditions?.length ?? 0) > 0 && (
            <Badge className="rounded-none border-none bg-arena-pop/20 text-arena-pop text-[9px] font-black px-1.5 py-0.5">
              {plan.conditions?.length}
            </Badge>
          )}
        </div>
        <Switch checked={showConditions} onCheckedChange={setShowConditions} />
      </div>

      {showConditions && (
        <div className="bg-black/40 border border-white/5 p-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 italic mb-4">
            Override strategy mid-fight when conditions are met. First match wins. WT stat governs
            how quickly they activate.
          </p>
          <ConditionEditor
            conditions={plan.conditions ?? []}
            onChange={(conds: PlanCondition[]) =>
              onPlanChange({ ...plan, conditions: conds.length > 0 ? conds : undefined })
            }
          />
        </div>
      )}
    </div>
  );
}
