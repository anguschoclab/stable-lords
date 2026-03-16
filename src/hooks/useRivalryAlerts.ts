/**
 * Detects rivalry intensity escalation and fires toast notifications.
 * Blood Feud level (4-5) triggers screen shake + impact SFX via Web Audio API.
 */
import { useEffect, useRef, useMemo, useCallback } from "react";
import { useGameStore } from "@/state/useGameStore";
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

/** Synthesize an impact/war-drum sound using Web Audio API */
function playImpactSFX(intensity: number) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Low rumble / war drum hit
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(intensity >= 5 ? 55 : 80, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.6, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);

    // Noise burst for attack transient
    const bufferSize = ctx.sampleRate * 0.08;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * 0.3;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(ctx.currentTime);

    // Blood feud gets a second deeper hit
    if (intensity >= 5) {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(40, ctx.currentTime + 0.15);
      osc2.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.7);
      gain2.gain.setValueAtTime(0.5, ctx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.7);
    }

    // Cleanup
    setTimeout(() => ctx.close(), 1000);
  } catch {
    // Web Audio not available — fail silently
  }
}

/** Apply screen shake + red flash to the document */
function triggerScreenShake(intensity: number) {
  const root = document.getElementById("root");
  if (!root) return;

  // Screen shake
  root.classList.add("animate-screen-shake");

  // Blood-red flash overlay
  const overlay = document.createElement("div");
  overlay.className = "fixed inset-0 pointer-events-none z-[9999] animate-blood-flash";
  overlay.style.backgroundColor = intensity >= 5
    ? "hsl(0 70% 50% / 0.2)"
    : "hsl(0 70% 50% / 0.12)";
  document.body.appendChild(overlay);

  // Cleanup
  setTimeout(() => {
    root.classList.remove("animate-screen-shake");
    overlay.remove();
  }, 800);
}

export function useRivalryAlerts() {
  const { state } = useGameStore();

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

        // Dramatic effects for Bitter (4) and Blood Feud (5)
        if (r.intensity >= 4) {
          triggerScreenShake(r.intensity);
          playImpactSFX(r.intensity);
        }

        toast({
          title: r.intensity >= 5
            ? `💀 BLOOD FEUD: ${r.stableName}`
            : `🔥 Rivalry Escalated: ${r.stableName}`,
          description: r.intensity >= 5
            ? `The hatred between your stables has reached its peak. There will be no mercy.`
            : `Your feud with ${r.stableName} has intensified to "${label}" (${r.intensity}/5)!`,
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
