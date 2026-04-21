/**
 * Stable Lords — Start Game Page (Title Screen)
 * Codex Sanguis design: Roman Imperial Archive aesthetic
 * New Game → name stable → Orphanage | Continue | Load | Delete saves
 */
import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useGameStore } from "@/state/useGameStore";
import { createFreshState } from "@/engine/factories";
import {
  listSaveSlots,
  loadFromSlot,
  deleteSlot,
  saveToSlot,
  newSlotId,
  MAX_SAVE_SLOTS,
  exportSlot,
  importSaveToNewSlot,
  type SaveSlotMeta,
} from "@/state/saveSlots";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { generateCrest } from "@/engine/crest/crestGenerator";
import type { CrestData } from "@/types/crest.types";
import { applyBackstoryToPlayer, type BackstoryId } from "@/data/backstories";
import { runRankingsPass } from "@/engine/pipeline/passes/RankingsPass";
import { runPromoterPass } from "@/engine/pipeline/passes/PromoterPass";
import { resolveImpacts } from "@/engine/impacts";
import { SeededRNGService } from "@/engine/core/rng/SeededRNGService";
import ColomseumArch from "@/components/startGame/ColomseumArch";
import NewGameForm from "@/components/startGame/NewGameForm";
import TitleScreenHero from "@/components/startGame/TitleScreenHero";
import ActionButtons from "@/components/startGame/ActionButtons";
import SavedGamesSection from "@/components/startGame/SavedGamesSection";

type Screen = "title" | "newGame";

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StartGame() {
  const { loadGame } = useGameStore();
  const [screen, setScreen] = useState<Screen>("title");
  const [slots, setSlots] = useState<SaveSlotMeta[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<SaveSlotMeta | null>(null);
  const [ownerName, setOwnerName] = useState("");
  const [stableName, setStableName] = useState("");
  
  const [playerCrest, setPlayerCrest] = useState<CrestData>(() =>
    generateCrest({ seed: Math.floor(Math.random() * 100000), philosophy: "Balanced", tier: "Established" })
  );

  const [backstoryId, setBackstoryId] = useState<BackstoryId | null>(null);

  const canCreate = ownerName.trim().length >= 2 && stableName.trim().length >= 2 && backstoryId != null;
  
  const refreshSlots = useCallback(async () => {
    const savedSlots = await listSaveSlots();
    setSlots(savedSlots);
  }, []);
  
  useEffect(() => {
    refreshSlots();
  }, [refreshSlots]);

  const mostRecent = useMemo(
    () =>
      slots.length > 0
        ? slots.reduce((latest, current) =>
            current.timestamp > latest.timestamp ? current : latest
          )
        : null,
    [slots]
  );

  const loadSlot = useCallback(
    async (slotId: string) => {
      const state = await loadFromSlot(slotId);
      if (state) loadGame(slotId, state);
    },
    [loadGame]
  );

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteSlot(deleteTarget.id);
    refreshSlots();
    setDeleteTarget(null);
  }, [deleteTarget, refreshSlots]);

  const handleNewGame = useCallback(() => {
    if (!backstoryId) return;
    let fresh = createFreshState("alpha-prime-10");
    fresh.player.name = ownerName.trim();
    fresh.player.stableName = stableName.trim();
    fresh.player.crest = playerCrest; // 🛡️ Store the selected heraldic crest
    fresh.player.generation = 0; // Player is the original founder
    const slotId = newSlotId();
    const identitySeed = slotId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    applyBackstoryToPlayer(fresh, backstoryId, new SeededRNGService(identitySeed));
    // Seed initial rankings and bout offers so Booking Office is populated from day 1
    fresh = resolveImpacts(fresh, [runRankingsPass(fresh), runPromoterPass(fresh)]);
    saveToSlot(slotId, fresh.player.stableName, fresh);
    loadGame(slotId, fresh);
  }, [ownerName, stableName, playerCrest, backstoryId, loadGame]);

  const handleImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const json = ev.target?.result as string;
          const slotId = await importSaveToNewSlot(json);
          if (!slotId) throw new Error("Import failed");
          refreshSlots();
          toast.success("Save imported! Loading now…");
          const state = await loadFromSlot(slotId);
          if (state) loadGame(slotId, state);
        } catch (err) {
          toast.error((err as Error)?.message ?? "Failed to import save file.");
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [loadGame, refreshSlots]
  );

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  // ── New Game Screen ────────────────────────────────────────────────────────

  if (screen === "newGame") {
    return (
      <NewGameForm
        ownerName={ownerName}
        setOwnerName={setOwnerName}
        stableName={stableName}
        setStableName={setStableName}
        playerCrest={playerCrest}
        setPlayerCrest={setPlayerCrest}
        backstoryId={backstoryId}
        setBackstoryId={setBackstoryId}
        onBack={() => setScreen("title")}
        onSubmit={handleNewGame}
        canCreate={canCreate}
      />
    );
  }

  // ── Title Screen ──────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "#0C0806" }}
    >
      <ColomseumArch />

      <div className="relative z-10 w-full max-w-md space-y-10">
        <TitleScreenHero />

        <ActionButtons
          mostRecent={mostRecent}
          slots={slots}
          maxSaveSlots={MAX_SAVE_SLOTS}
          onContinue={() => mostRecent && loadSlot(mostRecent.id)}
          onNewGame={() => setScreen("newGame")}
          onImport={handleImport}
        />

        <SavedGamesSection
          slots={slots}
          maxSaveSlots={MAX_SAVE_SLOTS}
          onLoad={(slotId) => loadSlot(slotId)}
          onExport={(slotId) => {
            exportSlot(slotId);
            toast.success("Save exported!");
          }}
          onDelete={(slot) => setDeleteTarget(slot)}
          formatDate={formatDate}
        />

        {/* ── Footer ── */}
        <div className="text-center space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground/25">
            Stable Lords v2.0
          </p>
          <p className="text-[8px] text-muted-foreground/20 italic">
            All records stored in the Imperial Registry
          </p>
        </div>
      </div>

      {/* ── Delete Confirmation ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent
          style={{
            background: "#150F08",
            border: "1px solid rgba(60,42,22,0.9)",
            borderTopColor: "rgba(100,70,36,0.5)",
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-lg">
              Erase this Record?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm">
              The save for{" "}
              <strong className="text-foreground">{deleteTarget?.name}</strong>{" "}
              will be permanently expunged from the Imperial Registry. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[rgba(60,42,22,0.8)] bg-transparent hover:bg-white/5 text-muted-foreground">
              Preserve
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Expunge Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
