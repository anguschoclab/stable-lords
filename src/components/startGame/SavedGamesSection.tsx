import type { SaveSlotMeta } from '@/state/saveSlots';
import SaveSlotCard from './SaveSlotCard';

interface SavedGamesSectionProps {
  slots: SaveSlotMeta[];
  maxSaveSlots: number;
  onLoad: (slotId: string) => void;
  onExport: (slotId: string) => void;
  onDelete: (slot: SaveSlotMeta) => void;
  formatDate: (iso: string) => string;
}

export default function SavedGamesSection({
  slots,
  maxSaveSlots,
  onLoad,
  onExport,
  onDelete,
  formatDate,
}: SavedGamesSectionProps) {
  if (slots.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-accent/40 font-display">
          IMPERIAL REGISTRY
        </span>
        <div
          className="flex-1 h-px"
          style={{
            background: 'linear-gradient(90deg, rgba(201,151,42,0.15), transparent)',
          }}
        />
        <span className="text-[9px] font-mono text-muted-foreground/30">
          {slots.length}/{maxSaveSlots}
        </span>
      </div>

      <div className="space-y-2">
        {slots
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .map((slot) => (
            <SaveSlotCard
              key={slot.id}
              slot={slot}
              onLoad={() => onLoad(slot.id)}
              onExport={() => {
                onExport(slot.id);
              }}
              onDelete={() => onDelete(slot)}
              formatDate={formatDate}
            />
          ))}
      </div>
    </div>
  );
}
