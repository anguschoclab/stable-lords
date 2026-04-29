import { useState, useMemo } from 'react';
import type { RivalStableData } from '@/types/game';
import { calculateStableStats } from '@/engine/stats/stableStats';
import { useGameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { PERSONALITY_CLASH, PHILOSOPHY_PLAN_MODS } from '@/data/ownerData';

export function stableStats(rival: RivalStableData) {
  const stats = calculateStableStats(rival.roster);
  return {
    ...stats,
    rosterSize: stats.activeCount,
    avgAttrs: stats.avgAttributes,
  };
}

export function useStableComparison(rivals: RivalStableData[]) {
  const [idA, setIdA] = useState<string | null>(null);
  const [idB, setIdB] = useState<string | null>(null);
  const ownerGrudges = useGameStore(useShallow((s) => s.ownerGrudges ?? []));

  const rivalA = useMemo(() => rivals.find((r) => r.owner.id === idA), [rivals, idA]);
  const rivalB = useMemo(() => rivals.find((r) => r.owner.id === idB), [rivals, idB]);

  const statsA = useMemo(() => (rivalA ? stableStats(rivalA) : null), [rivalA]);
  const statsB = useMemo(() => (rivalB ? stableStats(rivalB) : null), [rivalB]);

  const grudge = useMemo(() => {
    if (!rivalA || !rivalB) return null;
    return ownerGrudges.find(
      (g) =>
        (g.ownerIdA === rivalA.owner.id && g.ownerIdB === rivalB.owner.id) ||
        (g.ownerIdA === rivalB.owner.id && g.ownerIdB === rivalA.owner.id)
    );
  }, [ownerGrudges, rivalA, rivalB]);

  const clashes = useMemo(() => {
    if (!rivalA || !rivalB) return false;
    return (
      (
        PERSONALITY_CLASH[rivalA.owner.personality as keyof typeof PERSONALITY_CLASH] ?? []
      ).includes(rivalB.owner.personality as never) ||
      (
        PERSONALITY_CLASH[rivalB.owner.personality as keyof typeof PERSONALITY_CLASH] ?? []
      ).includes(rivalA.owner.personality as never)
    );
  }, [rivalA, rivalB]);

  const modsA = useMemo(
    () => (rivalA?.philosophy ? (PHILOSOPHY_PLAN_MODS[rivalA.philosophy] ?? {}) : {}),
    [rivalA]
  );
  const modsB = useMemo(
    () => (rivalB?.philosophy ? (PHILOSOPHY_PLAN_MODS[rivalB.philosophy] ?? {}) : {}),
    [rivalB]
  );

  const maxWins = Math.max(statsA?.totalWins ?? 0, statsB?.totalWins ?? 0, 1);
  const maxKills = Math.max(statsA?.totalKills ?? 0, statsB?.totalKills ?? 0, 1);
  const maxFame = Math.max(statsA?.totalFame ?? 0, statsB?.totalFame ?? 0, 1);
  const maxRoster = Math.max(statsA?.rosterSize ?? 0, statsB?.rosterSize ?? 0, 1);
  const maxAttr = 25;

  return {
    idA,
    setIdA,
    idB,
    setIdB,
    rivalA,
    rivalB,
    statsA,
    statsB,
    grudge,
    clashes,
    modsA,
    modsB,
    maxWins,
    maxKills,
    maxFame,
    maxRoster,
    maxAttr,
  };
}
