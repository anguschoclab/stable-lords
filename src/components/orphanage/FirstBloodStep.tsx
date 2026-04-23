import { Button } from '@/components/ui/button';
import { Swords, ArrowLeft, ArrowRight, Skull } from 'lucide-react';
import type { Warrior, FightSummary } from '@/types/game';
import { STYLE_DISPLAY_NAMES, FightingStyle } from '@/types/game';

interface FirstBloodStepProps {
  boutResult: {
    a: Warrior;
    d: Warrior;
    outcome: {
      winner: 'A' | 'D' | null;
      by: string | null;
      post?: { tags?: string[] };
    };
    summary: FightSummary;
  };
  onBack: () => void;
  onNext: () => void;
}

export default function FirstBloodStep({ boutResult, onBack, onNext }: FirstBloodStepProps) {
  return (
    <div className="space-y-4">
      <div
        className="p-7 space-y-6"
        style={{
          background: 'linear-gradient(145deg, #150F08 0%, #110C07 100%)',
          border: '1px solid rgba(135,34,40,0.4)',
          borderTopColor: 'rgba(200,80,88,0.3)',
        }}
      >
        <div
          className="absolute top-0 left-6 right-6 h-0.5 pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, transparent, hsl(var(--primary)/0.7) 30%, hsl(var(--primary)) 50%, hsl(var(--primary)/0.7) 70%, transparent)',
          }}
        />

        <div>
          <h2 className="font-display text-xl font-bold text-foreground">First Blood</h2>
          <p className="text-xs text-muted-foreground/50 mt-0.5">
            The arena witnessed the first trial
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 py-4">
          <div className="text-center">
            <span className="font-display font-bold text-base text-foreground">
              {boutResult.a.name}
            </span>
            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 mt-0.5">
              {STYLE_DISPLAY_NAMES[boutResult.a.style as FightingStyle] || boutResult.a.style}
            </div>
          </div>

          <div className="flex flex-col items-center gap-1">
            <Swords className="h-5 w-5 text-muted-foreground/30" />
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30">
              vs
            </span>
          </div>

          <div className="text-center">
            <span className="font-display font-bold text-base text-foreground">
              {boutResult.d.name}
            </span>
            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 mt-0.5">
              {STYLE_DISPLAY_NAMES[boutResult.d.style as FightingStyle] || boutResult.d.style}
            </div>
          </div>
        </div>

        <div
          className="p-4 text-center"
          style={{
            background:
              boutResult.outcome.by === 'Kill' ? 'rgba(135,34,40,0.12)' : 'rgba(201,151,42,0.06)',
            border: `1px solid ${
              boutResult.outcome.by === 'Kill' ? 'rgba(135,34,40,0.4)' : 'rgba(201,151,42,0.25)'
            }`,
          }}
        >
          {boutResult.outcome.winner ? (
            <div>
              <div
                className="font-display font-black text-lg uppercase tracking-wide"
                style={{
                  color:
                    boutResult.outcome.by === 'Kill'
                      ? 'hsl(var(--arena-blood))'
                      : 'hsl(var(--arena-gold))',
                  textShadow:
                    boutResult.outcome.by === 'Kill'
                      ? '0 0 12px hsl(var(--arena-blood)/0.5)'
                      : '0 0 12px hsl(var(--arena-gold)/0.4)',
                }}
              >
                {boutResult.outcome.winner === 'A' ? boutResult.a.name : boutResult.d.name}{' '}
                victorious
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-1">
                by {boutResult.outcome.by ?? 'decision'}
                {boutResult.outcome.by === 'Kill' && (
                  <Skull className="h-3 w-3 inline ml-1.5 text-destructive/70" />
                )}
              </div>
            </div>
          ) : (
            <div className="font-display font-black text-lg uppercase tracking-wide text-muted-foreground">
              Draw
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="gap-2 border-[rgba(60,42,22,0.8)] bg-transparent hover:bg-white/5 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button
          onClick={onNext}
          className="flex-1 gap-2 font-display font-bold tracking-wider uppercase"
        >
          Continue <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
