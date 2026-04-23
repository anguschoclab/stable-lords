import { Trophy, Flame, Users, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TagBadge } from '@/components/ui/WarriorBadges';
import { STYLE_DISPLAY_NAMES, FightingStyle } from '@/types/game';
import { EditableText } from '@/components/ui/EditableText';
import { useGameStore } from '@/state/useGameStore';
import { cn } from '@/lib/utils';
import type { InsightToken } from '@/types/state.types';

interface ObfuscatedWarrior {
  name: string;
  champion: boolean;
  style: FightingStyle | 'UNKNOWN';
  career: { wins: number; losses: number; kills: number };
  fame: number;
  popularity: number;
  flair: string[];
  titles: string[];
  injuries: (string | { name: string })[];
}

interface WarriorHeroHeaderProps {
  warrior: ObfuscatedWarrior;
  record: string;
  streakLabel: string | null;
  streakVal: number;
  id?: string;
  isPlayerOwned?: boolean;
  insightTokens?: InsightToken[];
}

export function WarriorHeroHeader({
  warrior,
  record,
  streakLabel,
  streakVal,
  id,
  isPlayerOwned,
  insightTokens,
}: WarriorHeroHeaderProps) {
  const store = useGameStore();

  // Get insight tokens for this warrior
  const warriorInsightTokens = insightTokens?.filter((token) => token.warriorId === id) || [];

  return (
    <div
      className="relative rounded-none border border-[rgba(60,42,22,0.8)] bg-[#120D09] p-4 sm:p-8 overflow-hidden shadow-xl"
      style={{
        borderTopColor: 'rgba(80,55,30,0.45)',
        borderLeftColor: 'rgba(70,48,26,0.4)',
        backgroundImage:
          'linear-gradient(135deg,rgba(255,245,220,0.018) 0%,transparent 60%,rgba(200,120,20,0.02) 100%)',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/8 to-accent/4 pointer-events-none" />
      <div className="absolute inset-0 glow-blood pointer-events-none opacity-40" />
      <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
            {isPlayerOwned && id ? (
              <EditableText
                value={warrior.name}
                onSave={(newName) => store.renameWarrior(id, newName)}
                className="text-2xl sm:text-3xl font-display font-bold tracking-wide break-all"
                label="Rename Warrior"
              />
            ) : (
              <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-wide break-all">
                {warrior.name}
              </h1>
            )}
            {warrior.champion && (
              <Badge className="bg-arena-gold text-black gap-1">
                <Trophy className="h-3 w-3" /> Champion
              </Badge>
            )}
            {warriorInsightTokens.length > 0 && (
              <Badge variant="outline" className="gap-1 border-primary/50 bg-primary/10">
                <Eye className="h-3 w-3" /> {warriorInsightTokens.length} Insights
              </Badge>
            )}
          </div>
          <p className="text-lg text-muted-foreground font-display">
            {warrior.style === 'UNKNOWN'
              ? 'Unknown Style'
              : STYLE_DISPLAY_NAMES[warrior.style as FightingStyle]}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <p className="font-mono text-sm text-muted-foreground">{record}</p>
            {streakLabel && (
              <Badge variant={streakVal > 0 ? 'default' : 'destructive'} className="text-xs gap-1">
                {streakLabel}
              </Badge>
            )}
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            {warrior.flair.map((f) => (
              <TagBadge key={f} tag={f} type="flair" />
            ))}
            {warrior.titles.map((t) => (
              <TagBadge key={t} tag={t} type="title" />
            ))}
            {warrior.injuries.map((i) => {
              const injName = typeof i === 'string' ? i : i.name;
              return <TagBadge key={injName} tag={injName} type="injury" />;
            })}
          </div>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <Flame className="h-6 w-6 text-arena-fame mx-auto mb-1" />
            <div className="text-2xl font-bold">{warrior.fame}</div>
            <div className="text-xs text-muted-foreground">Fame</div>
          </div>
          <div className="text-center">
            <Users className="h-6 w-6 text-arena-pop mx-auto mb-1" />
            <div className="text-2xl font-bold">{warrior.popularity}</div>
            <div className="text-xs text-muted-foreground">Pop</div>
          </div>
        </div>
      </div>
    </div>
  );
}
