/**
 * Stable Lords — Start Game Page (Title Screen)
 * Codex Sanguis design: Roman Imperial Archive aesthetic
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Download,
  Upload,
  Dices,
  Flame,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { randomOwnerName, randomStableName } from "@/data/randomNames";

type Screen = "title" | "newGame";

// ─── Decorative Arch Component ────────────────────────────────────────────────

function ColomseumArch() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
      {/* Upper left torch glow — animated warm amber */}
      <div
        className="absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-60 torch-flicker"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(200, 140, 20, 0.18) 0%, rgba(180, 100, 10, 0.08) 50%, transparent 70%)",
        }}
      />
      {/* Upper right torch */}
      <div
        className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-40 torch-flicker"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(200, 130, 20, 0.14) 0%, transparent 70%)",
          animationDelay: "1.4s",
        }}
      />
      {/* Lower center blood warmth */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-48 opacity-25"
        style={{
          background:
            "radial-gradient(ellipse at center bottom, rgba(135, 34, 40, 0.3) 0%, transparent 70%)",
        }}
      />
      {/* Decorative horizontal ornament — top */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(201, 151, 42, 0.25) 30%, rgba(201, 151, 42, 0.5) 50%, rgba(201, 151, 42, 0.25) 70%, transparent 100%)",
        }}
      />
      {/* Decorative horizontal ornament — bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(201, 151, 42, 0.15) 30%, rgba(201, 151, 42, 0.3) 50%, rgba(201, 151, 42, 0.15) 70%, transparent 100%)",
        }}
      />
    </div>
  );
}

// ─── Wax Seal Component ────────────────────────────────────────────────────────

function WaxSeal() {
  return (
    <div
      className="relative flex items-center justify-center w-20 h-20 mx-auto"
      aria-hidden="true"
    >
      {/* Outer ring — aged bronze */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "conic-gradient(from 0deg, rgba(201, 151, 42, 0.5), rgba(201, 151, 42, 0.15), rgba(201, 151, 42, 0.5), rgba(201, 151, 42, 0.15), rgba(201, 151, 42, 0.5))",
          padding: "1px",
        }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{ background: "#0C0806" }}
        />
      </div>
      {/* Inner seal — blood crimson wax */}
      <div
        className="relative z-10 flex items-center justify-center w-14 h-14 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at 35% 35%, rgba(160, 40, 48, 0.95) 0%, #872228 55%, rgba(100, 20, 26, 0.9) 100%)",
          boxShadow:
            "0 4px 16px rgba(135, 34, 40, 0.5), inset 0 1px 0 rgba(255, 200, 200, 0.15), inset 0 -1px 0 rgba(0,0,0,0.3)",
        }}
      >
        <Swords className="h-6 w-6 text-[#F2D5B8]" strokeWidth={1.5} />
      </div>
      {/* Tiny star ornaments around ring */}
      {[0, 72, 144, 216, 288].map((deg) => (
        <div
          key={deg}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: "rgba(201, 151, 42, 0.6)",
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -50%) rotate(${deg}deg) translateX(36px)`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Save Slot Card — Stone Tablet aesthetic ──────────────────────────────────

function SaveSlotCard({
  slot,
  onLoad,
  onExport,
  onDelete,
  formatDate,
}: {
  slot: SaveSlotMeta;
  onLoad: () => void;
  onExport: () => void;
  onDelete: () => void;
  formatDate: (iso: string) => string;
}) {
  return (
    <div
      onClick={onLoad}
      className="group relative cursor-pointer transition-all duration-200"
      style={{
        background:
          "linear-gradient(145deg, #150F08 0%, #110C07 50%, #140E08 100%)",
        border: "1px solid rgba(60, 42, 22, 0.8)",
        borderTopColor: "rgba(100, 70, 36, 0.45)",
        borderLeftColor: "rgba(80, 56, 28, 0.4)",
      }}
    >
      {/* Top ornament line — becomes more visible on hover */}
      <div
        className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(201, 151, 42, 0.5) 30%, rgba(201, 151, 42, 0.8) 50%, rgba(201, 151, 42, 0.5) 70%, transparent 100%)",
        }}
      />
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Stable shield icon */}
          <div
            className="shrink-0 flex items-center justify-center w-9 h-9"
            style={{
              background:
                "linear-gradient(135deg, rgba(201,151,42,0.12) 0%, rgba(201,151,42,0.04) 100%)",
              border: "1px solid rgba(201, 151, 42, 0.25)",
            }}
          >
            <Shield className="h-4 w-4 text-accent" />
          </div>

          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="font-display font-bold text-sm text-foreground truncate">
              {slot.name}
            </span>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground font-mono">
              <span>WK {slot.week} · YR {slot.year}</span>
              <span className="flex items-center gap-1 opacity-60">
                <Clock className="h-2.5 w-2.5" />
                {formatDate(slot.timestamp)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <button
            className="p-1.5 text-muted-foreground/40 hover:text-accent transition-colors duration-150"
            onClick={(e) => { e.stopPropagation(); onExport(); }}
            title="Export save"
            aria-label={`Export save for ${slot.name}`}
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          <button
            className="p-1.5 text-muted-foreground/40 hover:text-destructive transition-colors duration-150"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="Delete save"
            aria-label={`Delete save for ${slot.name}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StartGame() {
  const { loadGame } = useGameStore();
  const [screen, setScreen] = useState<Screen>("title");
  const [slots, setSlots] = useState<SaveSlotMeta[]>(() => listSaveSlots());
  const [deleteTarget, setDeleteTarget] = useState<SaveSlotMeta | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const [ownerName, setOwnerName] = useState("");
  const [stableName, setStableName] = useState("");
  const canCreate = ownerName.trim().length >= 2 && stableName.trim().length >= 2;

  const refreshSlots = useCallback(() => setSlots(listSaveSlots()), []);

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
    const fresh = createFreshState("alpha-prime-10");
    fresh.player.name = ownerName.trim();
    fresh.player.stableName = stableName.trim();
    const slotId = newSlotId();
    saveToSlot(slotId, fresh.player.stableName, fresh);
    loadGame(slotId, fresh);
  }, [ownerName, stableName, loadGame]);

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
      <div
        className="min-h-screen flex items-center justify-center p-4 relative"
        style={{ background: "#0C0806" }}
      >
        <ColomseumArch />

        <div className="relative z-10 w-full max-w-md space-y-6">
          <button
            onClick={() => setScreen("title")}
            className="flex items-center gap-2 text-muted-foreground/60 hover:text-accent text-[11px] font-black uppercase tracking-widest transition-colors duration-150"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Return to Title
          </button>

          {/* Card */}
          <div
            className="relative p-8 space-y-7"
            style={{
              background:
                "linear-gradient(145deg, #150F08 0%, #110C07 60%, #140E08 100%)",
              border: "1px solid rgba(60, 42, 22, 0.9)",
              borderTopColor: "rgba(100, 70, 36, 0.55)",
              borderLeftColor: "rgba(80, 56, 28, 0.5)",
            }}
          >
            {/* Ornament top */}
            <div
              className="absolute top-0 left-6 right-6 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(201,151,42,0.5) 30%, rgba(201,151,42,0.8) 50%, rgba(201,151,42,0.5) 70%, transparent)",
              }}
            />

            {/* Header */}
            <div className="text-center space-y-4">
              <WaxSeal />
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground">
                  Forge Your Stable
                </h2>
                <p className="text-muted-foreground text-xs mt-2 leading-relaxed max-w-[280px] mx-auto">
                  The orphanage doors creak open. Beyond them lies the roar of
                  the crowd, the clash of steel, and a chance to forge legends.
                </p>
              </div>
            </div>

            {/* Divider */}
            <div
              className="h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(201,151,42,0.2) 40%, rgba(201,151,42,0.2) 60%, transparent)",
              }}
            />

            {/* Form fields */}
            <div className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="owner-name"
                  className="text-[10px] font-black uppercase tracking-[0.3em] text-accent/70"
                >
                  Your Name
                </label>
                <div className="flex gap-2">
                  <Input
                    id="owner-name"
                    placeholder="e.g. Master Thorne"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    maxLength={24}
                    autoFocus
                    className="flex-1 h-10 text-sm bg-[#0A0705] border-[rgba(60,42,22,0.8)] focus:border-accent/40 focus:ring-accent/20"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    onClick={() => setOwnerName(randomOwnerName())}
                    title="Random name"
                    aria-label="Randomize your name"
                    className="h-10 w-10 shrink-0 border-[rgba(60,42,22,0.8)] bg-[#0A0705] hover:border-accent/40 hover:bg-accent/5"
                  >
                    <Dices className="h-4 w-4 text-accent/70" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="stable-name"
                  className="text-[10px] font-black uppercase tracking-[0.3em] text-accent/70"
                >
                  Stable Name
                </label>
                <div className="flex gap-2">
                  <Input
                    id="stable-name"
                    placeholder="e.g. The Iron Wolves"
                    value={stableName}
                    onChange={(e) => setStableName(e.target.value)}
                    maxLength={30}
                    className="flex-1 h-10 text-sm bg-[#0A0705] border-[rgba(60,42,22,0.8)] focus:border-accent/40 focus:ring-accent/20"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    onClick={() => setStableName(randomStableName())}
                    title="Random name"
                    aria-label="Randomize stable name"
                    className="h-10 w-10 shrink-0 border-[rgba(60,42,22,0.8)] bg-[#0A0705] hover:border-accent/40 hover:bg-accent/5"
                  >
                    <Dices className="h-4 w-4 text-accent/70" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Submit */}
            <Button
              onClick={handleNewGame}
              disabled={!canCreate}
              className="w-full h-12 gap-2 font-display font-bold text-sm tracking-wider uppercase"
              size="lg"
            >
              Enter the Orphanage
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Title Screen ──────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "#0C0806" }}
    >
      <ColomseumArch />

      {/* Main layout */}
      <div className="relative z-10 w-full max-w-md space-y-10">

        {/* ── Hero Logo Section ── */}
        <div className="text-center space-y-5">
          <WaxSeal />

          {/* Title */}
          <div className="space-y-2">
            <h1
              className="text-5xl sm:text-6xl font-display font-black tracking-[0.06em] uppercase"
              style={{
                color: "#E7D3AF",
                textShadow:
                  "0 2px 12px rgba(0,0,0,0.9), 0 1px 0 rgba(0,0,0,0.95), 0 0 30px rgba(201,151,42,0.15)",
              }}
            >
              Stable Lords
            </h1>
            <p className="text-xs text-muted-foreground italic leading-relaxed max-w-[240px] mx-auto opacity-70">
              Build a stable. Train warriors. Fight for glory. Forge legends in
              the arena.
            </p>
          </div>

          {/* Ornamental rule under title */}
          <div className="flex items-center gap-3 px-4">
            <div
              className="flex-1 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(201,151,42,0.3))",
              }}
            />
            <div className="flex items-center gap-1.5">
              <div
                className="w-1 h-1"
                style={{ background: "rgba(201,151,42,0.5)" }}
              />
              <Star
                className="h-2.5 w-2.5"
                style={{ color: "rgba(201,151,42,0.5)" }}
              />
              <div
                className="w-1 h-1"
                style={{ background: "rgba(201,151,42,0.5)" }}
              />
            </div>
            <div
              className="flex-1 h-px"
              style={{
                background:
                  "linear-gradient(90deg, rgba(201,151,42,0.3), transparent)",
              }}
            />
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="space-y-2.5">
          {/* CONTINUE — most prominent */}
          {mostRecent && (
            <Button
              onClick={() => loadSlot(mostRecent.id)}
              className="w-full h-14 gap-3 text-sm font-display font-bold tracking-wider uppercase"
              size="lg"
            >
              <Play className="h-5 w-5 fill-current" />
              Continue — {mostRecent.name}
            </Button>
          )}

          {/* NEW GAME */}
          <Button
            onClick={() => setScreen("newGame")}
            variant={mostRecent ? "outline" : "default"}
            className={`w-full gap-2 font-display font-bold tracking-wider uppercase ${
              mostRecent
                ? "h-11 text-sm border-[rgba(60,42,22,0.9)] hover:border-accent/40 bg-transparent hover:bg-accent/5 text-foreground/80 hover:text-accent"
                : "h-14 text-sm"
            }`}
            size="lg"
            disabled={slots.length >= MAX_SAVE_SLOTS}
          >
            <Plus className="h-4 w-4" />
            New Game
            {slots.length >= MAX_SAVE_SLOTS && (
              <span className="text-xs text-muted-foreground ml-2">
                (Max {MAX_SAVE_SLOTS} saves)
              </span>
            )}
          </Button>

          {/* Import */}
          <input
            ref={importRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
          <button
            onClick={() => importRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 h-9 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors duration-150"
          >
            <Upload className="h-3.5 w-3.5" />
            Import Save File
          </button>
        </div>

        {/* ── Saved Games ── */}
        {slots.length > 0 && (
          <div className="space-y-3">
            {/* Section label */}
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-accent/40 font-display">
                Imperial Registry
              </span>
              <div
                className="flex-1 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(201,151,42,0.15), transparent)",
                }}
              />
              <span className="text-[9px] font-mono text-muted-foreground/30">
                {slots.length}/{MAX_SAVE_SLOTS}
              </span>
            </div>

            {/* Slot cards */}
            <div className="space-y-2">
              {slots
                .sort(
                  (a, b) =>
                    new Date(b.timestamp).getTime() -
                    new Date(a.timestamp).getTime()
                )
                .map((slot) => (
                  <SaveSlotCard
                    key={slot.id}
                    slot={slot}
                    onLoad={() => loadSlot(slot.id)}
                    onExport={() => {
                      exportSlot(slot.id);
                      toast.success("Save exported!");
                    }}
                    onDelete={() => setDeleteTarget(slot)}
                    formatDate={formatDate}
                  />
                ))}
            </div>
          </div>
        )}

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
