/**
 * MobileNav — Mobile navigation drawer using Sheet component
 * Provides hamburger menu + slide-out navigation for < md viewports
 */
import { useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords,
  Users,
  Globe,
  LayoutDashboard,
  BookUser,
  Dumbbell,
  Flame,
  Skull,
  Wrench,
  Coins,
  ScrollText,
  Building2,
  Sunset,
  Trophy,
  Radar,
  Newspaper,
  ChevronRight,
  AlertCircle,
  CalendarClock,
  ShieldAlert,
  BrainCircuit,
  UserPlus,
  Menu,
} from 'lucide-react';
import { useGameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';

// ─── Hub + sub-page definitions (mirrors LeftNav) ───────────────────────────

const HUBS = [
  {
    id: 'command',
    label: 'Command',
    icon: Swords,
    to: '/command',
    pages: [
      { to: '/command', label: 'Overview', icon: LayoutDashboard, exact: true },
      { to: '/command/roster', label: 'Roster', icon: BookUser },
      { to: '/command/training', label: 'Training', icon: Dumbbell },
      { to: '/command/tactics', label: 'Planner', icon: BrainCircuit },
      { to: '/command/arena', label: 'Arena', icon: Flame },
      { to: '/world/tournaments', label: 'Tournaments', icon: CalendarClock },
    ],
  },
  {
    id: 'ops',
    label: 'Stable',
    icon: Users,
    to: '/ops',
    pages: [
      { to: '/ops/overview', label: 'Overview', icon: LayoutDashboard, exact: true },
      { to: '/ops/roster', label: 'Roster', icon: BookUser },
      { to: '/ops/equipment', label: 'Equipment', icon: Wrench },
      { to: '/ops/contracts', label: 'Bouts', icon: ScrollText },
      { to: '/ops/promoters', label: 'Promoters', icon: Building2 },
      { to: '/ops/personnel', label: 'Trainers', icon: Dumbbell },
      { to: '/ops/finance', label: 'Finance', icon: Coins },
      { to: '/ops/recruit', label: 'Recruit', icon: UserPlus },
      { to: '/ops/offseason', label: 'Offseason', icon: Sunset },
    ],
  },
  {
    id: 'world',
    label: 'World',
    icon: Globe,
    to: '/world',
    pages: [
      { to: '/world', label: 'Rankings', icon: Trophy, exact: true },
      { to: '/world/tournaments', label: 'Tournaments', icon: CalendarClock },
      { to: '/world/intelligence', label: 'Scouting', icon: Radar },
      { to: '/world/chronicle', label: 'Chronicle', icon: Newspaper },
      { to: '/world/history', label: 'Hall of Fame', icon: Trophy },
      { to: '/world/graveyard', label: 'Graveyard', icon: Skull },
    ],
  },
] as const;

type HubId = (typeof HUBS)[number]['id'];

// ─── Alert badge helper (mirrors LeftNav) ───────────────────────────────────

function useNavAlerts() {
  const { roster, boutOffers, isTournamentWeek, trainingAssignments } = useGameStore(
    useShallow((s) => ({
      roster: s.roster,
      boutOffers: s.boutOffers,
      isTournamentWeek: s.isTournamentWeek,
      trainingAssignments: s.trainingAssignments,
      week: s.week,
    }))
  );

  const assignedIds = new Set((trainingAssignments ?? []).map((a) => a.warriorId));
  const untrainedCount = roster.filter(
    (w) => w.status === 'Active' && !assignedIds.has(w.id)
  ).length;

  const rosterIds = new Set(roster.map((w) => w.id));
  const pendingOffers = Object.values(boutOffers || {}).filter(
    (o) => o.status === 'Proposed' && o.warriorIds.some((id) => rosterIds.has(id))
  ).length;

  return {
    counts: {
      command: untrainedCount,
      ops: pendingOffers,
      world: isTournamentWeek ? 1 : 0,
    } as Record<HubId, number>,
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

interface MobileNavProps {
  className?: string;
}

export function MobileNav({ className }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;
  const { counts: alerts } = useNavAlerts();

  const activeHubId = (HUBS.find((h) => currentPath === h.to || currentPath.startsWith(`${h.to}/`))
    ?.id ?? null) as HubId | null;

  return (
    <div className={cn('flex md:hidden', className)}>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-none hover:bg-white/5 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 bg-[#0C0806] border-r border-white/5 p-0">
          <SheetHeader className="p-4 border-b border-white/5">
            <SheetTitle className="font-display text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-3">
              <Swords className="h-4 w-4 text-primary" />
              Navigation
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden">
            {/* Hub switcher */}
            <div className="flex flex-col gap-0.5 p-2 border-b border-white/5">
              {HUBS.map((hub) => {
                const isActive = activeHubId === hub.id;
                const Icon = hub.icon;
                const alertCount = alerts[hub.id as HubId] ?? 0;

                return (
                  <SheetClose asChild key={hub.id}>
                    <Link
                      to={hub.to}
                      className={cn(
                        'relative flex items-center gap-2.5 px-3 py-3 rounded-none',
                        'text-[11px] font-black uppercase tracking-widest transition-all duration-150',
                        isActive
                          ? 'text-primary bg-primary/10 border-l-2 border-primary'
                          : 'text-muted-foreground/60 hover:text-foreground hover:bg-white/5 border-l-2 border-transparent'
                      )}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="flex-1">{hub.label}</span>
                      {alertCount > 0 && (
                        <span className="text-[10px] font-mono font-black text-primary">
                          {alertCount}
                        </span>
                      )}
                      {isActive && <ChevronRight className="h-3 w-3 text-primary/60 shrink-0" />}
                    </Link>
                  </SheetClose>
                );
              })}
            </div>

            {/* Sub-page list for active hub */}
            <div className="flex-1 overflow-y-auto py-2">
              <AnimatePresence mode="wait">
                {activeHubId && (
                  <motion.div
                    key={activeHubId}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col gap-0.5 px-2"
                  >
                    {HUBS.find((h) => h.id === activeHubId)?.pages.map((page) => {
                      const pageAny = page as { to: string; exact?: boolean };
                      const isActive = pageAny.exact
                        ? currentPath === page.to
                        : currentPath === page.to || currentPath.startsWith(`${page.to}/`);
                      const PageIcon = page.icon;

                      return (
                        <SheetClose asChild key={page.to}>
                          <Link
                            to={page.to}
                            className={cn(
                              'relative flex items-center gap-2.5 px-3 py-2.5 rounded-none',
                              'text-[10px] font-black uppercase tracking-wider transition-all duration-150 group',
                              isActive
                                ? 'text-foreground bg-white/8'
                                : 'text-muted-foreground/50 hover:text-foreground/80 hover:bg-white/5'
                            )}
                          >
                            {isActive && (
                              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
                            )}
                            <PageIcon
                              className={cn(
                                'h-3.5 w-3.5 shrink-0 transition-colors',
                                isActive
                                  ? 'text-primary'
                                  : 'text-muted-foreground/40 group-hover:text-muted-foreground/70'
                              )}
                            />
                            <span className="relative">{page.label}</span>
                          </Link>
                        </SheetClose>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom alert strip */}
            <AlertStrip alerts={alerts} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ─── Bottom alert strip ─────────────────────────────────────────────────────

function AlertStrip({ alerts }: { alerts: Record<HubId, number> }) {
  const { isTournamentWeek } = useGameStore(
    useShallow((s) => ({ isTournamentWeek: s.isTournamentWeek }))
  );

  const alertItems: { icon: React.ElementType; label: string; color: string; to: string }[] = [];

  if (alerts.command > 0)
    alertItems.push({
      icon: ShieldAlert,
      label: `${alerts.command} unassigned`,
      color: 'text-arena-gold',
      to: '/command/training',
    });

  if (alerts.ops > 0)
    alertItems.push({
      icon: ScrollText,
      label: `${alerts.ops} offers`,
      color: 'text-arena-pop',
      to: '/ops/contracts',
    });

  if (isTournamentWeek)
    alertItems.push({
      icon: AlertCircle,
      label: 'Tournament week',
      color: 'text-arena-blood',
      to: '/world/tournaments',
    });

  if (alertItems.length === 0) return null;

  return (
    <div className="border-t border-white/5 p-2 flex flex-col gap-1">
      {alertItems.map((a, i) => {
        const Icon = a.icon;
        return (
          <SheetClose asChild key={i}>
            <Link
              to={a.to as never}
              className={cn(
                'flex items-center gap-2 px-2 py-2 text-[9px] font-black uppercase tracking-widest transition-opacity hover:opacity-70',
                a.color
              )}
            >
              <Icon className="h-3 w-3 shrink-0" />
              <span>{a.label}</span>
            </Link>
          </SheetClose>
        );
      })}
    </div>
  );
}
