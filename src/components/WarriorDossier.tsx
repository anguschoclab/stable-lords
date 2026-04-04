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
import { StatBadge } from "@/components/ui/WarriorBadges";
import WarriorPaperDoll from "@/components/WarriorPaperDoll";
import { StatBattery } from "@/components/ui/StatBattery";
import { cn } from "@/lib/utils";

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

        {/* Condition & PaperDoll Section */}
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
                    colorClass={condition > 70 ? "[&>div]:bg-arena-fame" : condition > 30 ? "[&>div]:bg-arena-gold" : "[&>div]:bg-destructive"}
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
            
            {/* Attributes Grid */}
            <div className="grid grid-cols-2 gap-2">
              {ATTRIBUTE_KEYS.map((key) => (
                <div key={key} className="flex items-center justify-between p-2 rounded bg-secondary/10 border border-border/50">
                  <span className="text-[10px] uppercase text-muted-foreground font-medium">{ATTRIBUTE_LABELS[key]}</span>
                  <span className="text-sm font-mono font-bold">{warrior.attributes[key]}</span>
                </div>
              ))}
            </div>
          </div>

          <Card className="bg-glass border-arena-blood/10 overflow-hidden relative">
            <CardHeader className="pb-0 pt-3 flex flex-row items-center justify-between space-y-0">
               <CardTitle className="text-[9px] uppercase tracking-widest text-muted-foreground font-black">Trauma Mapping</CardTitle>
               <Activity className="h-3 w-3 text-arena-blood animate-pulse" />
            </CardHeader>
            <CardContent className="flex justify-center p-4">
              <WarriorPaperDoll injuries={warrior.injuries} size={140} />
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

        {/* Injuries List */}
        {warrior.injuries.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-1">
              <Activity className="h-3 w-3 text-destructive" /> Medical Report
            </h3>
            <div className="grid gap-2">
              {warrior.injuries.map((inj, i) => {
                const name = typeof inj === "string" ? inj : inj.name;
                const severity = typeof inj === "string" ? "Minor" : inj.severity;
                return (
                  <Badge 
                    key={i} 
                    variant="outline" 
                    className={cn(
                      "justify-start py-1.5 px-3 border-destructive/20 text-[10px] gap-3 font-bold uppercase tracking-wider",
                      severity === "Minor" ? "text-arena-gold bg-arena-gold/5 border-arena-gold/20" : "text-destructive bg-destructive/5"
                    )}
                  >
                    <Skull className="h-3 w-3 shrink-0" /> 
                    <div className="flex flex-col">
                      <span>{name}</span>
                      {typeof inj !== "string" && <span className="text-[8px] opacity-60 font-mono italic">{inj.location || "General"}</span>}
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
}
