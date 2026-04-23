/**
 * LeftNav — Vertical sidebar navigation
 * Replaces HubNav (top bar) + SubTabNav (secondary tabs) with a single
 * collapsible left rail: hub switcher + per-hub sub-pages + alert badges.
 */
import React, { useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Swords, Users, Globe,
  LayoutDashboard, BookUser, Dumbbell, Flame, Skull,
  Wrench, Coins, ScrollText, Building2, Sunset,
  Trophy, Radar, Newspaper,
  ChevronRight,
  AlertCircle,
  CalendarClock,
  ShieldAlert,
} from "lucide-react";
import { useGameStore } from "@/state/useGameStore";
import { useShallow } from "zustand/react/shallow";

// ─── Hub + sub-page definitions ─────────────────────────────────────────────

const HUBS = [
  {
    id: "command",
    label: "Command",
    icon: Swords,
    to: "/command",
    pages: [
      { to: "/command",               label: "Overview",     icon: LayoutDashboard, exact: true },
      { to: "/command/roster",        label: "Roster",       icon: BookUser },
      { to: "/command/training",      label: "Training",     icon: Dumbbell },
      { to: "/command/arena",         label: "Arena",        icon: Flame },
      { to: "/world/tournaments",     label: "Tournaments",  icon: CalendarClock },
    ],
  },
  {
    id: "ops",
    label: "Stable",
    icon: Users,
    to: "/ops",
    pages: [
      { to: "/ops/personnel",  label: "Personnel",  icon: Users },
      { to: "/ops/equipment",  label: "Equipment",  icon: Wrench },
      { to: "/ops/finance",    label: "Finance",    icon: Coins },
      { to: "/ops/contracts",  label: "Bouts",      icon: ScrollText },
      { to: "/ops/promoters",  label: "Promoters",  icon: Building2 },
      { to: "/ops/offseason",  label: "Offseason",  icon: Sunset },
    ],
  },
  {
    id: "world",
    label: "World",
    icon: Globe,
    to: "/world",
    pages: [
      { to: "/world",                label: "Rankings",    icon: Trophy,       exact: true },
      { to: "/world/tournaments",    label: "Tournaments", icon: CalendarClock },
      { to: "/world/intelligence",   label: "Scouting",    icon: Radar },
      { to: "/world/chronicle",      label: "Chronicle",   icon: Newspaper },
      { to: "/world/history",        label: "Graveyard",   icon: Skull },
    ],
  },
] as const;

type HubId = (typeof HUBS)[number]["id"];

// ─── Alert badge helper ──────────────────────────────────────────────────────

function useNavAlerts() {
  const { roster, boutOffers, isTournamentWeek, trainingAssignments, week } = useGameStore(
    useShallow((s) => ({
      roster: s.roster,
      boutOffers: s.boutOffers,
      isTournamentWeek: s.isTournamentWeek,
      trainingAssignments: s.trainingAssignments,
      week: s.week,
    }))
  );
  const location = useLocation();
  const onOpsSection = location.pathname.startsWith("/ops");
  const onCommandSection = location.pathname.startsWith("/command");

  // Track the week when user last visited each section — badge only shows for newer weeks
  const lastSeenOpsWeek = useRef(onOpsSection ? week : -1);
  const lastSeenCommandWeek = useRef(onCommandSection ? week : -1);

  useEffect(() => {
    if (onOpsSection) lastSeenOpsWeek.current = week;
  }, [onOpsSection, week]);

  useEffect(() => {
    if (onCommandSection) lastSeenCommandWeek.current = week;
  }, [onCommandSection, week]);

  const assignedIds = new Set((trainingAssignments ?? []).map((a) => a.warriorId));
  const untrainedCount = roster.filter(
    (w) => w.status === "Active" && !assignedIds.has(w.id)
  ).length;

  const rosterIds = new Set(roster.map((w) => w.id));
  const pendingOffers = Object.values(boutOffers || {}).filter((o) =>
    o.status === "Proposed" && o.warriorIds.some((id) => rosterIds.has(id))
  ).length;

  const showOpsAlert = pendingOffers > 0 && !onOpsSection && week > lastSeenOpsWeek.current;
  const showCommandAlert = untrainedCount > 0 && !onCommandSection && week > lastSeenCommandWeek.current;

  return {
    counts: {
      command: showCommandAlert ? untrainedCount : 0,
      ops: showOpsAlert ? pendingOffers : 0,
      world: isTournamentWeek ? 1 : 0,
    } as Record<HubId, number>,
    links: {
      command: "/command/training",
      ops: "/ops/contracts",
      world: "/world/tournaments",
    } as Record<HubId, string>,
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

interface LeftNavProps {
  className?: string;
}

export function LeftNav({ className }: LeftNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { counts: alerts, links: alertLinks } = useNavAlerts();

  const activeHubId = (HUBS.find(
    (h) => currentPath === h.to || currentPath.startsWith(`${h.to}/`)
  )?.id ?? null) as HubId | null;

  return (
    <nav
      className={cn(
        "w-52 flex-shrink-0 flex flex-col h-full",
        "bg-[#0C0806] border-r border-white/5",
        className
      )}
    >
      {/* Hub switcher */}
      <div className="flex flex-col gap-0.5 p-2 border-b border-white/5">
        {HUBS.map((hub) => {
          const isActive = activeHubId === hub.id;
          const Icon = hub.icon;
          const alertCount = alerts[hub.id as HubId] ?? 0;
          const alertLink = alertLinks[hub.id as HubId];

          return (
            <Link
              key={hub.id}
              to={hub.to}
              className={cn(
                "relative flex items-center gap-2.5 px-3 py-2 rounded-none",
                "text-[11px] font-black uppercase tracking-widest transition-all duration-150",
                isActive
                  ? "text-primary bg-primary/10 border-l-2 border-primary"
                  : "text-muted-foreground/60 hover:text-foreground hover:bg-white/5 border-l-2 border-transparent"
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1">{hub.label}</span>
              {alertCount > 0 && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate({ to: alertLink }); }}
                  className="flex items-center justify-center h-4 min-w-4 px-1 rounded-none bg-arena-blood text-white text-[8px] font-black hover:bg-destructive transition-colors"
                >
                  {alertCount}
                </button>
              )}
              {isActive && (
                <ChevronRight className="h-3 w-3 text-primary/60 shrink-0" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Sub-page list for active hub */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2">
        <AnimatePresence mode="wait">
          {activeHubId && (
            <motion.div
              key={activeHubId}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-0.5 px-2"
            >
              {HUBS.find((h) => h.id === activeHubId)?.pages.map((page) => {
                const pageAny = page as { to: string; exact?: boolean };
                const isActive = pageAny.exact
                  ? currentPath === page.to
                  : currentPath === page.to ||
                    currentPath.startsWith(`${page.to}/`);
                const PageIcon = page.icon;

                return (
                  <Link
                    key={page.to}
                    to={page.to}
                    className={cn(
                      "relative flex items-center gap-2.5 px-3 py-1.5 rounded-none",
                      "text-[10px] font-black uppercase tracking-wider transition-all duration-150 group",
                      isActive
                        ? "text-foreground bg-white/8"
                        : "text-muted-foreground/50 hover:text-foreground/80 hover:bg-white/5"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="leftnav-page-indicator"
                        className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <PageIcon
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground/40 group-hover:text-muted-foreground/70"
                      )}
                    />
                    <span className="relative">{page.label}</span>
                  </Link>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom alert strip */}
      <AlertStrip />
    </nav>
  );
}

// ─── Bottom alert strip ──────────────────────────────────────────────────────

function AlertStrip() {
  const { roster, isTournamentWeek, boutOffers, trainingAssignments, week } = useGameStore(
    useShallow((s) => ({
      roster: s.roster,
      isTournamentWeek: s.isTournamentWeek,
      boutOffers: s.boutOffers,
      trainingAssignments: s.trainingAssignments,
      week: s.week,
    }))
  );

  const location = useLocation();
  const onCommandSection = location.pathname.startsWith("/command");
  const onOpsSection = location.pathname.startsWith("/ops");

  const lastSeenOpsWeek = useRef(onOpsSection ? week : -1);
  const lastSeenCommandWeek = useRef(onCommandSection ? week : -1);

  useEffect(() => {
    if (onOpsSection) lastSeenOpsWeek.current = week;
  }, [onOpsSection, week]);

  useEffect(() => {
    if (onCommandSection) lastSeenCommandWeek.current = week;
  }, [onCommandSection, week]);

  const assignedIds = new Set((trainingAssignments ?? []).map((a) => a.warriorId));
  const untrainedCount = roster.filter(
    (w) => w.status === "Active" && !assignedIds.has(w.id)
  ).length;

  const rosterIds = new Set(roster.map((w) => w.id));
  const pendingOffers = Object.values(boutOffers || {}).filter((o) =>
    o.status === "Proposed" && o.warriorIds.some((id) => rosterIds.has(id))
  ).length;

  const alerts: { icon: React.ElementType; label: string; color: string; to: string }[] = [];

  if (untrainedCount > 0 && !onCommandSection && week > lastSeenCommandWeek.current)
    alerts.push({
      icon: ShieldAlert,
      label: `${untrainedCount} unassigned`,
      color: "text-arena-gold",
      to: "/command/training",
    });

  if (pendingOffers > 0 && !onOpsSection && week > lastSeenOpsWeek.current)
    alerts.push({
      icon: ScrollText,
      label: `${pendingOffers} offers`,
      color: "text-arena-pop",
      to: "/ops/contracts",
    });

  if (isTournamentWeek)
    alerts.push({
      icon: AlertCircle,
      label: "Tournament week",
      color: "text-arena-blood",
      to: "/world/tournaments",
    });

  if (alerts.length === 0) return null;

  return (
    <div className="border-t border-white/5 p-2 flex flex-col gap-1">
      {alerts.map((a, i) => {
        const Icon = a.icon;
        return (
          <Link
            key={i}
            to={a.to}
            className={cn(
              "flex items-center gap-2 px-2 py-1 text-[9px] font-black uppercase tracking-widest transition-opacity hover:opacity-70",
              a.color
            )}
          >
            <Icon className="h-3 w-3 shrink-0" />
            <span>{a.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export { HUBS, type HubId };
