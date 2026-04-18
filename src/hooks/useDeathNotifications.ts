/**
 * useDeathNotifications — mounts a single subscriber on the deathNotifier
 * fan-out and surfaces each WARRIOR_DEATH as a toast. Canonical state
 * (graveyard, newsletter obit, rival-roster removal) is still written by
 * the mortalityHandler StateImpact path; this hook is presentation-only.
 *
 * Mount once at the app-root level. The `onWarriorDeath` helper handles
 * the actual bus subscription and returns an unsubscribe for cleanup.
 */
import { useEffect } from "react";
import { toast } from "sonner";
import { onWarriorDeath } from "@/engine/deathNotifier";

export function useDeathNotifications(): void {
  useEffect(() => {
    const off = onWarriorDeath(({ name }) => {
      // Keep the message short — the obituary line landing in the newsletter
      // carries the long-form memorial copy. This toast is the "ping."
      toast(`${name} has fallen in the arena.`, {
        description: "The stands fall briefly silent.",
        duration: 6000,
      });
    });
    return off;
  }, []);
}
