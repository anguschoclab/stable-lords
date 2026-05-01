import { Trophy, Flame, Users, Eye, Target, Shield, Heart, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TagBadge } from '@/components/ui/WarriorBadges';
import { STYLE_DISPLAY_NAMES, FightingStyle } from '@/types/game';
import { EditableText } from '@/components/ui/EditableText';
import { useGameStore } from '@/state/useGameStore';
import { cn } from '@/lib/utils';
import type { InsightToken } from '@/types/state.types';
import { Surface } from '@/components/ui/Surface';
import { ImperialRing } from '@/components/ui/ImperialRing';

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
  const warriorInsightTokens = insightTokens?.filter((token) => token.warriorId === id) || [];

  return (
    <Surface variant="glass" className="relative p-8 border-white/5 overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary/40" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary/60">
              {isPlayerOwned ? 'Registry Asset // Internal' : 'External Dossier // Intelligence'}
            </span>
            <div className="flex items-center gap-4">
              {isPlayerOwned && id ? (
                <EditableText
                  value={warrior.name}
                  onSave={(newName) => store.renameWarrior(id, newName)}
                  className="text-4xl font-display font-black uppercase tracking-tight"
                  label="Rename Asset"
                />
              ) : (
                <h1 className="text-4xl font-display font-black uppercase tracking-tight">
                  {warrior.name}
                </h1>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-muted-foreground/40" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {warrior.style === 'UNKNOWN'
                  ? 'Classified Discipline'
                  : STYLE_DISPLAY_NAMES[warrior.style as FightingStyle]}
              </span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <Target className="h-3.5 w-3.5 text-muted-foreground/40" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {record}
              </span>
            </div>
            {warriorInsightTokens.length > 0 && (
              <>
                <div className="h-4 w-px bg-white/10" />
                <div className="flex items-center gap-2 text-primary">
                  <Eye className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {warriorInsightTokens.length} Insights Detected
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
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

        <div className="flex items-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <ImperialRing size="md" variant="blood">
              <Zap className="h-5 w-5 text-primary" />
            </ImperialRing>
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
              Status
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ImperialRing size="md" variant="bronze">
              <Heart className="h-5 w-5 text-muted-foreground/60" />
            </ImperialRing>
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
              Vitals
            </span>
          </div>
        </div>
      </div>
    </Surface>
  );
}
