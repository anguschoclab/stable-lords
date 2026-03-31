import React, { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Dumbbell, ChevronRight } from "lucide-react";
import { useGameStore } from "@/state/useGameStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WarriorNameTag, StatBadge } from "@/components/ui/WarriorBadges";
import { ATTRIBUTE_LABELS } from "@/types/game";

export function TrainingWidget() {
  const { state } = useGameStore();
  
  // Map warrior IDs to warriors for display
  const trainingWarriors = useMemo(() => {
    const assignments = state.trainingAssignments ?? [];
    return assignments.map(a => ({
      ...a,
      warrior: state.roster.find(w => w.id === a.warriorId),
    })).filter(a => a.warrior);
  }, [state.trainingAssignments, state.roster]);

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <Dumbbell className="h-4 w-4 text-primary" /> Training
        </CardTitle>
        <Link to="/training">
          <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-muted-foreground">
            Manage <ChevronRight className="h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {trainingWarriors.length === 0 ? (
          <div className="text-center py-3">
            <p className="text-xs text-muted-foreground italic">No warriors in training.</p>
            <Link to="/training">
              <Button variant="outline" size="sm" className="mt-2 text-xs gap-1">
                <Dumbbell className="h-3 w-3" /> Assign Training
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {trainingWarriors.map(({ warriorId, attribute, warrior }) => {
              const w = warrior!;
              const current = w.attributes[attribute as keyof typeof w.attributes];
              const potential = w.potential?.[attribute as keyof typeof w.attributes];
              const atCeiling = potential !== undefined && current >= potential;
              const nearCeiling = potential !== undefined && (potential - current) <= 2;

              return (
                <div key={warriorId} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <WarriorNameTag id={w.id} name={w.name} />
                      <StatBadge styleName={w.style} />
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">Training</span>
                      <Badge
                        variant={atCeiling ? "secondary" : "default"}
                        className="text-[10px] h-4 px-1.5"
                      >
                        {attribute ? ATTRIBUTE_LABELS[attribute as keyof typeof ATTRIBUTE_LABELS] : "Recovery"}
                      </Badge>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        ({current})
                      </span>
                      {atCeiling && (
                        <span className="text-[9px] text-muted-foreground italic">at ceiling</span>
                      )}
                      {!atCeiling && nearCeiling && (
                        <span className="text-[9px] text-arena-gold italic">nearing peak</span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0">
                    <div className={`h-2 w-2 rounded-full ${atCeiling ? "bg-muted-foreground" : "bg-arena-pop animate-pulse"}`} />
                  </div>
                </div>
              );
            })}
            <div className="text-[10px] text-muted-foreground pt-1 border-t border-border/50">
              {trainingWarriors.length} warrior{trainingWarriors.length !== 1 ? "s" : ""} training · gains apply at week end
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
