import React, { useMemo } from "react";
import { useGameStore } from "@/state/useGameStore";
import { selectActiveWarriors } from "@/state/selectors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, Skull, AlertTriangle, HeartPulse } from "lucide-react";
import { WarriorLink } from "@/components/EntityLink";
import { cn } from "@/lib/utils";

export function MedicalWidget() {
  const { state } = useGameStore();

  const atRisk = useMemo(() => {
    return selectActiveWarriors(state).filter(w => {
      const fatigue = (w as any).fatigue ?? 0;
      return (fatigue > 70 || w.injuries.length > 0);
    }).sort((a, b) => {
      const bFatigue = (b as any).fatigue ?? 0;
      const aFatigue = (a as any).fatigue ?? 0;
      return bFatigue - aFatigue;
    });
  }, [state.roster]);

  return (
    <Card className="h-full border-l-4 border-l-destructive/50 shadow-md transition-all hover:shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-display font-black flex items-center gap-2 uppercase tracking-tighter">
          <HeartPulse className="h-4 w-4 text-destructive animate-pulse" /> Medical Center
        </CardTitle>
      </CardHeader>
      <CardContent>
        {atRisk.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 opacity-40">
            <Activity className="h-8 w-8 mb-2" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Roster Healthy</p>
          </div>
        ) : (
          <div className="space-y-4">
            {atRisk.map((w) => {
              const fatigue = (w as any).fatigue ?? 0;
              const condition = 100 - fatigue;
              const isInjured = w.injuries.length > 0;
              
              return (
                <div key={w.id} className="group relative">
                  <div className="flex items-center justify-between mb-1">
                    <WarriorLink name={w.name} id={w.id} className="text-xs font-bold truncate max-w-[120px]" />
                    <div className="flex items-center gap-1">
                       {isInjured && <Skull className="h-3 w-3 text-destructive" title="Injured" />}
                       <span className={cn(
                         "text-[10px] font-mono font-bold",
                         condition < 30 ? "text-destructive" : "text-amber-500"
                       )}>
                         {condition}%
                       </span>
                    </div>
                  </div>
                  <Progress 
                    value={condition} 
                    className={cn(
                      "h-1.5 bg-muted",
                      condition < 30 ? "[&>div]:bg-destructive" : "[&>div]:bg-amber-500"
                    )} 
                  />
                  {isInjured && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {w.injuries.slice(0, 2).map((inj, i) => (
                         <span key={i} className="text-[8px] uppercase font-bold text-destructive/80 bg-destructive/10 px-1 rounded">
                           {typeof inj === 'string' ? inj : inj.name}
                         </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
