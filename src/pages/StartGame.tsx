/**
 * Stable Lords — Start Game Page (Title Screen)
 * New Game → name stable → Orphanage | Continue | Load | Delete saves
 */
import React, { useState, useCallback, useMemo, useRef } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Swords,
  Plus,
  Play,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Shield,
  Clock,
  Users,
  Flame,
  Download,
  Upload,
  Dices,
} from "lucide-react";
import { toast } from "sonner";
import { randomOwnerName, randomStableName } from "@/data/randomNames";

type Screen = "title" | "newGame";

export default function StartGame() {
  const { loadGame } = useGameStore();
  const [screen, setScreen] = useState<Screen>("title");
  const [slots, setSlots] = useState<SaveSlotMeta[]>(() => listSaveSlots());
  const [deleteTarget, setDeleteTarget] = useState<SaveSlotMeta | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  // ── New Game fields ──────────────────────────────────────────────────────
  const [ownerName, setOwnerName] = useState("");
  const [stableName, setStableName] = useState("");
  const canCreate = ownerName.trim().length >= 2 && stableName.trim().length >= 2;

  const refreshSlots = useCallback(() => setSlots(listSaveSlots()), []);

  // ── Continue: load the most recent save ──────────────────────────────────
  const mostRecent = useMemo(
    // ⚡ Bolt: Reduced O(N log N) sort + spread to O(N) linear reduction for single max value
    () => (slots.length > 0 ? slots.reduce((latest, current) =>
      new Date(current.timestamp).getTime() > new Date(latest.timestamp).getTime() ? current : latest
    , slots[0]) : null),
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
    // Deterministic starting state for 1.0 hub stability
    const fresh = createFreshState("alpha-prime-10");
    fresh.player.name = ownerName.trim();
    fresh.player.stableName = stableName.trim();
    const slotId = newSlotId();
    saveToSlot(slotId, fresh.player.stableName, fresh);
    loadGame(slotId, fresh);
  }, [ownerName, stableName, loadGame]);

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
        // Auto-load the imported save
        const state = await loadFromSlot(slotId);
        if (state) loadGame(slotId, state);
      } catch (err) {
        toast.error((err as Error)?.message ?? "Failed to import save file.");
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be re-imported
    e.target.value = "";
  }, [loadGame, refreshSlots]);

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch { return iso; }
  };

  // ── New Game Screen ──────────────────────────────────────────────────────
  if (screen === "newGame") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-6">
          <Button variant="ghost" size="sm" onClick={() => setScreen("title")} className="gap-1.5 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>

          <Card className="border-primary/30">
            <CardContent className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <Swords className="h-10 w-10 mx-auto text-primary" />
                <h2 className="text-2xl font-display font-bold">Forge Your Stable</h2>
                <p className="text-muted-foreground text-sm">
                  The orphanage doors creak open. Beyond them lies the roar of the crowd, the clash of steel,
                  and a chance to forge legends.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="owner-name" className="text-sm font-medium">Your Name</label>
                  <div className="flex gap-1.5">
                    <Input
                      id="owner-name"
                      placeholder="Enter your name"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      maxLength={24}
                      autoFocus
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      type="button"
                      onClick={() => setOwnerName(randomOwnerName())}
                      title="Random name"
                      aria-label="Randomize your name"
                      className="shrink-0"
                    >
                      <Dices className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="stable-name" className="text-sm font-medium">Stable Name</label>
                  <div className="flex gap-1.5">
                    <Input
                      id="stable-name"
                      placeholder="e.g. The Iron Wolves, House of Blades"
                      value={stableName}
                      onChange={(e) => setStableName(e.target.value)}
                      maxLength={30}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      type="button"
                      onClick={() => setStableName(randomStableName())}
                      title="Random name"
                      aria-label="Randomize stable name"
                      className="shrink-0"
                    >
                      <Dices className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <Button onClick={handleNewGame} disabled={!canCreate} className="w-full gap-2" size="lg">
                Enter the Orphanage <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Title Screen ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">
        {/* Logo / Title */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Swords className="h-10 w-10 text-accent" />
          </div>
          <h1 className="text-5xl font-display font-bold tracking-wide text-foreground">
            Stable Lords
          </h1>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Build a stable. Train warriors. Fight for glory. Forge legends in the arena.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {mostRecent && (
            <Button
              onClick={() => loadSlot(mostRecent.id)}
              className="w-full gap-2 h-14 text-base"
              size="lg"
            >
              <Play className="h-5 w-5" />
              Continue — {mostRecent.name}
            </Button>
          )}

          {/* New Game */}
          <Button
            onClick={() => setScreen("newGame")}
            variant={mostRecent ? "outline" : "default"}
            className={`w-full gap-2 ${mostRecent ? "h-12" : "h-14 text-base"}`}
            size="lg"
            disabled={slots.length >= MAX_SAVE_SLOTS}
          >
            <Plus className="h-5 w-5" />
            New Game
            {slots.length >= MAX_SAVE_SLOTS && (
              <span className="text-xs text-muted-foreground ml-2">(Max {MAX_SAVE_SLOTS} saves)</span>
            )}
          </Button>
          {/* Import Save */}
          <input
            ref={importRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
          <Button
            variant="ghost"
            onClick={() => importRef.current?.click()}
            className="w-full gap-2 h-10 text-muted-foreground"
            size="sm"
          >
            <Upload className="h-4 w-4" />
            Import Save File
          </Button>
        </div>

        {/* Save Slots */}
        {slots.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Saved Games
            </h3>
            {slots
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .map((slot) => (
                <Card
                  key={slot.id}
                  className="cursor-pointer transition-all hover:border-primary/40"
                  onClick={() => loadSlot(slot.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-accent" />
                          <span className="font-display font-bold">{slot.name}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>Wk {slot.week} · Yr {slot.year}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {formatDate(slot.timestamp)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            exportSlot(slot.id);
                            toast.success("Save exported!");
                          }}
                          title="Export save"
                          aria-label={`Export save for ${slot.name}`}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(slot);
                          }}
                          title="Delete save"
                          aria-label={`Delete save for ${slot.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Stable Lords v2.0 — Saves stored locally in your browser
        </p>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Delete Save?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the save for <strong>{deleteTarget?.name}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
