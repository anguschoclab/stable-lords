import { useMemo } from 'react';
import { useGameStore } from '@/state/useGameStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Swords, Trophy, Target, TrendingUp, ChevronRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { WarriorLink } from '@/components/EntityLink';
import { cn } from '@/lib/utils';
import { ATTRIBUTE_KEYS } from '@/types/game';
import { resolveWarriorName, resolveStableName } from '@/utils/historyResolver';

export function NextBoutWidget() {
  const state = useGameStore();

  const nextBout = useMemo(() => {
    // Check tournaments first
    const activeTourney = state.tournaments.find((t) => !t.completed);
    if (activeTourney) {
      const pendingMatch = activeTourney.bracket.find((m) => !m.winner);
      if (pendingMatch) {
        return {
          type: 'Tournament',
          name: activeTourney.name,
          a: pendingMatch.a,
          d: pendingMatch.d,
          warriorIdA: pendingMatch.warriorIdA,
          warriorIdD: pendingMatch.warriorIdD,
          stableA: pendingMatch.stableA,
          stableD: pendingMatch.stableD,
          stableIdA: pendingMatch.stableIdA,
          stableIdD: pendingMatch.stableIdD,
        };
      }
    }

    // Check regular bouts? (If any)
    // For simplicity, let's just use the current roster of the primary rival
    const primaryRival = state.rivals[0];
    if (primaryRival && state.roster.length > 0) {
      return {
        type: 'Standard Matchup',
        name: 'Upcoming Scrimmage',
        a: state.roster[0].name,
        d: primaryRival.roster[0].name,
        warriorIdA: state.roster[0].id,
        warriorIdD: primaryRival.roster[0].id,
        stableA: state.player.stableName,
        stableD: primaryRival.owner.stableName,
        stableIdA: state.player.id,
        stableIdD: primaryRival.id,
      };
    }

    return null;
  }, [state.tournaments, state.roster, state.rivals, state.player.id, state.player.stableName]);

  const odds = useMemo(() => {
    if (!nextBout) return 50;
    // Use IDs for lookup
    const warriorA = state.roster.find((w) => w.id === nextBout.warriorIdA);
    const rivalStable = state.rivals.find((r) => r.id === nextBout.stableIdD);
    const warriorD =
      rivalStable?.roster.find((w) => w.id === nextBout.warriorIdD) ||
      state.roster.find((w) => w.id === nextBout.warriorIdD);

    if (!warriorA || !warriorD) return 50;

    const sumA = ATTRIBUTE_KEYS.reduce((s, k) => s + warriorA.attributes[k], 0);
    const sumD = ATTRIBUTE_KEYS.reduce((s, k) => s + warriorD.attributes[k], 0);

    return Math.round((sumA / (sumA + sumD)) * 100);
  }, [nextBout, state.roster, state.rivals]);

  return (
    <Card className="h-full border-l-4 border-l-primary/50 shadow-md">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-display font-black flex items-center gap-2 uppercase tracking-tighter">
          <Target className="h-4 w-4 text-primary" /> Match Preview
        </CardTitle>
        <Link to="/command/combat">
          <ChevronRight className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />
        </Link>
      </CardHeader>
      <CardContent>
        {!nextBout ? (
          <div className="flex flex-col items-center justify-center py-8 opacity-40">
            <Swords className="h-8 w-8 mb-2" />
            <p className="text-[10px] font-bold uppercase tracking-widest">No Bouts Scheduled</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-secondary/20 rounded-none border border-border/50">
              <div className="flex justify-between items-center mb-2">
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono px-1.5 py-0 h-5 bg-background shadow-sm ring-1 ring-primary/20"
                >
                  {nextBout.type}
                </Badge>
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                  EST ODDS:
                  <span
                    className={cn(
                      'font-bold',
                      odds > 60 ? 'text-primary' : odds < 40 ? 'text-destructive' : 'text-arena-gold'
                    )}
                  >
                    {odds}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 py-1">
                <div className="flex-1 text-center">
                  <p className="text-[11px] font-black truncate">
                    {resolveWarriorName(state, nextBout.warriorIdA, nextBout.a || 'Unknown')}
                  </p>
                  <p className="text-[9px] text-muted-foreground truncate uppercase">
                    {resolveStableName(state, nextBout.stableIdA, nextBout.stableA || 'Unknown')}
                  </p>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-bold text-muted-foreground/50">VS</span>
                  {nextBout.type === 'Tournament' && (
                    <Trophy className="h-3 w-3 text-secondary-foreground" />
                  )}
                </div>
                <div className="flex-1 text-center">
                  <p className="text-[11px] font-black truncate">
                    {resolveWarriorName(state, nextBout.warriorIdD, nextBout.d || 'Unknown')}
                  </p>
                  <p className="text-[9px] text-muted-foreground truncate uppercase">
                    {resolveStableName(state, nextBout.stableIdD, nextBout.stableD || 'Unknown')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
