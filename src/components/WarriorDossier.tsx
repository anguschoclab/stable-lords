import React, { useMemo } from 'react';
import { useGameStore, useWorldState } from '@/state/useGameStore';
import { ATTRIBUTE_KEYS, ATTRIBUTE_LABELS } from '@/types/game';
import type { InjuryData } from '@/types/warrior.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WarriorRadarChart } from '@/components/charts/WarriorRadarChart';
import { FormSparkline } from '@/components/charts/FormSparkline';
import { Activity, Swords, Zap, Skull } from 'lucide-react';
import { StatBadge } from '@/components/ui/WarriorBadges';
import WarriorPaperDoll from '@/components/WarriorPaperDoll';
import { StatBattery } from '@/components/ui/StatBattery';
import { cn } from '@/lib/utils';
import { TRAIT_DATA } from '@/data/orphanPool';
import { getFavoritesDisplay } from '@/components/warrior/favoritesDisplay';
import { LineageTree } from '@/components/stable/LineageTree';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { History, Fingerprint } from 'lucide-react';

interface WarriorDossierProps {
  warriorId: string;
}

export const WarriorDossier = React.memo(function WarriorDossier({
  warriorId,
}: WarriorDossierProps) {
  const state = useWorldState();

  // Use fine-grained selector to find the warrior
  const warrior = useMemo(() => {
    let w =
      state.roster.find((w) => w.id === warriorId) ||
      state.graveyard.find((w) => w.id === warriorId) ||
      state.retired.find((w) => w.id === warriorId);
    if (w) return w;
    for (const rs of state.rivals || []) {
      w = rs.roster.find((w) => w.id === warriorId);
      if (w) return w;
    }
    return undefined;
  }, [state, warriorId]);

  // Also select rankings separately
  const rankings = state.realmRankings?.[warriorId];

  if (!warrior)
    return <div className="p-8 text-center text-muted-foreground">Warrior not found.</div>;

  const favDisplay = getFavoritesDisplay(warrior);
  const record = `${warrior.career.wins}W - ${warrior.career.losses}L - ${warrior.career.kills}K`;
  const fatigue = warrior.fatigue ?? 0;
  const condition = 100 - fatigue;

  return (
    <ScrollArea className="h-full pr-4">
      <div className="space-y-6 pb-20">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-display font-black tracking-tight uppercase">
                {warrior.name}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase opacity-60 tracking-widest">
                  {record}
                </span>
                <FormSparkline warriorId={warrior.id} />
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatBadge styleName={warrior.style} />
              {rankings && (
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] font-black uppercase tracking-tighter border-primary/20',
                      rankings.overallRank <= 64
                        ? 'text-arena-gold bg-arena-gold/5'
                        : 'text-primary bg-primary/5'
                    )}
                  >
                    RANK #{rankings.overallRank}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="text-[10px] font-black uppercase tracking-tighter bg-neutral-900 border border-white/5 opacity-80"
                  >
                    {Math.round(rankings.compositeScore)} PTS
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {(warrior.origin || (warrior.traits && warrior.traits.length > 0)) && (
            <div className="p-3 bg-white/5 border border-white/5 rounded-none space-y-3">
              <div className="flex flex-wrap gap-2">
                {warrior.traits?.map((t) => (
                  <Badge
                    key={t}
                    variant="secondary"
                    className="text-[9px] font-black uppercase tracking-widest bg-arena-gold/10 text-arena-gold border-arena-gold/20"
                  >
                    {t}
                  </Badge>
                ))}
              </div>
              {warrior.origin && (
                <p className="text-[11px] font-medium text-muted-foreground/90 uppercase tracking-wider leading-tight">
                  {warrior.origin}
                </p>
              )}
              {warrior.lore && (
                <p className="text-xs text-muted-foreground/60 italic leading-relaxed border-l border-white/10 pl-3">
                  "{warrior.lore}"
                </p>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <Card className="bg-secondary/20 border-none">
              <CardContent className="p-3 space-y-3">
                <div className="space-y-1">
                  <StatBattery
                    label="CND"
                    value={condition}
                    max={100}
                    labelValue={`${condition}%`}
                    colorClass={
                      condition > 70
                        ? '[&>div]:bg-arena-fame'
                        : condition > 30
                          ? '[&>div]:bg-arena-gold'
                          : '[&>div]:bg-destructive'
                    }
                    className="[&>span]:text-[10px] [&>span]:uppercase [&>span]:font-bold [&>span]:text-muted-foreground [&>.flex-1>div]:h-1.5"
                  />
                </div>
                <div className="space-y-1">
                  <StatBattery
                    label="FAME"
                    value={warrior.fame}
                    max={100}
                    labelValue={warrior.fame}
                    colorClass="[&>div]:bg-arena-fame"
                    className="[&>span]:text-[10px] [&>span]:uppercase [&>span]:font-bold [&>span]:text-muted-foreground [&>.flex-1>div]:h-1.5"
                  />
                </div>
              </CardContent>
            </Card>
            <div className="grid grid-cols-2 gap-2">
              {ATTRIBUTE_KEYS.map((key) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-2 rounded bg-secondary/10 border border-border/50"
                >
                  <span className="text-[10px] uppercase text-muted-foreground font-medium">
                    {ATTRIBUTE_LABELS[key]}
                  </span>
                  <span className="text-sm font-mono font-bold">{warrior.attributes[key]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full bg-neutral-900 border border-white/5 p-1 rounded-none h-10">
                <TabsTrigger
                  value="overview"
                  className="flex-1 text-[9px] font-black uppercase tracking-widest rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Fingerprint className="h-3 w-3 mr-2" /> Biometrics
                </TabsTrigger>
                <TabsTrigger
                  value="lineage"
                  className="flex-1 text-[9px] font-black uppercase tracking-widest rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <History className="h-3 w-3 mr-2" /> Lineage
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4 space-y-4">
                <Card className="bg-glass border-arena-blood/10 overflow-hidden relative">
                  <CardHeader className="pb-0 pt-3 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-[9px] uppercase tracking-widest text-muted-foreground font-black">
                      Trauma Mapping
                    </CardTitle>
                    <Activity className="h-3 w-3 text-arena-blood animate-pulse" />
                  </CardHeader>
                  <CardContent className="flex justify-center p-4">
                    <WarriorPaperDoll
                      injuries={warrior.injuries}
                      isWeaponMastered={
                        !!(
                          warrior.favorites?.weaponId &&
                          warrior.equipment?.weapon === warrior.favorites.weaponId &&
                          warrior.favorites.discovered.weapon
                        )
                      }
                      size={140}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="lineage" className="mt-4">
                <LineageTree lineage={warrior.lineage} warriorName={warrior.name} />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-glass/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                Physical Polygon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WarriorRadarChart warrior={warrior} />
            </CardContent>
          </Card>

          <Card className="bg-glass/5 border-arena-gold/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] uppercase tracking-widest text-arena-gold font-black flex items-center gap-2">
                <Zap className="h-3 w-3 fill-arena-gold" /> Soul_Bond & Mastery
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <div className="text-[9px] font-black uppercase text-muted-foreground flex items-center gap-1.5 tracking-tighter">
                  <Swords className="h-3 w-3" /> Weapon Preference
                </div>
                {warrior.favorites?.discovered.weapon ? (
                  <div className="flex items-center justify-between p-2 rounded bg-arena-gold/5 border border-arena-gold/20">
                    <span>{favDisplay.weapon}</span>
                    <Badge className="bg-arena-gold text-black font-black text-[8px] h-4 px-1">
                      MASTERY ✨
                    </Badge>
                  </div>
                ) : warrior.favorites?.discovered.weaponHints ? (
                  <div className="p-2 rounded bg-white/5 border border-white/10 opacity-60">
                    <span className="text-xs font-medium italic text-muted-foreground">
                      {favDisplay.weaponHint}
                    </span>
                  </div>
                ) : (
                  <div className="text-[10px] text-muted-foreground/40 italic px-2">
                    Unknown Preference
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="text-[9px] font-black uppercase text-muted-foreground flex items-center gap-1.5 tracking-tighter">
                  <Activity className="h-3 w-3" /> Natural Rhythm
                </div>
                {warrior.favorites?.discovered.rhythm ? (
                  <div className="flex items-center justify-between p-2 rounded bg-arena-gold/5 border border-arena-gold/20">
                    <span>{favDisplay.rhythm}</span>
                    <Badge className="bg-arena-gold text-black font-black text-[8px] h-4 px-1">
                      SYNERGY ✨
                    </Badge>
                  </div>
                ) : warrior.favorites?.discovered.rhythmHints ? (
                  <div className="p-2 rounded bg-white/5 border border-white/10 animate-pulse">
                    <span className="text-xs font-bold text-arena-gold/40 uppercase tracking-widest blur-[1px]">
                      {favDisplay.rhythmHint}
                    </span>
                    <span className="ml-2 text-[8px] font-black text-arena-gold/60 uppercase">
                      Emerging...
                    </span>
                  </div>
                ) : (
                  <div className="text-[10px] text-muted-foreground/40 italic px-2">
                    Unknown Rhythm
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {warrior.injuries.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-1">
              <Activity className="h-3 w-3 text-destructive" /> Medical Report
            </h3>
            <div className="grid gap-2">
              {warrior.injuries.map((inj: InjuryData, i: number) => {
                const name = typeof inj === 'string' ? inj : inj.name;
                const severity = typeof inj === 'string' ? 'Minor' : inj.severity;
                return (
                  <Badge
                    key={i}
                    variant="outline"
                    className={cn(
                      'justify-start py-1.5 px-3 border-destructive/20 text-[10px] gap-3 font-bold uppercase tracking-wider',
                      severity === 'Minor'
                        ? 'text-arena-gold bg-arena-gold/5 border-arena-gold/20'
                        : 'text-destructive bg-destructive/5'
                    )}
                  >
                    <Skull className="h-3 w-3 shrink-0" />
                    <div className="flex flex-col">
                      <span>{name}</span>
                      {typeof inj !== 'string' && (
                        <span className="text-[8px] opacity-60 font-mono italic">
                          {inj.location || 'General'}
                        </span>
                      )}
                    </div>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
});
