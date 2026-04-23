import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Play, Upload } from "lucide-react";
import type { SaveSlotMeta } from "@/state/saveSlots";

interface ActionButtonsProps {
  mostRecent: SaveSlotMeta | null;
  slots: SaveSlotMeta[];
  maxSaveSlots: number;
  onContinue: () => void;
  onNewGame: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ActionButtons({
  mostRecent,
  slots,
  maxSaveSlots,
  onContinue,
  onNewGame,
  onImport,
}: ActionButtonsProps) {
  const importRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2.5">
      {mostRecent && (
        <Button
          onClick={onContinue}
          className="w-full h-14 gap-3 text-sm font-display font-bold tracking-wider uppercase"
          size="lg"
        >
          <Play className="h-5 w-5 fill-current" />
          Continue — {mostRecent.name.toUpperCase()}
        </Button>
      )}

      <Button
        onClick={onNewGame}
        variant={mostRecent ? "outline" : "default"}
        className={`w-full gap-2 font-display font-bold tracking-wider uppercase ${
          mostRecent
            ? "h-11 text-sm border-[rgba(60,42,22,0.9)] hover:border-accent/40 bg-transparent hover:bg-accent/5 text-foreground/80 hover:text-accent"
            : "h-14 text-sm"
        }`}
        size="lg"
        disabled={slots.length >= maxSaveSlots}
      >
        <Plus className="h-4 w-4" />
        NEW GAME
        {slots.length >= maxSaveSlots && (
          <span className="text-xs text-muted-foreground ml-2">
            (Max {maxSaveSlots} saves)
          </span>
        )}
      </Button>

      <button
        onClick={() => importRef.current?.click()}
        aria-label="Import Save File"
        className="w-full flex items-center justify-center gap-2 h-9 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors duration-150"
      >
        <Upload className="h-3.5 w-3.5" />
        IMPORT SAVE FILE
      </button>
      <input
        ref={importRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={onImport}
      />
    </div>
  );
}
