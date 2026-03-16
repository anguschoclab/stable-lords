/**
 * FM26-inspired Event Log sidebar.
 * Derives events from game state (fights, deaths, recruits, newsletters, training, injuries).
 * Entity names are rendered as clickable links via WarriorLink.
 */
import React, { useMemo } from "react";
import { useGameStore } from "@/state/useGameStore";
import { useNavigate } from "@tanstack/react-router";
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
  Dumbbell,
  Heart,
  ChevronRight,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { WarriorLink } from "@/components/EntityLink";

type EventType = "fight" | "kill" | "death" | "recruit" | "tournament" | "news" | "injury" | "retirement" | "training" | "recovery";

interface GameEvent {
  id: string;
  week: number;
  type: EventType;
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  iconColor: string;
  linkTo: string;
  /** Names to linkify in title/subtitle */
  entityNames?: string[];
}

const EVENT_ICONS: Record<EventType, { icon: React.ElementType; color: string }> = {
  fight:      { icon: Swords,        color: "text-primary" },
  kill:       { icon: Skull,         color: "text-arena-blood" },
  death:      { icon: Skull,         color: "text-destructive" },
  recruit:    { icon: UserPlus,      color: "text-arena-pop" },
  tournament: { icon: Trophy,        color: "text-arena-gold" },
  news:       { icon: Newspaper,     color: "text-muted-foreground" },
  injury:     { icon: AlertTriangle, color: "text-amber-400" },
  retirement: { icon: Star,          color: "text-arena-fame" },
  training:   { icon: Dumbbell,      color: "text-primary" },
  recovery:   { icon: Heart,         color: "text-arena-pop" },
};

/**
 * Renders text with known entity names replaced by clickable WarriorLink components.
 * Names are matched longest-first to avoid partial matches.
 */
function LinkifiedText({ text, names }: { text: string; names: string[] }) {
  if (!names || names.length === 0) return <>{text}</>;

  // Sort longest first to avoid partial matches
  const sorted = [...names].sort((a, b) => b.length - a.length);
  // Escape regex special chars in names
  const escaped = sorted.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(${escaped.join("|")})`, "g");

  const parts = text.split(pattern);
  const nameSet = new Set(names);

  return (
    <>
      {parts.map((part, i) =>
        nameSet.has(part) ? (
          <WarriorLink key={i} name={part} className="font-semibold" />
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
}

export default function EventLog() {
  const { state } = useGameStore();
  const navigate = useNavigate();

  // Collect all known warrior names for linkification
  const allWarriorNames = useMemo(() => {
    const names = new Set<string>();
    for (const w of state.roster) names.add(w.name);
    for (const w of state.graveyard) names.add(w.name);
    for (const w of state.retired ?? []) names.add(w.name);
    for (const r of state.rivals ?? []) {
      for (const w of r.roster) names.add(w.name);
    }
    return [...names];
  }, [state.roster, state.graveyard, state.retired, state.rivals]);

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
        subtitle: isKill ? `Killed in combat` : `Victory by ${f.by ?? "decision"}`,
        icon: EVENT_ICONS[isKill ? "kill" : "fight"].icon,
        iconColor: EVENT_ICONS[isKill ? "kill" : "fight"].color,
        linkTo: "/hall-of-fights",
        entityNames: [f.a, f.d],
      });
    });

    // Deaths
    state.graveyard.forEach((w) => {
      const names = [w.name];
      if (w.killedBy) names.push(w.killedBy);
      all.push({
        id: `death-${w.id}`,
        week: w.deathWeek ?? 0,
        type: "death",
        title: `${w.name} Slain`,
        subtitle: w.killedBy ? `Killed by ${w.killedBy}` : w.deathCause ?? "Died in combat",
        icon: EVENT_ICONS.death.icon,
        iconColor: EVENT_ICONS.death.color,
        linkTo: `/warrior/${w.id}`,
        entityNames: names,
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
        linkTo: `/warrior/${w.id}`,
        entityNames: [w.name],
      });
    });

    // Injuries
    state.roster.forEach((w) => {
      if (!w.injuries || w.injuries.length === 0) return;
      w.injuries.forEach((inj, idx) => {
        if (typeof inj === "string") return;
        all.push({
          id: `injury-${w.id}-${inj.id ?? idx}`,
          week: state.week,
          type: "injury",
          title: `${w.name} — ${inj.name}`,
          subtitle: `${inj.severity} · ${inj.weeksRemaining}w recovery`,
          icon: EVENT_ICONS.injury.icon,
          iconColor: EVENT_ICONS.injury.color,
          linkTo: `/warrior/${w.id}`,
          entityNames: [w.name],
        });
      });
    });

    // Training
    (state.trainingAssignments ?? []).forEach((a) => {
      const w = state.roster.find((w) => w.id === a.warriorId);
      if (!w) return;
      const isRecovery = a.type === "recovery";
      all.push({
        id: `train-${a.warriorId}`,
        week: state.week,
        type: isRecovery ? "recovery" : "training",
        title: isRecovery ? `${w.name} recovering` : `${w.name} training${a.attribute ? ` ${a.attribute}` : ""}`,
        subtitle: isRecovery ? "Active recovery from injuries" : "Assigned to training grounds",
        icon: EVENT_ICONS[isRecovery ? "recovery" : "training"].icon,
        iconColor: EVENT_ICONS[isRecovery ? "recovery" : "training"].color,
        linkTo: "/training",
        entityNames: [w.name],
      });
    });

    // Newsletter
    state.newsletter.forEach((n) => {
      all.push({
        id: `news-${n.week}-${n.title}`,
        week: n.week,
        type: "news",
        title: n.title,
        subtitle: n.items[0]?.slice(0, 60) ?? "",
        icon: EVENT_ICONS.news.icon,
        iconColor: EVENT_ICONS.news.color,
        linkTo: "/hall-of-fights",
      });
    });

    // Tournaments
    state.tournaments.filter((t) => t.completed).forEach((t) => {
      const names: string[] = [];
      if (t.champion) names.push(t.champion);
      all.push({
        id: `tourney-${t.id}`,
        week: t.week,
        type: "tournament",
        title: t.name,
        subtitle: t.champion ? `Champion: ${t.champion}` : "Tournament completed",
        icon: EVENT_ICONS.tournament.icon,
        iconColor: EVENT_ICONS.tournament.color,
        linkTo: "/tournaments",
        entityNames: names,
      });
    });

    all.sort((a, b) => b.week - a.week || b.id.localeCompare(a.id));
    return all;
  }, [state.arenaHistory, state.graveyard, state.retired, state.newsletter, state.tournaments, state.roster, state.trainingAssignments, state.week]);

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
                      onClick={() => navigate({ to: event.linkTo })}
                      className={cn(
                        "w-full text-left px-4 py-2.5 flex items-start gap-3 transition-colors border-b border-border/30",
                        "hover:bg-secondary/60 cursor-pointer group",
                      )}
                    >
                      <div className={cn("mt-0.5 shrink-0", event.iconColor)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-foreground leading-tight truncate">
                          <LinkifiedText text={event.title} names={event.entityNames ?? allWarriorNames} />
                        </div>
                        {event.subtitle && (
                          <div className="text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">
                            <LinkifiedText text={event.subtitle} names={event.entityNames ?? allWarriorNames} />
                          </div>
                        )}
                      </div>
                      <ChevronRight className="h-3 w-3 text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-colors mt-0.5 shrink-0" />
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
