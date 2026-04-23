import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface IdentityStepProps {
  ownerInput: string;
  setOwnerInput: (value: string) => void;
  stableInput: string;
  setStableInput: (value: string) => void;
  onBack: () => void;
  onSubmit: () => void;
}

export default function IdentityStep({
  ownerInput,
  setOwnerInput,
  stableInput,
  setStableInput,
  onBack,
  onSubmit,
}: IdentityStepProps) {
  return (
    <div
      className="p-7 space-y-6"
      style={{
        background: 'linear-gradient(145deg, #150F08 0%, #110C07 60%, #140E08 100%)',
        border: '1px solid rgba(60,42,22,0.9)',
        borderTopColor: 'rgba(100,70,36,0.5)',
      }}
    >
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">Establish Your Identity</h2>
        <p className="text-xs text-muted-foreground/60 mt-1 leading-relaxed">
          Your name and stable name will be recorded in the Imperial Ledger for all time.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-accent/70">
            YOUR NAME
          </label>
          <input
            type="text"
            value={ownerInput}
            onChange={(e) => setOwnerInput(e.target.value)}
            className="w-full h-10 px-3 text-sm"
            placeholder="e.g. Master Thorne"
            style={{
              background: '#0A0705',
              border: '1px solid rgba(60,42,22,0.8)',
              color: 'hsl(var(--foreground))',
              outline: 'none',
            }}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-accent/70">
            STABLE NAME
          </label>
          <input
            type="text"
            value={stableInput}
            onChange={(e) => setStableInput(e.target.value)}
            className="w-full h-10 px-3 text-sm"
            placeholder="e.g. The Iron Sentinels"
            style={{
              background: '#0A0705',
              border: '1px solid rgba(60,42,22,0.8)',
              color: 'hsl(var(--foreground))',
              outline: 'none',
            }}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <Button
          variant="outline"
          onClick={onBack}
          className="gap-2 border-[rgba(60,42,22,0.8)] bg-transparent hover:bg-white/5 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button
          disabled={!ownerInput.trim() || !stableInput.trim()}
          onClick={onSubmit}
          className="flex-1 gap-2 font-display font-bold tracking-wider uppercase"
        >
          Proceed <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
