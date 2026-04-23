import React, { useMemo } from 'react';
import { History, Swords, Trophy, Skull, Star, Armchair } from 'lucide-react';
import { type Warrior, type FightSummary } from '@/types/game';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getAllFightsForWarrior } from '@/engine/core/historyUtils';

export function CareerTimeline({
  warrior,
  arenaHistory,
}: {
  warrior: Warrior;
  arenaHistory: FightSummary[];
}) {
  const milestones = useMemo(() => {
    const events: { week: number; label: string; icon: React.ReactNode; color: string }[] = [];
    const fights = getAllFightsForWarrior(arenaHistory, warrior.name);
    const sorted = [...fights].sort((a, b) => a.week - b.week);

    if (sorted.length > 0) {
      events.push({
        week: sorted[0].week,
        label: 'First Bout',
        icon: <Swords className="h-3.5 w-3.5" />,
        color: 'bg-primary',
      });
    }

    const firstWin = sorted.find((f) => {
      const isA = f.a === warrior.name;
      return (isA && f.winner === 'A') || (!isA && f.winner === 'D');
    });
    if (firstWin) {
      events.push({
        week: firstWin.week,
        label: 'First Victory',
        icon: <Trophy className="h-3.5 w-3.5" />,
        color: 'bg-arena-gold',
      });
    }

    const firstKill = sorted.find((f) => {
      const isA = f.a === warrior.name;
      return ((isA && f.winner === 'A') || (!isA && f.winner === 'D')) && f.by === 'Kill';
    });
    if (firstKill) {
      events.push({
        week: firstKill.week,
        label: 'First Kill',
        icon: <Skull className="h-3.5 w-3.5" />,
        color: 'bg-destructive',
      });
    }

    if (warrior.champion) {
      const champFight = sorted.find(
        (f) =>
          f.tournamentId &&
          ((f.a === warrior.name && f.winner === 'A') || (f.d === warrior.name && f.winner === 'D'))
      );
      events.push({
        week: champFight?.week ?? warrior.career.wins,
        label: 'Champion',
        icon: <Star className="h-3.5 w-3.5" />,
        color: 'bg-arena-fame',
      });
    }

    if (warrior.status === 'Retired' && warrior.retiredWeek) {
      events.push({
        week: warrior.retiredWeek,
        label: 'Retired',
        icon: <Armchair className="h-3.5 w-3.5" />,
        color: 'bg-muted-foreground',
      });
    }

    if (warrior.status === 'Dead' && warrior.deathWeek) {
      events.push({
        week: warrior.deathWeek,
        label: warrior.deathCause ?? 'Fallen',
        icon: <Skull className="h-3.5 w-3.5" />,
        color: 'bg-destructive',
      });
    }

    const seen = new Set<string>();
    return events
      .filter((e) => {
        if (seen.has(e.label)) return false;
        seen.add(e.label);
        return true;
      })
      .sort((a, b) => a.week - b.week);
  }, [warrior, arenaHistory]);

  if (milestones.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <History className="h-5 w-5 text-primary" /> Career Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute left-[15px] top-3 bottom-3 w-px bg-border" />
          <div className="space-y-4">
            {milestones.map((m, i) => (
              <div key={i} className="flex items-start gap-3 relative">
                <div
                  className={`relative z-10 flex items-center justify-center h-8 w-8 rounded-full ${m.color} text-primary-foreground shrink-0 shadow-sm`}
                >
                  {m.icon}
                </div>
                <div className="pt-1">
                  <div className="text-sm font-semibold">{m.label}</div>
                  <div className="text-xs text-muted-foreground font-mono">Week {m.week}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
