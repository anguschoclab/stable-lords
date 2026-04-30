import { useMemo } from 'react';
import { useGameStore, useWorldState } from '@/state/useGameStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Trophy,
  Star,
  Flame,
  Activity,
  History,
  Swords,
  Heart,
  Zap,
  Skull,
  Users,
} from 'lucide-react';
import { StatBadge, WarriorNameTag } from '@/components/ui/WarriorBadges';
import { StableCrest } from '@/components/crest/StableCrest';

interface StableDossierProps {
  stableId?: string;
  stableName?: string;
}

export function StableDossier({ stableId, stableName }: StableDossierProps) {
  const state = useWorldState();

  const stable = useMemo(() => {
    if (stableId === 'player' || stableName === state.player.stableName) {
      return {
        owner: state.player,
        roster: state.roster,
        isPlayer: true,
      };
    }
    const rival = state.rivals.find(
      (r) => r.owner.id === stableId || r.owner.stableName === stableName
    );
    if (rival) return { ...rival, isPlayer: false };
    return undefined;
  }, [stableId, stableName, state.player, state.roster, state.rivals]);

  if (!stable)
    return <div className="p-8 text-center text-muted-foreground">Stable not found.</div>;

  return (
    <ScrollArea className="h-full pr-4">
      <div className="space-y-6 pb-20">
        {/* Header Section with Crest */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {'crest' in stable && stable.crest ? (
              <div className="relative">
                <StableCrest crest={stable.crest} size="lg" showMantling />
                {stable.owner?.generation !== undefined && stable.owner.generation > 0 && (
                  <Badge
                    variant="outline"
                    className="absolute -bottom-1 -right-1 text-[8px] px-1 py-0"
                    title={`Generation ${stable.owner.generation} - Inherited crest`}
                  >
                    G{stable.owner.generation}
                  </Badge>
                )}
              </div>
            ) : (
              <div className="h-16 w-16 rounded-none border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-secondary/20">
                <span className="text-xs text-muted-foreground">?</span>
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-black tracking-tight">
                {stable.owner.stableName}
              </h2>
              {stable.isPlayer ? (
                <Badge className="bg-arena-fame text-black">Your Stable</Badge>
              ) : (
                <Badge variant="outline">Rival</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Master: <span className="font-bold text-foreground">{stable.owner.name}</span>
            </p>
            {'crest' in stable && stable.crest && (
              <p className="text-[10px] text-muted-foreground italic">
                {stable.crest.charge.count > 1 ? `${stable.crest.charge.count} ` : ''}
                {stable.crest.charge.name}
                {stable.crest.charge.posture ? ` (${stable.crest.charge.posture})` : ''}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-secondary/20 border-none">
            <CardContent className="p-3 text-center">
              <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Fame</div>
              <div className="text-xl font-display font-black text-arena-fame">
                {stable.owner.fame}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-secondary/20 border-none">
            <CardContent className="p-3 text-center">
              <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                Roster
              </div>
              <div className="text-xl font-display font-black text-primary">
                {stable.roster.filter((w) => w.status === 'Active').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Roster List */}
        <div className="space-y-3">
          <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-1">
            <Users className="h-3 w-3 text-primary" /> Active Roster
          </h3>
          <div className="grid gap-2">
            {stable.roster
              .filter((w) => w.status === 'Active')
              .map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between p-2 rounded-none bg-secondary/10 border border-border/50"
                >
                  <div className="flex items-center gap-2">
                    <StatBadge styleName={w.style} />
                    <span className="text-sm font-medium">{w.name}</span>
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground">
                    {w.career.wins}-{w.career.losses}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
