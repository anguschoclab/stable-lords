import { useMemo } from 'react';
import { useWorldState } from '@/state/useGameStore';
import { type Warrior, STYLE_DISPLAY_NAMES } from '@/types/game';
import {
  getRecommendedChallenges,
  getMatchupsToAvoid,
  type MatchupScore,
} from '@/engine/schedulingAssistant';
import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { Link } from '@tanstack/react-router';
import {
  Target,
  AlertTriangle,
  Swords,
  Trophy,
  ExternalLink,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatchupCardProps {
  matchup: MatchupScore;
  type: 'recommend' | 'avoid';
}

function MatchupCard({ matchup, type }: MatchupCardProps) {
  const w = matchup.rivalWarrior;
  const isGood = type === 'recommend';

  return (
    <Surface
      variant="glass"
      className={cn(
        'p-4 border-white/5 transition-all group hover:bg-white/[0.02]',
        isGood ? 'hover:border-primary/20' : 'hover:border-destructive/20'
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <ImperialRing size="xs" variant={isGood ? 'bronze' : 'blood'}>
            {isGood ? (
              <TrendingUp className="h-3 w-3 text-primary" />
            ) : (
              <TrendingDown className="h-3 w-3 text-destructive" />
            )}
          </ImperialRing>
          <span className="font-display font-black text-[11px] uppercase tracking-tight text-foreground">
            {w.name}
          </span>
        </div>
        <Link to="/warrior/$id" params={{ id: w.id }}>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Badge
          variant="outline"
          className="text-[8px] font-black uppercase tracking-widest px-2 py-0 rounded-none border-white/5 bg-white/5"
        >
          {STYLE_DISPLAY_NAMES[w.style]}
        </Badge>
        <Badge
          variant="outline"
          className="text-[8px] font-black uppercase tracking-widest px-2 py-0 rounded-none border-white/5 bg-white/5"
        >
          {matchup.rivalStableName}
        </Badge>
      </div>

      <div className="space-y-2 mb-4">
        {matchup.notes.map((note, i) => (
          <div
            key={i}
            className="text-[9px] text-muted-foreground/60 flex items-center gap-2 italic uppercase font-black tracking-tight"
          >
            <div className={cn('h-1 w-1', isGood ? 'bg-primary' : 'bg-destructive')} />
            {note}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="text-[8px] uppercase font-black text-muted-foreground/40 tracking-[0.2em]">
          Priority_Index
        </div>
        <div
          className={cn(
            'text-xs font-display font-black',
            isGood ? 'text-primary' : 'text-destructive'
          )}
        >
          {Math.round(matchup.score)}
        </div>
      </div>
    </Surface>
  );
}

interface SchedulingWidgetProps {
  warrior: Warrior;
}

export function SchedulingWidget({ warrior }: SchedulingWidgetProps) {
  const state = useWorldState();

  const recommendations = useMemo(
    () => getRecommendedChallenges(state, warrior, 2),
    [state, warrior]
  );

  const toAvoid = useMemo(() => getMatchupsToAvoid(state, warrior, 2), [state, warrior]);

  return (
    <div className="space-y-12">
      <div className="grid gap-12 md:grid-cols-2">
        {/* Recommendations */}
        <div className="space-y-6">
          <SectionDivider label="Strategic Opportunities" />
          <div className="space-y-4">
            {recommendations.length > 0 ? (
              recommendations.map((m, i) => <MatchupCard key={i} matchup={m} type="recommend" />)
            ) : (
              <p className="text-[10px] text-muted-foreground/20 italic p-12 border border-dashed border-white/5 text-center uppercase font-black tracking-widest">
                No prime targets available.
              </p>
            )}
          </div>
        </div>

        {/* To Avoid */}
        <div className="space-y-6">
          <SectionDivider label="High Risk Vectors" variant="blood" />
          <div className="space-y-4">
            {toAvoid.length > 0 ? (
              toAvoid.map((m, i) => <MatchupCard key={i} matchup={m} type="avoid" />)
            ) : (
              <p className="text-[10px] text-muted-foreground/20 italic p-12 border border-dashed border-white/5 text-center uppercase font-black tracking-widest">
                No imminent threats detected.
              </p>
            )}
          </div>
        </div>
      </div>

      <Surface variant="glass" className="p-8 border-white/5 bg-white/[0.01]">
        <div className="flex items-start gap-4">
          <ImperialRing size="sm" variant="bronze">
            <Swords className="h-4 w-4 text-muted-foreground/40" />
          </ImperialRing>
          <div className="text-[11px] text-muted-foreground/60 leading-relaxed uppercase font-black tracking-tight">
            <span className="text-foreground">Tactical Intelligence Note:</span> Engagement matrices
            are calculated based on style affinity, historical performance, and institutional fame
            differential. Grudge matches against rivals escalate priority levels.
          </div>
        </div>
      </Surface>
    </div>
  );
}
