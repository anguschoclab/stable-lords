import React, { useMemo, useState } from "react";
import { useGameStore } from "@/state/useGameStore";
import { Warrior, ATTRIBUTE_KEYS, ATTRIBUTE_LABELS, STYLE_DISPLAY_NAMES } from "@/types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WarriorRadarChart } from "@/components/charts/WarriorRadarChart";
import { FormSparkline } from "@/components/charts/FormSparkline";
import { 
  Trophy, Star, Flame, Shield, Activity, 
  History, Swords, Heart, Zap, Skull 
} from "lucide-react";
import { StatBadge } from "@/components/ui/StatBadge";

interface WarriorDossierProps {
  warriorId: string;
}

export function WarriorDossier({ warriorId }: WarriorDossierProps) {
  const { state } = useGameStore();

  const warrior = useMemo(() => {
    let w = state.roster.find((w) => w.id === warriorId) ||
            state.graveyard.find((w) => w.id === warriorId) ||
            state.retired.find((w) => w.id === warriorId);
    if (w) return w;
    for (const rs of state.rivals || []) {
      w = rs.roster.find((w) => w.id === warriorId);
      if (w) return w;
    }
    return undefined;
  }, [warriorId, state.roster, state.graveyard, state.retired, state.rivals]);

  if (!warrior) return <div className="p-8 text-center text-muted-foreground">Warrior not found.</div>;

  const record = `${warrior.career.wins}W - ${warrior.career.losses}L - ${warrior.career.kills}K`;
  const fatigue = (warrior as any).fatigue ?? 0;
  const condition = 100 - fatigue;

  return (
    <ScrollArea className="h-full pr-4">
      <div className="space-y-6 pb-20">
        {/* Header Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-display font-black tracking-tight">{warrior.name}</h2>
            <StatBadge styleName={warrior.style} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">{record}</span>
            <FormSparkline warriorId={warrior.id} />
          </div>
        </div>

        {/* Condition Box */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-secondary/20 border-none">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-muted-foreground">
                <span>Condition</span>
                <span>{condition}%</span>
              </div>
              <Progress 
                value={condition} 
                className={cn(
                  "h-1.5",
                  condition > 70 ? "[&>div]:bg-arena-fame" : condition > 30 ? "[&>div]:bg-arena-gold" : "[&>div]:bg-destructive"
                )}
              />
            </CardContent>
          </Card>
          <Card className="bg-secondary/20 border-none">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-muted-foreground">
                <span>Fame</span>
                <span>{warrior.fame}</span>
              </div>
              <div className="flex items-center gap-1">
                <Flame className="h-3 w-3 text-arena-fame" />
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                   <div className="h-full bg-arena-fame" style={{ width: `${Math.min(100, (warrior.fame / 100) * 100)}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Radar Chart Section */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Physical Polygon</CardTitle>
          </CardHeader>
          <CardContent>
            <WarriorRadarChart warrior={warrior} />
          </CardContent>
        </Card>

        {/* Attributes Grid */}
        <div className="grid grid-cols-2 gap-2">
          {ATTRIBUTE_KEYS.map((key) => (
            <div key={key} className="flex items-center justify-between p-2 rounded bg-secondary/10 border border-border/50">
              <span className="text-[10px] uppercase text-muted-foreground font-medium">{ATTRIBUTE_LABELS[key]}</span>
              <span className="text-sm font-mono font-bold">{warrior.attributes[key]}</span>
            </div>
          ))}
        </div>

        {/* Injuries */}
        {warrior.injuries.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-1">
              <Activity className="h-3 w-3 text-destructive" /> Medical Report
            </h3>
            <div className="grid gap-2">
              {warrior.injuries.map((inj, i) => {
                const name = typeof inj === "string" ? inj : inj.name;
                return (
                  <Badge key={i} variant="outline" className="justify-start py-1 px-2 border-destructive/30 text-destructive bg-destructive/5 text-[10px] gap-2">
                    <Skull className="h-3 w-3 shrink-0" /> {name}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

import { cn } from "@/lib/utils";
