import React from "react";
import { useGameStore, useWorldState } from "@/state/useGameStore";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Shield, Zap, Target, Database, Binary, Info, Search, Box, Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function InsightVault() {
  const state = useWorldState();
  const tokens = state.insightTokens ?? [];
  const weaponTokens = tokens.filter(t => t.type === "Weapon");
  const rhythmTokens = tokens.filter(t => t.type === "Rhythm");
  const statTokens = tokens.filter(t => t.type === "Attribute");

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ─── The Insight Vault Header ─── */}
      <Surface variant="glass" className="border-arena-gold/30 bg-neutral-900/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
           <Database className="h-32 w-32 text-arena-gold" />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center gap-8 relative z-10">
           <div className="p-4 rounded-2xl bg-arena-gold/10 border border-arena-gold/20 shadow-[0_0_20px_rgba(255,215,0,0.1)]">
             <Unlock className="h-8 w-8 text-arena-gold" />
           </div>
           <div className="flex-1">
             <div className="flex items-center gap-3 mb-2">
                <h3 className="font-display text-xl font-black uppercase tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">The_Insight_Vault</h3>
                <Badge className="bg-arena-gold/20 text-arena-gold border-arena-gold/30 font-mono font-black text-[10px] px-2">ENCRYPTED_SYNC_ACTIVE</Badge>
             </div>
             <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl font-medium">
               Insights are fragments of tactical truth discovered amidst the chaos of the sands. 
               When a warrior exhibits their preferred weapon or innate rhythm, these secrets surface. 
               Reveal enough fragments to unlock permanent martial superiority and strategic dominance over your rivals.
             </p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 relative z-10">
          {/* ─── Rival Intel ─── */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                 <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                 <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                    Personnel_Intel
                 </h4>
              </div>
              <span className="font-mono text-[10px] font-black text-primary/60">{statTokens.length} / --</span>
            </div>

            <div className="space-y-3">
              {statTokens.length === 0 ? (
                <Surface variant="glass" className="py-12 text-center border-dashed border-white/5 opacity-40">
                   <Lock className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                   <p className="text-[9px] font-black uppercase tracking-widest leading-none">Vulnerabilities_Obscured</p>
                </Surface>
              ) : (
                statTokens.map(t => (
                  <Surface key={t.id} variant="paper" padding="sm" className="bg-primary/5 border border-primary/20 hover:border-primary/50 transition-all group cursor-default">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                         <Shield className="h-3 w-3 text-primary opacity-60" />
                         <span className="text-[11px] font-display font-black uppercase text-primary tracking-tight group-hover:drop-shadow-[0_0_5px_rgba(var(--primary-rgb),0.4)] transition-all">{t.warriorName}</span>
                      </div>
                      <span className="text-[8px] font-mono font-black text-muted-foreground/60 tracking-widest">SEQ_{t.discoveredWeek.toString().padStart(2, '0')}</span>
                    </div>
                    <p className="text-[10px] text-foreground/70 font-medium leading-relaxed italic">{t.detail}</p>
                  </Surface>
                ))
              )}
            </div>
          </div>

          {/* ─── Weapon Intel ─── */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                 <div className="h-2 w-2 rounded-full bg-arena-gold animate-pulse" />
                 <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                    Armament_Telemetry
                 </h4>
              </div>
              <span className="font-mono text-[10px] font-black text-arena-gold/60">{weaponTokens.length} / --</span>
            </div>

            <div className="space-y-3">
              {weaponTokens.length === 0 ? (
                <Surface variant="glass" className="py-12 text-center border-dashed border-white/5 opacity-40">
                   <Target className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                   <p className="text-[9px] font-black uppercase tracking-widest leading-none">Armature_Encrypted</p>
                </Surface>
              ) : (
                weaponTokens.map(t => (
                  <Surface key={t.id} variant="paper" padding="sm" className="bg-arena-gold/5 border border-arena-gold/20 hover:border-arena-gold/50 transition-all group cursor-default">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                         <Target className="h-3 w-3 text-arena-gold opacity-60" />
                         <span className="text-[11px] font-display font-black uppercase text-arena-gold tracking-tight group-hover:drop-shadow-[0_0_5px_rgba(255,215,0,0.4)] transition-all">{t.warriorName}</span>
                      </div>
                      <span className="text-[8px] font-mono font-black text-muted-foreground/60 tracking-widest">SEQ_{t.discoveredWeek.toString().padStart(2, '0')}</span>
                    </div>
                    <p className="text-[10px] text-foreground/70 font-medium leading-relaxed italic">{t.detail}</p>
                  </Surface>
                ))
              )}
            </div>
          </div>

          {/* ─── Rhythm Intel ─── */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                 <div className="h-2 w-2 rounded-full bg-arena-pop animate-pulse" />
                 <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                    Kinetic_Patterns
                 </h4>
              </div>
              <span className="font-mono text-[10px] font-black text-arena-pop/60">{rhythmTokens.length} / --</span>
            </div>

            <div className="space-y-3">
              {rhythmTokens.length === 0 ? (
                <Surface variant="glass" className="py-12 text-center border-dashed border-white/5 opacity-40">
                   <Zap className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                   <p className="text-[9px] font-black uppercase tracking-widest leading-none">Rhythms_Obscured</p>
                </Surface>
              ) : (
                rhythmTokens.map(t => (
                  <Surface key={t.id} variant="paper" padding="sm" className="bg-arena-pop/5 border border-arena-pop/20 hover:border-arena-pop/50 transition-all group cursor-default">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                         <Zap className="h-3 w-3 text-arena-pop opacity-60" />
                         <span className="text-[11px] font-display font-black uppercase text-arena-pop tracking-tight group-hover:drop-shadow-[0_0_5px_rgba(var(--arena-pop-rgb),0.4)] transition-all">{t.warriorName}</span>
                      </div>
                      <span className="text-[8px] font-mono font-black text-muted-foreground/60 tracking-widest">SEQ_{t.discoveredWeek.toString().padStart(2, '0')}</span>
                    </div>
                    <p className="text-[10px] text-foreground/70 font-medium leading-relaxed italic">{t.detail}</p>
                  </Surface>
                ))
              )}
            </div>
          </div>
        </div>
      </Surface>

      {/* ─── Intel Synthesis Monitor ─── */}
      <Surface variant="glass" padding="none" className="border-border/10 bg-black/40 overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        
        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/5">
          <div className="p-8 flex items-center gap-6 group hover:bg-white/2 transition-all">
             <div className="p-3 rounded-2xl bg-secondary/20 border border-white/5 group-hover:border-primary/20 transition-all">
                <Search className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
             </div>
             <div>
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] block mb-1 opacity-40">System_Indexing</span>
                <span className="text-xl font-mono font-black text-foreground">{tokens.length}G</span>
                <span className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest block mt-0.5">Total_Sync</span>
             </div>
          </div>
          
          <div className="p-8 flex items-center gap-6 group hover:bg-white/2 transition-all">
             <div className="p-3 rounded-2xl bg-arena-gold/10 border border-white/5 group-hover:border-arena-gold/30 transition-all">
                <Box className="h-5 w-5 text-arena-gold/60 group-hover:text-arena-gold transition-colors" />
             </div>
             <div>
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] block mb-1 opacity-40">Armature_Index</span>
                <span className="text-xl font-mono font-black text-arena-gold">{weaponTokens.length}S</span>
                <span className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest block mt-0.5">Verified_Intel</span>
             </div>
          </div>

          <div className="p-8 flex items-center gap-6 group hover:bg-white/2 transition-all">
             <div className="p-3 rounded-2xl bg-arena-pop/10 border border-white/5 group-hover:border-arena-pop/30 transition-all">
                <Binary className="h-5 w-5 text-arena-pop/60 group-hover:text-arena-pop transition-colors" />
             </div>
             <div>
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] block mb-1 opacity-40">Tactical_Flow</span>
                <span className="text-xl font-mono font-black text-arena-pop">{rhythmTokens.length}K</span>
                <span className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest block mt-0.5">Verified_Intel</span>
             </div>
          </div>

          <div className="p-8 bg-secondary/5 flex flex-col justify-center relative overflow-hidden">
             <div className="absolute inset-0 bg-primary/5 opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
             <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.4em] mb-4 opacity-40">Intel_Synthesis_Status</span>
             <div className="flex items-center gap-3">
                <Unlocked className="h-4 w-4 text-primary animate-pulse" />
                <span className="text-xs font-black uppercase tracking-widest text-primary drop-shadow-[0_0_5px_rgba(var(--primary-rgb),0.3)]">SYNCHRONIZATION_PENDING</span>
             </div>
          </div>
        </div>
      </Surface>
    </div>
  );
}

// Minimal Unlocked shim since it's used at the end
function Unlocked(props: React.SVGProps<SVGSVGElement>) {
  return <Unlock {...props} />;
}
