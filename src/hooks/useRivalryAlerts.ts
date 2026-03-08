/**
 * Detects rivalry intensity escalation and fires toast notifications.
 */
import { useEffect, useRef, useMemo } from "react";
import { useGame } from "@/state/GameContext";
import { toast } from "@/hooks/use-toast";

interface RivalrySnapshot {
  stableName: string;
  intensity: number;
}

const INTENSITY_LABELS: Record<number, string> = {
  1: "Simmering",
  2: "Tense",
  3: "Heated",
  4: "Bitter",
  5: "Blood Feud",
};

export function useRivalryAlerts() {
  const { state } = useGame();

  const rosterNames = useMemo(
    () => new Set(
      state.roster.map(w => w.name).concat(state.graveyard?.map(w => w.name) ?? [])
    ),
    [state.roster, state.graveyard],
  );

  const rivalWarriorStable = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of state.rivals ?? []) {
      for (const w of r.roster) m.set(w.name, r.owner.stableName);
    }
    return m;
  }, [state.rivals]);

  const currentRivalries = useMemo((): RivalrySnapshot[] => {
    const map = new Map<string, { stableName: string; kills: number; bouts: number }>();

    for (const bout of state.arenaHistory) {
      const aIsPlayer = rosterNames.has(bout.a);
      const dIsPlayer = rosterNames.has(bout.d);
      if (!aIsPlayer && !dIsPlayer) continue;

      const rivalName = aIsPlayer ? bout.d : bout.a;
      const stable = rivalWarriorStable.get(rivalName);
      if (!stable) continue;

      if (!map.has(stable)) map.set(stable, { stableName: stable, kills: 0, bouts: 0 });
      const r = map.get(stable)!;
      r.bouts++;
      if (bout.by === "Kill" && bout.winner) r.kills++;
    }

    return [...map.values()].map(r => {
      let intensity = Math.min(r.kills * 2, 4) + (r.bouts >= 5 ? 1 : 0);
      intensity = Math.max(1, Math.min(5, intensity));
      return { stableName: r.stableName, intensity };
    });
  }, [state.arenaHistory, rosterNames, rivalWarriorStable]);

  const prevRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const prev = prevRef.current;

    for (const r of currentRivalries) {
      const oldIntensity = prev.get(r.stableName) ?? 0;
      if (r.intensity > oldIntensity && oldIntensity > 0) {
        const label = INTENSITY_LABELS[r.intensity] ?? "Escalated";
        toast({
          title: `🔥 Rivalry Escalated: ${r.stableName}`,
          description: `Your feud with ${r.stableName} has intensified to "${label}" (${r.intensity}/5)!`,
          variant: r.intensity >= 4 ? "destructive" : "default",
        });
      }
    }

    // Update snapshot
    const next = new Map<string, number>();
    for (const r of currentRivalries) next.set(r.stableName, r.intensity);
    prevRef.current = next;
  }, [currentRivalries]);
}
