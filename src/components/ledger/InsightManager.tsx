import React, { useState } from "react";
import { useGameStore, useWorldState } from "@/state/useGameStore";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Zap, 
  Search, 
  Swords, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Target
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FightingStyle } from "@/types/shared.types";

export function InsightManager() {
  const state = useWorldState();
  const { doConsumeInsightToken } = useGameStore();
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [selectedWarriorId, setSelectedWarriorId] = useState<string | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealData, setRevealData] = useState<{ name: string; type: string; result: string } | null>(null);

  const tokens = state.insightTokens ?? [];
  const roster = state.roster ?? [];

  const selectedToken = tokens.find(t => t.id === selectedTokenId);
  const selectedWarrior = roster.find(w => w.id === selectedWarriorId);

  const handleReveal = () => {
    if (!selectedToken || !selectedWarrior) return;

    setIsRevealing(true);
    
    // Artificial delay for "Scanning" effect
    setTimeout(() => {
      const type = selectedToken.type;
      let result = "Unknown";
      
      if (type === "Weapon") {
        result = selectedWarrior.favorites?.weaponId || "Gladius";
      } else {
        const r = selectedWarrior.favorites?.rhythm || { oe: 0.5, al: 0.5 };
        result = `OE:${Math.round(r.oe * 100)}% / AL:${Math.round(r.al * 100)}%`;
      }

      setRevealData({
        name: selectedWarrior.name,
        type: type,
        result: result
      });

      doConsumeInsightToken(selectedToken.id, selectedWarrior.id);
      setIsRevealing(false);
      setSelectedTokenId(null);
      setSelectedWarriorId(null);
    }, 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4 px-1">
         <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)] text-primary">
            <Search className="h-5 w-5" />
         </div>
         <div>
            <h3 className="font-display text-lg font-black uppercase tracking-tight text-white">Insight_Intelligence_Hub</h3>
            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">Decrypting_Asset_Profiles // Tokens_Available: {tokens.length}</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ─── Token Inventory ─── */}
        <div className="lg:col-span-4 space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Available_Tokens</h4>
          {tokens.length === 0 ? (
            <div className="p-8 rounded-2xl border-2 border-dashed border-border/20 text-center opacity-30">
              <Zap className="h-8 w-8 mx-auto mb-3" />
              <p className="text-[10px] font-black uppercase tracking-widest">Inventory_Empty</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tokens.map((token: any) => (
                <button
                  aria-label={`Select ${token.type} Insight Token, discovered week ${token.discoveredWeek}`}
                  key={token.id}
                  onClick={() => setSelectedTokenId(token.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all relative overflow-hidden group ${
                    selectedTokenId === token.id 
                    ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]" 
                    : "bg-glass-card border-border/40 hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center gap-3 relative z-10">
                    <div className={`p-2 rounded-lg ${token.type === "Weapon" ? "bg-orange-500/20 text-orange-500" : "bg-cyan-500/20 text-cyan-500"}`}>
                       {token.type === "Weapon" ? <Swords className="h-4 w-4" /> : <RotateCw className="h-4 w-4" />}
                    </div>
                    <div>
                       <span className="block text-[10px] font-black uppercase tracking-wider text-white">{token.type}_Insight</span>
                       <span className="block text-[9px] text-muted-foreground uppercase tracking-widest font-mono opacity-60">WK_{token.discoveredWeek} // {token.id.slice(0, 8)}</span>
                    </div>
                  </div>
                  {selectedTokenId === token.id && (
                    <motion.div layoutId="token-active" className="absolute left-0 top-0 w-1 h-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ─── Target Selection ─── */}
        <div className="lg:col-span-8 space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Select_Operational_Target</h4>
          
          <Surface variant="glass" className="p-6 border-white/5 bg-black/20">
            {selectedTokenId ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {roster.map((w: any) => {
                    const isRevealed = selectedToken?.type === "Weapon" 
                      ? w.favorites?.discovered.weapon 
                      : w.favorites?.discovered.rhythm;

                    return (
                      <button
                        aria-label={`Select warrior ${w.name} for insight`}
                        key={w.id}
                        disabled={isRevealed || isRevealing}
                        onClick={() => setSelectedWarriorId(w.id)}
                        className={`p-3 rounded-xl border text-center transition-all group relative ${
                          selectedWarriorId === w.id 
                          ? "bg-primary/20 border-primary" 
                          : isRevealed 
                            ? "opacity-30 grayscale cursor-not-allowed bg-transparent border-white/5" 
                            : "bg-glass-card border-border/40 hover:border-white/20"
                        }`}
                      >
                        <span className="block text-[10px] font-black uppercase tracking-wider mb-1 truncate">{w.name}</span>
                        {isRevealed ? (
                          <CheckCircle2 className="h-3 w-3 mx-auto text-primary" />
                        ) : (
                          <div className="text-[8px] font-black font-mono opacity-40 uppercase">{w.style.slice(0, 3)}</div>
                        )}
                        {selectedWarriorId === w.id && (
                           <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary-rgb),1)] animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-primary/20 flex items-center justify-center bg-primary/5">
                       {selectedWarrior ? (
                         <div className="text-[10px] font-black text-primary uppercase">{selectedWarrior.name.slice(0, 2)}</div>
                       ) : (
                         <AlertCircle className="h-5 w-5 text-muted-foreground/30" />
                       )}
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase text-white tracking-widest">{selectedWarrior?.name || "Target_Required"}</p>
                       <p className="text-[9px] text-muted-foreground uppercase tracking-widest opacity-60">Ready_For_Extraction</p>
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
                    {isRevealing ? "CONSULTING_ORACLES..." : "SEQUENCE_START"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center opacity-20">
                <Target className="h-12 w-12 mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Hardware_Authentication_Required</p>
                <p className="text-[9px] lowercase mt-2 italic font-medium">Please select a physical insight token from your inventory to begin target matching.</p>
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
             <div className="bg-neutral-950 border-2 border-primary/40 rounded-3xl p-10 max-w-md w-full text-center relative shadow-[0_0_50px_rgba(255,0,0,0.2)]">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(255,0,0,0.5)]">
                   <Sparkles className="text-white h-6 w-6 animate-pulse" />
                </div>
                
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-2">Discovery_Successful</h4>
                <h2 className="text-4xl font-display font-black uppercase tracking-tighter text-white mb-6 leading-none">{revealData.name}</h2>
                
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
                   <span className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">{revealData.type}_AUTHENTICATED</span>
                   <span className="block text-2xl font-mono font-black text-arena-gold uppercase tracking-tighter drop-shadow-[0_0_10px_rgba(255,215,0,0.3)]">
                      {revealData.result}
                   </span>
                </div>

                <Button 
                  onClick={() => setRevealData(null)}
                  className="w-full h-12 bg-white/5 hover:bg-white/10 text-white font-black uppercase text-[10px] tracking-widest border border-white/10"
                >
                  Close_Sequence
                </Button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
