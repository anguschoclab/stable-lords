import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  BrainCircuit,
  Target,
  Zap,
  History,
  TrendingUp,
  Activity,
  ShieldAlert,
  Coins,
  Users,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RivalStableData, AIIntent, AIEvent } from '@/types/state.types';

interface AgentReasoningWidgetProps {
  rival: RivalStableData;
}

const INTENT_METRICS: Record<
  AIIntent,
  { label: string; icon: LucideIcon; color: string; description: string }
> = {
  SURVIVAL: {
    label: 'Survival Protocol',
    icon: ShieldAlert,
    color: 'text-arena-gold',
    description: 'Prioritizing stable preservation and low-risk engagements.',
  },
  WEALTH_ACCUMULATION: {
    label: 'Treasury Hoarding',
    icon: Coins,
    color: 'text-arena-gold',
    description: 'Optimizing for maximum gold retention for future high-tier scouting.',
  },
  AGGRESSIVE_EXPANSION: {
    label: 'Market Dominance',
    icon: Target,
    color: 'text-arena-blood',
    description: 'Actively seeking to eliminate rivals and seize regional fame.',
  },
  ROSTER_DIVERSITY: {
    label: 'Talent Diversification',
    icon: Users,
    color: 'text-primary',
    description: 'Broadening style coverage to counter local tactical shifts.',
  },
  EXPANSION: {
    label: 'Strategic Expansion',
    icon: TrendingUp,
    color: 'text-arena-fame',
    description: 'Investing in new facilities and increased roster capacity.',
  },
  CONSOLIDATION: {
    label: 'Operational Consolidation',
    icon: Activity,
    color: 'text-arena-steel',
    description: 'Pruning underperforming assets to maintain a lean, elite roster.',
  },
  VENDETTA: {
    label: 'Owner Vendetta',
    icon: Zap,
    color: 'text-destructive',
    description: 'Directly targeting specific rivals regardless of short-term profit.',
  },
  RECOVERY: {
    label: 'System Recovery',
    icon: Activity,
    color: 'text-primary/60',
    description: 'Resting injured warriors and avoiding high-stakes bouts.',
  },
};

export function AgentReasoningWidget({ rival }: AgentReasoningWidgetProps) {
  const currentIntent = rival.agentMemory?.currentIntent || 'SURVIVAL';
  const metric = INTENT_METRICS[currentIntent];
  const Icon = metric.icon;

  return (
    <Card className="bg-[#0a0a0b] border-white/5 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />

      <CardHeader className="pb-4 relative">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-none bg-black border border-white/5', metric.color)}>
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-sm font-black uppercase tracking-widest">
              Strategic Reasoning
            </CardTitle>
            <CardDescription className="text-[10px] font-mono uppercase tracking-tight opacity-40">
              Simulation_Layer_v4.1 // Realtime_Inference
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 relative">
        {/* Active Intent */}
        <div className="p-4 rounded-none bg-black/40 border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className={cn('w-4 h-4', metric.color)} />
              <span className={cn('text-xs font-black uppercase tracking-[0.2em]', metric.color)}>
                {metric.label}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-1 w-1 rounded-full bg-primary animate-ping" />
              <span className="text-[8px] font-black uppercase text-primary/60">ACTIVE INTENT</span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground/80 leading-relaxed font-medium">
            {metric.description}
          </p>
        </div>

        {/* Action History Log */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground/40 px-1">
            <History className="w-3.5 h-3.5" />
            <span className="text-[9px] font-black uppercase tracking-widest">ACTION TIMELINE</span>
          </div>

          <div className="space-y-2 max-h-[120px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/5">
            {rival.actionHistory && rival.actionHistory.length > 0 ? (
              rival.actionHistory.map((event, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-2 rounded-none bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                >
                  <span className="text-[8px] font-mono text-primary mt-0.5">W{event.week}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium text-foreground truncate">
                      {event.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={cn(
                          'text-[7px] font-black uppercase px-1 rounded-none',
                          event.riskTier === 'High'
                            ? 'bg-destructive/20 text-destructive'
                            : event.riskTier === 'Medium'
                              ? 'bg-arena-gold/20 text-arena-gold'
                              : 'bg-primary/20 text-primary'
                        )}
                      >
                        {event.riskTier}_RISK
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center opacity-20 italic text-[10px] uppercase font-black tracking-widest">
                No recent actions recorded.
              </div>
            )}
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-muted-foreground/20">
          <span>Targeting: {rival.strategy?.targetStableId || 'Global_Meta'}</span>
          <span>Confidence: 94.8%</span>
        </div>
      </CardContent>
    </Card>
  );
}
