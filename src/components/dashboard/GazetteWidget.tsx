import React from "react";
import { ScrollText } from "lucide-react";
import { useGameStore } from "@/state/useGameStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function GazetteWidget() {
  const { state } = useGameStore();
  const recentNews = (state.newsletter || []).slice(-3).reverse();

  return (
    <Card className="md:col-span-2">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-accent" /> Arena Gazette
        </CardTitle>
        {state.newsletter && state.newsletter.length > 3 && (
          <span className="text-[10px] text-muted-foreground">
            {state.newsletter.length} dispatches
          </span>
        )}
      </CardHeader>
      <CardContent>
        {recentNews.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            No news dispatches yet. Run some rounds to generate arena buzz.
          </p>
        ) : (
          <div className="space-y-3">
            {recentNews.map((n, i) => (
              <div key={i}>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                  Week {n.week} — {n.title}
                </div>
                <ul className="space-y-0.5">
                  {n.items.slice(0, 3).map((item, j) => (
                    <li key={j} className="text-xs text-foreground/80 pl-2.5 border-l-2 border-primary/30">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
