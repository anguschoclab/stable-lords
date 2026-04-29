import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useGameStore, useWorldState } from '@/state/useGameStore';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/button';
import {
  Zap,
  Search,
  Swords,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Target,
  TrendingUp,
  Brain,
} from 'lucide-react';
import type { InsightTokenType } from '@/types/state.types';
import { motion, AnimatePresence } from 'framer-motion';

const TOKEN_CFG: Record<
  InsightTokenType,
  { Icon: React.ElementType; color: string; label: string }
> = {
  Weapon: { Icon: Swords, color: 'bg-arena-blood/20 text-arena-blood', label: 'Weapon' },
  Rhythm: { Icon: RotateCw, color: 'bg-cyan-500/20 text-cyan-500', label: 'Rhythm' },
  Style: { Icon: Zap, color: 'bg-arena-gold/20 text-arena-gold', label: 'Style' },
  Attribute: { Icon: TrendingUp, color: 'bg-primary/20 text-primary', label: 'Attribute' },
  Tactic: { Icon: Brain, color: 'bg-purple-500/20 text-purple-500', label: 'Tactic' },
};

export function InsightManager() {
  const state = useWorldState();
  const { consumeInsightToken } = useGameStore();
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [selectedWarriorId, setSelectedWarriorId] = useState<string | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealData, setRevealData] = useState<{
    name: string;
    type: string;
    result: string;
  } | null>(null);

  const tokens = state.insightTokens ?? [];
  const roster = state.roster ?? [];

  const selectedToken = tokens.find((t) => t.id === selectedTokenId);
  const selectedWarrior = roster.find((w) => w.id === selectedWarriorId);

  const handleReveal = () => {
    if (!selectedToken || !selectedWarrior) return;

    setIsRevealing(true);

    // Artificial delay for "Scanning" effect
    setTimeout(() => {
      const type = selectedToken.type;
      let result = 'Unknown';

      if (type === 'Weapon') {
        result = selectedWarrior.favorites?.weaponId || 'Gladius';
      } else if (type === 'Rhythm') {
        const r = selectedWarrior.favorites?.rhythm || { oe: 5, al: 5 };
        result = `OE:${r.oe} / AL:${r.al}`;
      } else if (type === 'Style') {
        result = '+1 ATT Permanently Applied';
      } else if (type === 'Attribute') {
        result = 'Primary Attribute Enhanced (+1)';
      } else if (type === 'Tactic') {
        result = 'Tactical Insight Unlocked';
      }

      setRevealData({
        name: selectedWarrior.name,
        type: type,
        result: result,
      });

      consumeInsightToken(selectedToken.id, selectedWarrior.id);
      setIsRevealing(false);
      setSelectedTokenId(null);
      setSelectedWarriorId(null);
    }, 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4 px-1">
        <div className="p-2.5 rounded-none bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)] text-primary">
          <Search className="h-5 w-5" />
        </div>
        <div>
          <h3>Insight Intelligence Hub</h3>
          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">
            Decrypting Asset Profiles // Tokens Available: {tokens.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ─── Token Inventory ─── */}
        <div className="lg:col-span-4 space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">
            Available Tokens
          </h4>
          {tokens.length === 0 ? (
            <div className="p-8 rounded-none border-2 border-dashed border-border/20 text-center opacity-30">
              <Zap className="h-8 w-8 mx-auto mb-3" />
              <p className="text-[10px] font-black uppercase tracking-widest">Inventory Empty</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tokens.map((token: any) => (
                <Surface
                  key={token.id}
                  variant={selectedTokenId === token.id ? 'paper' : 'glass'}
                  padding="none"
                  className={cn(
                    'transition-all border overflow-hidden relative',
                    selectedTokenId === token.id
                      ? 'border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)] bg-primary/10'
                      : 'border-white/5 hover:border-white/20'
                  )}
                >
                  <button
                    aria-label={`Select ${token.type} Insight Token, discovered week ${token.discoveredWeek}`}
                    onClick={() => setSelectedTokenId(token.id)}
                    className="w-full text-left p-4 outline-none"
                  >
                    <div className="flex items-center gap-3 relative z-10">
                      {(() => {
                        const cfg = TOKEN_CFG[token.type as InsightTokenType] ?? TOKEN_CFG.Weapon;
                        const Icon = cfg.Icon;
                        return (
                          <div className={`p-2 rounded-none ${cfg.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                        );
                      })()}
                      <div>
                        <span>{token.type}_Token</span>
                        <span className="block text-[9px] text-muted-foreground uppercase tracking-widest font-mono opacity-60">
                          WK_{token.discoveredWeek} // {token.id.slice(0, 8)}
                        </span>
                      </div>
                    </div>
                  </button>
                  {selectedTokenId === token.id && (
                    <motion.div
                      layoutId="token-active"
                      className="absolute left-0 top-0 w-1 h-full bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]"
                    />
                  )}
                </Surface>
              ))}
            </div>
          )}
        </div>

        {/* ─── Target Selection ─── */}
        <div className="lg:col-span-8 space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">
            Select Operational Target
          </h4>

          <Surface variant="glass" className="p-6 border-white/5 bg-black/20">
            {selectedTokenId ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {roster.map((w: any) => {
                    const isRevealed =
                      selectedToken?.type === 'Weapon'
                        ? w.favorites?.discovered.weapon
                        : selectedToken?.type === 'Rhythm'
                          ? w.favorites?.discovered.rhythm
                          : false; // Style/Attribute/Tactic are stat boosts — always applicable

                    return (
                      <Surface
                        key={w.id}
                        variant={selectedWarriorId === w.id ? 'gold' : 'glass'}
                        padding="none"
                        className={cn(
                          'transition-all border text-center overflow-hidden relative',
                          selectedWarriorId === w.id
                            ? 'border-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)] bg-primary/20'
                            : isRevealed
                              ? 'opacity-20 grayscale border-white/5 bg-transparent'
                              : 'border-white/5 hover:border-white/20'
                        )}
                      >
                        <button
                          aria-label={`Select warrior ${w.name} for insight`}
                          disabled={isRevealed || isRevealing}
                          onClick={() => setSelectedWarriorId(w.id)}
                          className="w-full p-3 outline-none"
                        >
                          <span className="block text-[10px] font-black uppercase tracking-widest mb-1 truncate">
                            {w.name}
                          </span>
                          {isRevealed ? (
                            <CheckCircle2 className="h-4 w-4 mx-auto text-primary" />
                          ) : (
                            <div className="text-[9px] font-black font-mono opacity-40 uppercase">
                              {w.style.slice(0, 3)}
                            </div>
                          )}
                        </button>
                        {selectedWarriorId === w.id && (
                          <div className="absolute top-0 right-0 p-1">
                            <Target className="h-3 w-3 text-primary animate-pulse" />
                          </div>
                        )}
                      </Surface>
                    );
                  })}
                </div>

                <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-primary/20 flex items-center justify-center bg-primary/5">
                      {selectedWarrior ? (
                        <div className="text-[10px] font-black text-primary uppercase">
                          {selectedWarrior.name.slice(0, 2)}
                        </div>
                      ) : (
                        <AlertCircle className="h-5 w-5 text-muted-foreground/30" />
                      )}
                    </div>
                    <div>
                      <p>{selectedWarrior?.name || 'Target Required'}</p>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest opacity-60">
                        Ready For Extraction
                      </p>
                    </div>
                  </div>

                  <Button
                    disabled={!selectedWarriorId || isRevealing}
                    onClick={handleReveal}
                    className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[11px] tracking-widest shadow-[0_0_20px_rgba(255,0,0,0.2)] group"
                  >
                    {isRevealing ? (
                      <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4 mr-2 group-hover:scale-125 transition-transform" />
                    )}
                    {isRevealing ? 'CONSULTING ORACLES...' : 'SEQUENCE START'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center opacity-20">
                <Target className="h-12 w-12 mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">
                  Hardware Authentication Required
                </p>
                <p className="text-[9px] lowercase mt-2 italic font-medium">
                  Please select a physical insight token from your inventory to begin target
                  matching.
                </p>
              </div>
            )}
          </Surface>
        </div>
      </div>

      <AnimatePresence>
        {revealData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
          >
            <div className="bg-neutral-950 border-2 border-primary/40 rounded-none p-10 max-w-md w-full text-center relative shadow-[0_0_50px_rgba(255,0,0,0.2)]">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-none bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(255,0,0,0.5)]">
                <Sparkles />
              </div>

              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-2">
                Discovery Successful
              </h4>
              <h2>{revealData.name}</h2>

              <div className="bg-white/5 border border-white/10 rounded-none p-6 mb-8">
                <span className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">
                  {revealData.type} AUTHENTICATED
                </span>
                <span className="block text-2xl font-mono font-black text-arena-gold uppercase tracking-tighter drop-shadow-[0_0_10px_rgba(255,215,0,0.3)]">
                  {revealData.result}
                </span>
              </div>

              <Button onClick={() => setRevealData(null)}>Close Sequence</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
