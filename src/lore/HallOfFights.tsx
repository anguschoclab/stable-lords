/**
 * Hall of Fights — displays crowd-remembered arena epics.
 */
import React from "react";
import { LoreArchive } from "./LoreArchive";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const HallOfFights: React.FC = () => {
  const hall = LoreArchive.allHall().slice().reverse();
  const fights = new Map(LoreArchive.allFights().map((f) => [f.id, f]));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-foreground">
        Hall of Fights
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Crowd-remembered epics of the arena.
      </p>
      <div className="space-y-3">
        {hall.length === 0 && (
          <p className="text-muted-foreground italic">
            No legendary fights recorded yet.
          </p>
        )}
        {hall.map((h) => {
          const f = fights.get(h.fightId);
          if (!f) return null;
          const title = f.title || `${f.a} vs. ${f.d}`;
          const by = f.by ? ` (${f.by})` : "";
          return (
            <Card key={h.fightId}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>
                    {h.label} — Week {h.week}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(f.createdAt).toLocaleDateString()}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  {title}
                  {by}
                </div>
                {f.flashyTags && f.flashyTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {f.flashyTags.map((t) => (
                      <Badge key={t} variant="secondary">
                        {t}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default HallOfFights;
