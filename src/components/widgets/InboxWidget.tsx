import React, { useMemo } from "react";
import { useGameStore } from "@/state/useGameStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Newspaper, Bell, Quote, ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function InboxWidget() {
  const { state } = useGameStore();

  const recentStories = useMemo(() => {
    return [...state.gazettes]
      .sort((a, b) => b.week - a.week)
      .slice(0, 3);
  }, [state.gazettes]);

  return (
    <Card className="h-full border-l-4 border-l-primary/50 shadow-md">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-display font-black flex items-center gap-2 uppercase tracking-tighter">
          <Newspaper className="h-4 w-4 text-primary" /> The Gazette Feed
        </CardTitle>
        <Link to="/world/gazette">
          <ChevronRight className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />
        </Link>
      </CardHeader>
      <CardContent>
        {recentStories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 opacity-40">
            <Bell className="h-8 w-8 mb-2" />
            <p className="text-[10px] font-bold uppercase tracking-widest">No Recent News</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentStories.map((story, i) => (
              <div key={i} className="group relative border-b border-border/40 last:border-0 pb-3 last:pb-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[8px] font-mono px-1 py-0 h-4 min-w-[32px] justify-center">
                    Wk {story.week}
                  </Badge>
                  <h4 className="text-[11px] font-bold leading-tight group-hover:text-primary transition-colors line-clamp-1 italic">
                    {story.headline}
                  </h4>
                </div>
                <p className="text-[10px] text-muted-foreground line-clamp-2 italic leading-relaxed pl-10">
                  <Quote className="inline h-2 w-2 mr-1 opacity-50" />
                  {story.body}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
