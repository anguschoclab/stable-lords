/**
 * TacticalBar — Persistent bottom alerts panel
 * Shows critical operational alerts with quick actions
 */
import { useState, useMemo } from 'react';
import { useLocation, Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronUp,
  ChevronDown,
  AlertCircle,
  Dumbbell,
  ScrollText,
  Swords,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/state/useGameStore';
import { isFightReady } from '@/engine/warriorStatus';
import type { BoutOffer } from '@/types/state.types';

interface Alert {
  id: string;
  type: 'warning' | 'info' | 'urgent' | 'success';
  icon: React.ElementType;
  message: string;
  action?: {
    label: string;
    to: string;
  };
}

export function TacticalBar() {
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();
  const { roster, trainers, trainingAssignments, boutOffers, isTournamentWeek, day, week } =
    useGameStore();

  // Generate alerts based on game state
  const alerts = useMemo<Alert[]>(() => {
    const result: Alert[] = [];

    // Check for unassigned training
    const assignedIds = new Set(
      trainingAssignments?.map((a: { warriorId: string }) => a.warriorId) ?? []
    );
    const activeWarriors = roster?.filter((w: { status: string }) => w.status === 'Active') ?? [];
    const unassigned = activeWarriors.filter((w: { id: string }) => !assignedIds.has(w.id));

    if (unassigned.length > 0) {
      result.push({
        id: 'unassigned-training',
        type: 'warning',
        icon: Dumbbell,
        message: `${unassigned.length} warrior${unassigned.length > 1 ? 's' : ''} need${unassigned.length === 1 ? 's' : ''} training assignment`,
        action: { label: 'Assign', to: '/command/training' },
      });
    }

    // Check for pending bout offers (boutOffers is Record<string, BoutOffer>)
    const offersArray: BoutOffer[] = boutOffers
      ? Object.values(boutOffers as Record<string, BoutOffer>)
      : [];
    const pendingOffers = offersArray.filter((o) => o.status === 'Proposed');

    if (pendingOffers.length > 0) {
      result.push({
        id: 'pending-offers',
        type: 'info',
        icon: ScrollText,
        message: `${pendingOffers.length} bout offer${pendingOffers.length > 1 ? 's' : ''} pending response`,
        action: { label: 'Review', to: '/ops/contracts' },
      });
    }

    // Check for fight-ready warriors
    const fightReady =
      roster?.filter((w: unknown) => isFightReady(w as Parameters<typeof isFightReady>[0])) ?? [];

    if (fightReady.length >= 2) {
      result.push({
        id: 'combat-ready',
        type: 'success',
        icon: Swords,
        message: `${fightReady.length} warriors ready for combat`,
        action: { label: 'Execute', to: '/command/combat' },
      });
    }

    // Check for tournament week
    if (isTournamentWeek) {
      result.push({
        id: 'tournament-active',
        type: 'urgent',
        icon: Trophy,
        message: `Tournament Day ${day + 1} in progress`,
        action: { label: 'Enter', to: '/world/tournaments' },
      });
    }

    return result;
  }, [roster, trainingAssignments, boutOffers, isTournamentWeek, day, trainers]);

  // Don't show on certain pages (welcome, warrior detail)
  const hiddenPaths = ['/welcome', '/help'];
  if (hiddenPaths.some((p) => location.pathname.startsWith(p))) {
    return null;
  }

  // Don't show if no alerts and not expanded
  if (alerts.length === 0 && !expanded) {
    return null;
  }

  const hasAlerts = alerts.length > 0;

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-xl border-t border-white/10',
        'transition-all duration-300'
      )}
    >
      {/* Collapsed header / Toggle */}
      <div
        className={cn(
          'flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-white/5 transition-colors',
          expanded && 'border-b border-white/5'
        )}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {hasAlerts ? (
            <>
              <div className="flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-arena-gold" />
                <span className="text-xs font-black uppercase tracking-wider text-arena-gold">
                  {alerts.length} Alert{alerts.length > 1 ? 's' : ''}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {alerts[0]?.message}
              </span>
            </>
          ) : (
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              No Active Alerts
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            W{week}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            title={expanded ? 'Collapse tactical alerts' : 'Expand tactical alerts'}
            aria-label={expanded ? 'Collapse tactical alerts' : 'Expand tactical alerts'}
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-2 max-h-48 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-xs">
                  All systems operational. No alerts.
                </div>
              ) : (
                alerts.map((alert) => {
                  const Icon = alert.icon;
                  return (
                    <div
                      key={alert.id}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-none border',
                        alert.type === 'warning' && 'bg-arena-gold/10 border-arena-gold/20',
                        alert.type === 'info' && 'bg-muted/30 border-border/30',
                        alert.type === 'urgent' && 'bg-destructive/10 border-destructive/20',
                        alert.type === 'success' && 'bg-primary/10 border-primary/20'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={cn(
                            'h-4 w-4',
                            alert.type === 'warning' && 'text-arena-gold',
                            alert.type === 'info' && 'text-muted-foreground',
                            alert.type === 'urgent' && 'text-destructive',
                            alert.type === 'success' && 'text-primary'
                          )}
                        />
                        <span className="text-xs font-medium">{alert.message}</span>
                      </div>

                      {alert.action && (
                        <Link to={alert.action.to}>
                          <Button
                            size="sm"
                            variant="outline"
                            className={cn(
                              'h-7 text-[10px] font-black uppercase tracking-wider',
                              alert.type === 'warning' &&
                                'border-arena-gold/30 hover:bg-arena-gold/20',
                              alert.type === 'info' && 'border-border/30 hover:bg-muted/20',
                              alert.type === 'urgent' &&
                                'border-destructive/30 hover:bg-destructive/20',
                              alert.type === 'success' && 'border-primary/30 hover:bg-primary/20'
                            )}
                          >
                            {alert.action.label}
                          </Button>
                        </Link>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
