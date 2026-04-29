import { useMemo } from 'react';
import { useGameStore, useWorldState } from '@/state/useGameStore';
import { motion } from 'framer-motion';
import { Skull, Scroll, HeartOff, Crosshair } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaperDoll } from '@/components/ui/PaperDoll';

export function DeathModal() {
  const state = useWorldState();
  const acknowledgeDeathAction = useGameStore((s) => s.acknowledgeDeath);

  const { unacknowledgedDeaths, graveyard } = state;
  const acknowledgeDeath = (id: any) => acknowledgeDeathAction(id);

  const currentDeathId = unacknowledgedDeaths[0];
  const warrior = useMemo(
    () => graveyard.find((w) => w.id === currentDeathId),
    [graveyard, currentDeathId]
  );

  if (!warrior) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-[#0a0a0b] border-2 border-arena-blood/30 rounded-none shadow-[0_0_50px_rgba(var(--arena-blood-rgb),0.2)] overflow-hidden relative"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-arena-blood to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-arena-blood to-transparent" />

        <div className="p-8 space-y-8">
          <header className="text-center space-y-4">
            <motion.div
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-none bg-arena-blood/10 border border-arena-blood/20 text-arena-blood mb-2"
            >
              <Skull className="w-8 h-8" />
            </motion.div>
            <h1 className="text-3xl md:text-5xl font-display font-black tracking-tighter text-arena-blood uppercase">
              THE SANDS CLAIM ANOTHER
            </h1>
            <p className="text-[10px] tracking-[0.4em] font-black uppercase text-muted-foreground/60">
              Chronicle. Archive. Remembrance.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  Deceased
                </span>
                <h2 className="text-2xl font-display font-bold text-foreground leading-none">
                  {warrior.name.toUpperCase()}
                </h2>
                <p className="text-xs font-mono text-muted-foreground/80 uppercase">
                  {warrior.style} · Year {warrior.age}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
                    Service
                  </span>
                  <div className="text-sm font-mono flex items-center gap-2">
                    <Scroll className="w-3 h-3 text-arena-gold" />
                    <span>Weeks 1 - {warrior.deathWeek}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
                    Legacy
                  </span>
                  <div className="text-sm font-mono flex items-center gap-2">
                    <Crosshair className="w-3 h-3 text-arena-blood" />
                    <span>
                      {warrior.career.wins}W - {warrior.career.losses}L
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 p-4 bg-arena-blood/5 border-l-2 border-arena-blood/40">
                <span className="text-[10px] font-black uppercase tracking-widest text-arena-blood/70 flex items-center gap-2">
                  <HeartOff className="w-3 h-3" /> Fatal Circumstance
                </span>
                <p className="text-sm italic text-muted-foreground leading-relaxed">
                  "{warrior.deathCause || 'Fell in honorable combat on the sands of the arena.'}"
                </p>
              </div>
            </div>

            <div className="flex justify-center bg-black/40 rounded-none p-4 border border-white/5 relative group">
              <div className="absolute inset-0 bg-arena-blood/5 opacity-0 group-hover:opacity-100 transition-opacity blur-xl rounded-none" />
              <div className="relative w-full max-w-52 aspect-[1/2] opacity-60 grayscale filter contrast-125">
                <PaperDoll healthMap={{}} />
              </div>
            </div>
          </div>

          <footer className="pt-4 flex flex-col items-center gap-4 border-t border-white/5">
            <Button onClick={() => acknowledgeDeath(warrior.id)}>MEMORIALIZE & CONTINUE</Button>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">
              "Even the strongest steel returns to the earth"
            </p>
          </footer>
        </div>
      </motion.div>
    </div>
  );
}
