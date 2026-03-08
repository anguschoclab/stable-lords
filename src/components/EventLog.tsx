/**
 * FM26-inspired Event Log sidebar.
 * Derives events from game state (fights, deaths, recruits, newsletters).
 */
import React, { useMemo } from "react";
import { useGame } from "@/state/GameContext";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Swords,
  Skull,
  UserPlus,
  Trophy,
  Newspaper,
  AlertTriangle,
  Star,
  ScrollText,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

type EventType = "fight" | "kill" | "death" | "recruit" | "tournament" | "news" | "injury" | "retirement";

interface GameEvent {
  id: string;
  week: number;
  type: EventType;
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  iconColor: string;
  linkTo?: string;
  read?: boolean;
}

const EVENT_ICONS: Record<EventType, { icon: React.ElementType; color: string }> = {
  fight: { icon: Swords, color: "text-primary" },
  kill: { icon: Skull, color: "text-arena-blood" },
  death: { icon: Skull, color: "text-destructive" },
  recruit: { icon: UserPlus, color: "text-arena-pop" },
  tournament: { icon: Trophy, color: "text-arena-gold" },
  news: { icon: Newspaper, color: "text-muted-foreground" },
  injury: { icon: AlertTriangle, color: "text-amber-400" },
  retirement: { icon: Star, color: "text-arena-fame" },
};

export default function EventLog() {
  const { state } = useGame();
  const navigate = useNavigate();

  const events = useMemo(() => {
    const all: GameEvent[] = [];

    // Fight results
    state.arenaHistory.forEach((f) => {
      const isKill = f.by === "Kill";
      const winnerName = f.winner === "A" ? f.a : f.winner === "D" ? f.d : null;
      all.push({
        id: `fight-${f.id}`,
        week: f.week,
        type: isKill ? "kill" : "fight",
        title: winnerName ? `${winnerName} defeats ${f.winner === "A" ? f.d : f.a}` : `${f.a} vs ${f.d} — Draw`,
        subtitle: isKill ? `Kill by ${f.by}` : `Victory by ${f.by ?? "decision"}`,
        icon: EVENT_ICONS[isKill ? "kill" : "fight"].icon,
        iconColor: EVENT_ICONS[isKill ? "kill" : "fight"].color,
        linkTo: "/hall-of-fights",
      });
    });

    // Deaths
    state.graveyard.forEach((w) => {
      all.push({
        id: `death-${w.id}`,
        week: w.deathWeek ?? 0,
        type: "death",
        title: `${w.name} Slain`,
        subtitle: w.killedBy ? `Killed by ${w.killedBy}` : w.deathCause ?? "Died in combat",
        icon: EVENT_ICONS.death.icon,
        iconColor: EVENT_ICONS.death.color,
        linkTo: "/graveyard",
      });
    });

    // Retirements
    state.retired.forEach((w) => {
      all.push({
        id: `retire-${w.id}`,
        week: w.retiredWeek ?? 0,
        type: "retirement",
        title: `${w.name} Retired`,
        subtitle: `${w.career.wins}W-${w.career.losses}L career`,
        icon: EVENT_ICONS.retirement.icon,
        iconColor: EVENT_ICONS.retirement.color,
        linkTo: "/graveyard",
      });
    });

    // Newsletter items
    state.newsletter.forEach((n) => {
      all.push({
        id: `news-${n.week}-${n.title}`,
        week: n.week,
        type: "news",
        title: n.title,
        subtitle: n.items[0]?.slice(0, 60) ?? "",
        icon: EVENT_ICONS.news.icon,
        iconColor: EVENT_ICONS.news.color,
      });
    });

    // Tournaments
    state.tournaments.filter((t) => t.completed).forEach((t) => {
      all.push({
        id: `tourney-${t.id}`,
        week: t.week,
        type: "tournament",
        title: t.name,
        subtitle: t.champion ? `Champion: ${t.champion}` : "Tournament completed",
        icon: EVENT_ICONS.tournament.icon,
        iconColor: EVENT_ICONS.tournament.color,
        linkTo: "/tournaments",
      });
    });

    // Sort newest first
    all.sort((a, b) => b.week - a.week || b.id.localeCompare(a.id));

    return all;
  }, [state.arenaHistory, state.graveyard, state.retired, state.newsletter, state.tournaments]);

  // Group by week
  const grouped = useMemo(() => {
    const map = new Map<number, GameEvent[]>();
    events.forEach((e) => {
      if (!map.has(e.week)) map.set(e.week, []);
      map.get(e.week)!.push(e);
    });
    return Array.from(map.entries()).sort(([a], [b]) => b - a);
  }, [events]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-arena-gold" />
          <h2 className="font-display text-sm font-semibold tracking-wide">Arena Feed</h2>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
          {events.length}
        </Badge>
      </div>

      {/* Event List */}
      <ScrollArea className="flex-1">
        <div className="py-1">
          {grouped.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No events yet. Run your first round!
            </div>
          ) : (
            grouped.map(([week, weekEvents]) => (
              <div key={week}>
                {/* Week divider */}
                <div className="sticky top-0 z-10 bg-background/95 backdrop-blur px-4 py-1.5 border-b border-border/50">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Week {week}
                  </span>
                </div>

                {weekEvents.map((event) => {
                  const Icon = event.icon;
                  return (
                    <button
                      key={event.id}
                      onClick={() => event.linkTo && navigate(event.linkTo)}
                      className={cn(
                        "w-full text-left px-4 py-2.5 flex items-start gap-3 transition-colors border-b border-border/30",
                        event.linkTo
                          ? "hover:bg-secondary/60 cursor-pointer"
                          : "cursor-default",
                      )}
                    >
                      <div className={cn("mt-0.5 shrink-0", event.iconColor)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-foreground leading-tight truncate">
                          {event.title}
                        </div>
                        {event.subtitle && (
                          <div className="text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">
                            {event.subtitle}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
