import { useMemo } from 'react';
import { useGameStore, useWorldState } from '@/state/useGameStore';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, ShieldAlert, Coins, History, Zap, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface CoachWarning {
  id: string;
  type: 'CRITICAL' | 'WARNING' | 'ADVICE';
  label: string;
  description: string;
  icon: any;
  color: string;
}

export function CoachOverlay() {
  const state = useWorldState();

  const warnings = useMemo(() => {
    const list: CoachWarning[] = [];

    // 💰 Bankruptcy Check
    const weeklyUpkeep = state.roster.length * 10 + state.trainers.length * 50;
    if (state.treasury < weeklyUpkeep) {
      list.push({
        id: 'bankruptcy',
        type: 'CRITICAL',
        label: 'Impending Insolvency',
        description: `Treasury (${state.treasury}g) cannot cover upkeep (${weeklyUpkeep}g). Disband assets or win a bout immediately.`,
        icon: Coins,
        color: 'text-destructive border-destructive/20 bg-destructive/10',
      });
    }

    // 🚑 Injury Check (Fighters assigned to bouts with low health)
    const activeFighters = state.roster.filter((w) =>
      state.arenaHistory.some((f) => (f.a === w.id || f.d === w.id) && f.winner === null)
    );
    const injuredActive = activeFighters.filter((w) => (w.derivedStats?.hp || 0) < 30);
    if (injuredActive.length > 0) {
      list.push({
        id: 'crit_injury',
        type: 'CRITICAL',
        label: 'Critical Condition',
        description: `${injuredActive[0].name} is entering the arena with <30% health. Mortality risk is extremely high.`,
        icon: Activity,
        color: 'text-arena-blood border-arena-blood/20 bg-arena-blood/10',
      });
    }

    // ⚖️ Encumbrance Check (Heavy gear on fast style)
    const mismatchedSprints = state.roster.filter((w) => {
      const isFast = ['LUNGING ATTACK', 'SLASHING ATTACK'].includes(w.style);
      const isHeavy = (w.derivedStats?.endurance || 0) < (w.derivedStats?.encumbrance || 0);
      return isFast && isHeavy;
    });
    if (mismatchedSprints.length > 0) {
      list.push({
        id: 'encumbrance_mismatch',
        type: 'WARNING',
        label: 'Tactical Mismatch',
        description: `${mismatchedSprints[0].name} loadout exceeds endurance. High fatigue penalties will apply.`,
        icon: Zap,
        color: 'text-amber-500 border-amber-500/20 bg-amber-500/10',
      });
    }

    return list;
  }, [state]);

  if (warnings.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] w-80 space-y-3 pointer-events-none">
      <AnimatePresence>
        {warnings.map((w) => (
          <motion.div
            key={w.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className="pointer-events-auto"
          >
            <Card
              className={cn(
                'border-2 backdrop-blur-xl shadow-2xl relative overflow-hidden',
                w.color
              )}
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-current opacity-60" />
              <CardContent className="p-4 flex gap-4">
                <div className="shrink-0 mt-0.5">
                  <w.icon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                      {w.label}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[7px] font-black tracking-widest px-1 py-0 border-current opacity-40"
                    >
                      {w.type}
                    </Badge>
                  </div>
                  <p className="text-[11px] font-medium leading-relaxed opacity-90">
                    {w.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function Badge({ children, className, variant }: any) {
  return (
    <span className={cn('px-2 py-0.5 rounded text-white text-[10px] font-black', className)}>
      {children}
    </span>
  );
}
