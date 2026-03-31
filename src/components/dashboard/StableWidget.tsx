import React from "react";
import { Link } from "@tanstack/react-router";
import { Shield, UserPlus, Users } from "lucide-react";
import { useGameStore } from "@/state/useGameStore";
import { selectActiveWarriors } from "@/state/selectors";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { STYLE_DISPLAY_NAMES } from "@/types/game";
import { BASE_ROSTER_CAP } from "@/data/constants";

export function StableWidget() {
  const { state } = useGameStore();
  const activeWarriors = selectActiveWarriors(state);
  const topWarriors = [...activeWarriors].sort((a, b) => b.fame - a.fame).slice(0, 5);

  return (
    <Card className="flex flex-col h-full border-border/50 shadow-sm">
      <CardHeader className="pb-2 border-b border-border/20 bg-secondary/10">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-sm tracking-wide flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" /> STABLE OVERVIEW
          </CardTitle>
          <span className="text-[10px] text-muted-foreground font-mono bg-secondary px-1.5 py-0.5 rounded">
            {activeWarriors.length}/{BASE_ROSTER_CAP + state.rosterBonus} ACTIVE
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col">
        <div className="flex-1">
          {topWarriors.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No active warriors.</div>
          ) : (
            <div className="divide-y divide-border/20">
              {topWarriors.map(w => {
                 const hasInjuries = w.injuries && w.injuries.length > 0;
                 return (
                  <div key={w.id} className="p-2.5 flex items-center gap-3 hover:bg-secondary/20 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-secondary/80 border border-border flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold">{w.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <Link to={`/warrior/${w.id}` as any} className="text-xs font-bold truncate hover:underline">{w.name}</Link>
                        <span className="text-[10px] font-mono whitespace-nowrap">
                           <span className="text-arena-pop">{w.career.wins}</span>-<span className="text-muted-foreground">{w.career.losses}</span>-<span className="text-destructive">{w.career.kills}</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-muted-foreground truncate">{STYLE_DISPLAY_NAMES[w.style as keyof typeof STYLE_DISPLAY_NAMES] || w.style}</span>
                        {hasInjuries ? (
                           <span className="text-[9px] uppercase tracking-wider bg-destructive/10 text-destructive px-1 rounded font-bold">Injured</span>
                        ) : (
                           <span className="text-[9px] uppercase tracking-wider bg-green-500/10 text-green-500 px-1 rounded font-bold">Healthy</span>
                        )}
                      </div>
                    </div>
                  </div>
                 )
              })}
            </div>
          )}
        </div>

        <div className="p-2.5 border-t border-border/20 bg-background/50 grid grid-cols-2 gap-2 mt-auto">
          <Link to="/recruit">
            <Button variant="secondary" size="sm" className="w-full h-7 text-[10px] uppercase tracking-wider font-bold">
              <UserPlus className="h-3 w-3 mr-1" /> Recruit
            </Button>
          </Link>
          <Link to="/stable-hall">
            <Button variant="outline" size="sm" className="w-full h-7 text-[10px] uppercase tracking-wider font-bold">
              <Users className="h-3 w-3 mr-1" /> View All
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
