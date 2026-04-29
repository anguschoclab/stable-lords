import { Zap, Swords, Shield, Target, Activity, Flame, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FightPlan, OffensiveTactic, DefensiveTactic } from '@/types/game';

export const TACTIC_BANK = [
  { id: 'Lunge', type: 'offensive', label: 'Lunge', icon: Zap },
  { id: 'Slash', type: 'offensive', label: 'Slash', icon: Swords },
  { id: 'Bash', type: 'offensive', label: 'Bash', icon: Shield },
  { id: 'Decisiveness', type: 'offensive', label: 'DEC', icon: Target },
  { id: 'Dodge', type: 'defensive', label: 'Dodge', icon: Activity },
  { id: 'Parry', type: 'defensive', label: 'Parry', icon: Shield },
  { id: 'Riposte', type: 'defensive', label: 'Riposte', icon: Flame },
  { id: 'Responsiveness', type: 'defensive', label: 'RESP', icon: Clock },
];

interface TacticBankProps {
  plan?: FightPlan;
  onPlanChange?: (plan: FightPlan) => void;
}

export default function TacticBank({ plan, onPlanChange }: TacticBankProps = {}) {
  const handleClick = (t: (typeof TACTIC_BANK)[number]) => {
    if (!plan || !onPlanChange) return;
    if (t.type === 'offensive') {
      onPlanChange({ ...plan, offensiveTactic: t.id as OffensiveTactic });
    } else {
      onPlanChange({ ...plan, defensiveTactic: t.id as DefensiveTactic });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-arena-gold mb-2">
        <span className="text-[10px] font-black uppercase tracking-widest">Tactic Bank</span>
      </div>
      <div className="flex flex-col gap-2 p-2 bg-black/40 border border-white/5 rounded-none">
        {TACTIC_BANK.map((t) => (
          <button
            key={t.id}
            onClick={() => handleClick(t)}
            className={cn(
              'flex items-center gap-3 p-3 text-xs font-bold uppercase tracking-wider border transition-all text-left',
              plan &&
                ((t.type === 'offensive' && plan.offensiveTactic === t.id) ||
                  (t.type === 'defensive' && plan.defensiveTactic === t.id))
                ? 'bg-arena-blood/20 border-arena-blood/60 text-foreground'
                : 'bg-white/5 border-white/10 text-muted-foreground hover:border-arena-gold/40 hover:text-foreground'
            )}
            aria-label={'Select tactic ' + t.label}
          >
            <t.icon className="w-4 h-4 shrink-0" />
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
