import { Dices } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BACKSTORY_LIST, type BackstoryId } from '@/data/backstories';

interface BackstoryPickerProps {
  value: BackstoryId | null;
  onChange: (id: BackstoryId) => void;
  onRandomize: () => void;
}

export default function BackstoryPicker({ value, onChange, onRandomize }: BackstoryPickerProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-accent/70 flex items-center gap-2">
          BACKSTORY
          <span className="text-[8px] text-muted-foreground/50 normal-case tracking-normal">
            — Who you were before
          </span>
        </label>
        <Button
          variant="outline"
          size="icon"
          type="button"
          onClick={onRandomize}
          title="Randomize backstory"
          aria-label="Randomize backstory"
          className="h-8 w-8 shrink-0 border-[rgba(60,42,22,0.8)] bg-[#0A0705] hover:border-accent/40 hover:bg-accent/5"
        >
          <Dices className="h-4 w-4 text-accent/70" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {BACKSTORY_LIST.map((b) => {
          const selected = value === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onChange(b.id)}
              title={b.lore}
              className={`p-3 text-left transition-all duration-150 border border-solid ${
                selected
                  ? 'border-accent/70 bg-accent/5'
                  : 'border-[rgba(60,42,22,0.8)] bg-[#0A0705] hover:border-accent/40 hover:bg-accent/5'
              }`}
            >
              <div className="space-y-1.5">
                <div className="text-[11px] font-black uppercase tracking-wider text-foreground leading-tight">
                  {b.name}
                </div>
                <div className="text-[9px] italic text-muted-foreground leading-snug min-h-[26px]">
                  {b.tagline}
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {b.bonusSummary.map((chip) => (
                    <span
                      key={chip}
                      className="text-[8px] font-bold uppercase tracking-wide text-accent/80 bg-accent/5 px-1.5 py-0.5 border border-solid border-accent/25"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {value && (
        <p className="text-[10px] text-muted-foreground/70 italic leading-relaxed px-1">
          {BACKSTORY_LIST.find((b) => b.id === value)?.lore}
        </p>
      )}
    </div>
  );
}
