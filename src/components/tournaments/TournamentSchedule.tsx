/**
 * Tournament Schedule Component
 * Displays upcoming matches organized by round with filtering and sorting
 */
import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  Filter,
  Swords,
  Trophy,
  ChevronDown,
  ChevronUp,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGameStore } from '@/state/useGameStore';
import { resolveWarriorName } from '@/utils/historyResolver';
import type { TournamentBout, TournamentEntry } from '@/types/game';

interface TournamentScheduleProps {
  tournament: TournamentEntry;
  currentWeek: number;
}

type FilterStatus = 'all' | 'upcoming' | 'completed' | 'current-round';

/** Get round display name */
function getRoundName(round: number, totalRounds: number): string {
  const roundNames: Record<number, string> = {
    1: 'Round of 64',
    2: 'Round of 32',
    3: 'Round of 16',
    4: 'Quarter-finals',
    5: 'Semi-finals',
    6: 'Finals & Bronze',
    7: 'Championship',
  };

  if (round === totalRounds && round === 7) return 'Championship';
  if (round === totalRounds && round === 6) return 'Finals';

  return roundNames[round] || `Round ${round}`;
}

/** Check if bout is a bye */
function isByeMatch(bout: TournamentBout): boolean {
  return bout.d === '(bye)' || bout.warriorIdD === 'bye';
}

/** Check if bout is bronze match */
function isBronzeMatch(bout: TournamentBout): boolean {
  return bout.round === 6 && bout.matchIndex === 1;
}

/** Calculate estimated week for a bout based on round */
function getEstimatedWeek(baseWeek: number, round: number): number {
  // Assume each round takes 1 week
  return baseWeek + (round - 1);
}

export function TournamentSchedule({ tournament, currentWeek }: TournamentScheduleProps) {
  const state = useGameStore();
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set([1]));

  const totalRounds = useMemo(() => {
    const rounds = tournament.bracket.map((b) => b.round);
    return Math.max(...rounds, 1);
  }, [tournament.bracket]);

  const roundsMap = useMemo(() => {
    const map = new Map<number, TournamentBout[]>();
    tournament.bracket.forEach((bout) => {
      const existing = map.get(bout.round) || [];
      existing.push(bout);
      map.set(bout.round, existing);
    });
    return map;
  }, [tournament.bracket]);

  const stats = useMemo(() => {
    const total = tournament.bracket.length;
    const completed = tournament.bracket.filter((b) => b.winner !== undefined).length;
    const byes = tournament.bracket.filter(isByeMatch).length;
    const upcoming = total - completed;

    return { total, completed, byes, upcoming };
  }, [tournament.bracket]);

  const filteredRounds = useMemo(() => {
    const rounds = Array.from(roundsMap.entries()).sort((a, b) => a[0] - b[0]);

    if (filter === 'all') return rounds;

    return rounds.filter(([round, bouts]) => {
      const hasCompleted = bouts.some((b) => b.winner !== undefined);
      const hasPending = bouts.some((b) => b.winner === undefined);

      switch (filter) {
        case 'completed':
          return hasCompleted;
        case 'upcoming':
          return hasPending;
        case 'current-round':
          // Find first round with pending matches
          const firstPendingRound = Array.from(roundsMap.entries()).find(([_, bs]) =>
            bs.some((b) => b.winner === undefined)
          );
          return round === firstPendingRound?.[0];
        default:
          return true;
      }
    });
  }, [roundsMap, filter]);

  const toggleRound = (round: number) => {
    const newExpanded = new Set(expandedRounds);
    if (newExpanded.has(round)) {
      newExpanded.delete(round);
    } else {
      newExpanded.add(round);
    }
    setExpandedRounds(newExpanded);
  };

  const expandAll = () => {
    setExpandedRounds(new Set(roundsMap.keys()));
  };

  const collapseAll = () => {
    setExpandedRounds(new Set());
  };

  return (
    <div className="space-y-4">
      {/* Stats Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase font-bold">
              <Swords className="h-3.5 w-3.5" /> Total
            </div>
            <div className="text-xl font-black font-mono mt-1">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/5 to-transparent">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase font-bold">
              <Trophy className="h-3.5 w-3.5" /> Completed
            </div>
            <div className="text-xl font-black font-mono mt-1 text-emerald-600">
              {stats.completed}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/5 to-transparent">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase font-bold">
              <Clock className="h-3.5 w-3.5" /> Pending
            </div>
            <div className="text-xl font-black font-mono mt-1 text-amber-600">{stats.upcoming}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-stone-500/5 to-transparent">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase font-bold">
              <Users className="h-3.5 w-3.5" /> Byes
            </div>
            <div className="text-xl font-black font-mono mt-1 text-stone-600">{stats.byes}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 text-xs text-muted-foreground mr-2">
          <Filter className="h-3.5 w-3.5" />
          <span className="font-bold uppercase">Filter:</span>
        </div>
        {(['all', 'upcoming', 'completed', 'current-round'] as FilterStatus[]).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
            className="text-[10px] uppercase font-bold h-7"
          >
            {f === 'current-round' ? 'Current Round' : f}
          </Button>
        ))}
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={expandAll} className="text-[10px] uppercase h-7">
          Expand All
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={collapseAll}
          className="text-[10px] uppercase h-7"
        >
          Collapse
        </Button>
      </div>

      {/* Schedule by Round */}
      <div className="space-y-3">
        {filteredRounds.map(([round, bouts]) => {
          const isExpanded = expandedRounds.has(round);
          const estimatedWeek = getEstimatedWeek(tournament.week, round);
          const isPast = estimatedWeek < currentWeek;
          const isCurrent = estimatedWeek === currentWeek;
          const isFuture = estimatedWeek > currentWeek;

          const completedCount = bouts.filter((b) => b.winner !== undefined).length;
          const isComplete = completedCount === bouts.length;

          return (
            <Card
              key={round}
              className={cn(
                'overflow-hidden transition-all duration-300',
                isComplete && 'border-emerald-500/30',
                isCurrent && 'border-primary/50 shadow-[0_0_15px_-5px_hsl(var(--primary)/0.2)]'
              )}
            >
              <CardHeader
                className={cn(
                  'p-3 cursor-pointer hover:bg-secondary/20 transition-colors',
                  isComplete && 'bg-emerald-500/5',
                  isCurrent && 'bg-primary/5'
                )}
                onClick={() => toggleRound(round)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-black',
                        isComplete
                          ? 'bg-emerald-500/20 text-emerald-600'
                          : isCurrent
                            ? 'bg-primary/20 text-primary animate-pulse'
                            : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {isComplete ? '✓' : round}
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold uppercase tracking-wider">
                        {getRoundName(round, totalRounds)}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Week {estimatedWeek}</span>
                        {isPast && <span className="text-emerald-600">(Completed)</span>}
                        {isCurrent && <span className="text-primary font-bold">(Current)</span>}
                        {isFuture && <span>(Upcoming)</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {completedCount}/{bouts.length} matches
                    </Badge>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="p-0">
                  <div className="divide-y divide-border/30">
                    {bouts.map((bout, idx) => {
                      const isBye = isByeMatch(bout);
                      const isResolved = bout.winner !== undefined;
                      const bronze = isBronzeMatch(bout);

                      return (
                        <div
                          key={`${round}-${idx}`}
                          className={cn(
                            'p-3 flex items-center justify-between',
                            isResolved && 'bg-secondary/10',
                            bronze && 'bg-amber-500/5'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-xs text-muted-foreground font-mono w-8">
                              #{bout.matchIndex + 1}
                            </div>
                            <div className="space-y-1">
                              <div
                                className={cn(
                                  'flex items-center gap-2',
                                  bout.winner === 'A' && 'text-primary font-bold',
                                  bout.winner === 'D' && 'opacity-40'
                                )}
                              >
                                <div
                                  className={cn(
                                    'w-1.5 h-1.5 rounded-full',
                                    bout.winner === 'A' ? 'bg-primary' : 'bg-muted-foreground/30'
                                  )}
                                />
                                <span className="text-sm truncate max-w-[120px]">
                                  {resolveWarriorName(state, bout.warriorIdA, bout.a)}
                                </span>
                                {bout.winner === 'A' && (
                                  <Trophy className="h-3 w-3 text-arena-gold" />
                                )}
                              </div>

                              {!isBye ? (
                                <div
                                  className={cn(
                                    'flex items-center gap-2',
                                    bout.winner === 'D' && 'text-primary font-bold',
                                    bout.winner === 'A' && 'opacity-40'
                                  )}
                                >
                                  <div
                                    className={cn(
                                      'w-1.5 h-1.5 rounded-full',
                                      bout.winner === 'D' ? 'bg-primary' : 'bg-muted-foreground/30'
                                    )}
                                  />
                                  <span className="text-sm truncate max-w-[120px]">
                                    {resolveWarriorName(state, bout.warriorIdD, bout.d)}
                                  </span>
                                  {bout.winner === 'D' && (
                                    <Trophy className="h-3 w-3 text-arena-gold" />
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 opacity-50 italic">
                                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                                  <span className="text-sm">(bye)</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {bronze && (
                              <Badge
                                variant="outline"
                                className="text-[9px] border-amber-500/30 text-amber-600"
                              >
                                Bronze
                              </Badge>
                            )}
                            {isBye ? (
                              <Badge variant="outline" className="text-[9px] text-muted-foreground">
                                Auto-win
                              </Badge>
                            ) : isResolved ? (
                              <Badge className="text-[9px] bg-emerald-500/20 text-emerald-600 border-none">
                                {bout.by || 'Win'}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[9px] text-muted-foreground">
                                Pending
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
