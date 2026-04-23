import { Shield, Clock, Download, Trash2 } from 'lucide-react';
import type { SaveSlotMeta } from '@/state/saveSlots';

interface SaveSlotCardProps {
  slot: SaveSlotMeta;
  onLoad: () => void;
  onExport: () => void;
  onDelete: () => void;
  formatDate: (iso: string) => string;
}

export default function SaveSlotCard({
  slot,
  onLoad,
  onExport,
  onDelete,
  formatDate,
}: SaveSlotCardProps) {
  return (
    <div
      onClick={onLoad}
      className="group relative cursor-pointer transition-all duration-200"
      style={{
        background: 'linear-gradient(145deg, #150F08 0%, #110C07 50%, #140E08 100%)',
        border: '1px solid rgba(60, 42, 22, 0.8)',
        borderTopColor: 'rgba(100, 70, 36, 0.45)',
        borderLeftColor: 'rgba(80, 56, 28, 0.4)',
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[linear-gradient(90deg,transparent_0%,rgba(201,151,42,0.5)_30%,rgba(201,151,42,0.8)_50%,rgba(201,151,42,0.5)_70%,transparent_100%)]" />
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="shrink-0 flex items-center justify-center w-9 h-9"
            style={{
              background:
                'linear-gradient(135deg, rgba(201,151,42,0.12) 0%, rgba(201,151,42,0.04) 100%)',
              border: '1px solid rgba(201, 151, 42, 0.25)',
            }}
          >
            <Shield className="h-4 w-4 text-accent" />
          </div>

          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="font-display font-bold text-sm text-foreground truncate">
              {slot.name}
            </span>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground font-mono">
              <span>
                WK {slot.week} · YR {slot.year}
              </span>
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
            onClick={(e) => {
              e.stopPropagation();
              onExport();
            }}
            title="Export save"
            aria-label={`Export save for ${slot.name}`}
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          <button
            className="p-1.5 text-muted-foreground/40 hover:text-destructive transition-colors duration-150"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
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
