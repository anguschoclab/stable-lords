import React from "react";
import { useGame } from "@/state/GameContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Tournaments() {
  const { state } = useGame();
  const seasons = [
    { name: "Spring Classic", season: "Spring", icon: "🌿" },
    { name: "Summer Cup", season: "Summer", icon: "☀️" },
    { name: "Fall Clash", season: "Fall", icon: "🍂" },
    { name: "Winter Crown", season: "Winter", icon: "❄️" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Seasonal Tournaments</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Compete for glory across the four seasons. Current: {state.season}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {seasons.map((s) => (
          <Card
            key={s.name}
            className={
              s.season === state.season
                ? "border-primary/50 glow-primary"
                : "opacity-70"
            }
          >
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <span className="text-xl">{s.icon}</span>
                {s.name}
                {s.season === state.season && (
                  <Badge className="bg-primary text-primary-foreground text-xs ml-auto">
                    Active
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {s.season === state.season
                  ? "This tournament is currently underway. Run rounds to compete!"
                  : "Coming next season. Prepare your warriors."}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
