import React from "react";
import { useGameStore } from "@/state/useGameStore";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Shield, Zap, Target } from "lucide-react";
import { cn } from "@/lib/utils";

export function InsightVault() {
  const { state } = useGameStore();
  const tokens = state.insightTokens ?? [];
  const weaponTokens = tokens.filter(t => t.type === "Weapon");
  const rhythmTokens = tokens.filter(t => t.type === "Rhythm");
  const statTokens = tokens.filter(t => t.type === "Attribute");

  return (
    <div className="space-y-6">
      <Surface variant="glass" className="border-arena-gold/20">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-5 w-5 text-arena-gold" />
          <h3 className="font-display text-lg font-black uppercase tracking-tight">The Insight Vault</h3>
        </div>
        
        <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
          Insights are fragments of tactical truth discovered amidst the chaos of the sands. 
          When a warrior exhibits their preferred weapon or innate rhythm, these secrets surface. 
          Reveal enough fragments to unlock permanent martial superiority.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {/* ─── Rival Secrets ─── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <Shield className="h-3 w-3 text-primary" /> Rival Secrets
              </h4>
              <Badge variant="outline" className="text-[9px] border-primary/20 bg-primary/5">{statTokens.length}</Badge>
            </div>
            {statTokens.length === 0 ? (
              <p className="text-[10px] text-muted-foreground/40 italic uppercase tracking-widest">No vulnerabilities deduced</p>
            ) : (
              <div className="space-y-2">
                {statTokens.map(t => (
                  <Surface key={t.id} variant="glass" padding="sm" className="bg-primary/5 border-primary/10">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-black uppercase text-primary tracking-tight">{t.warriorName}</span>
                      <span className="text-[9px] font-mono font-bold text-muted-foreground">WK_{t.discoveredWeek}</span>
                    </div>
                    <p className="text-[11px] text-foreground/80 leading-snug">{t.detail}</p>
                  </Surface>
                ))}
              </div>
            )}
          </div>

          {/* ─── Weapon Insights ─── */}
          <div className="space-y-4">
             <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <Target className="h-3 w-3 text-arena-gold" /> Weapon Mastery
              </h4>
              <Badge variant="outline" className="text-[9px] border-arena-gold/20 bg-arena-gold/5">{weaponTokens.length}</Badge>
            </div>
            {weaponTokens.length === 0 ? (
              <p className="text-[10px] text-muted-foreground/40 italic uppercase tracking-widest">No armory secrets uncovered</p>
            ) : (
              <div className="space-y-2">
                {weaponTokens.map(t => (
                  <Surface key={t.id} variant="glass" padding="sm" className="bg-arena-gold/5 border-arena-gold/10">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-black uppercase text-arena-gold tracking-tight">{t.warriorName}</span>
                      <span className="text-[9px] font-mono font-bold text-muted-foreground">WK_{t.discoveredWeek}</span>
                    </div>
                    <p className="text-[11px] text-foreground/80 leading-snug">{t.detail}</p>
                  </Surface>
                ))}
              </div>
            )}
          </div>

          {/* ─── Rhythm Insights ─── */}
          <div className="space-y-4">
             <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <Zap className="h-3 w-3 text-arena-pop" /> Combat Rhythm
              </h4>
              <Badge variant="outline" className="text-[9px] border-arena-pop/20 bg-arena-pop/5">{rhythmTokens.length}</Badge>
            </div>
            {rhythmTokens.length === 0 ? (
              <p className="text-[10px] text-muted-foreground/40 italic uppercase tracking-widest">No tactical flow identified</p>
            ) : (
              <div className="space-y-2">
                {rhythmTokens.map(t => (
                  <Surface key={t.id} variant="glass" padding="sm" className="bg-arena-pop/5 border-arena-pop/10">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-black uppercase text-arena-pop tracking-tight">{t.warriorName}</span>
                      <span className="text-[9px] font-mono font-bold text-muted-foreground">WK_{t.discoveredWeek}</span>
                    </div>
                    <p className="text-[11px] text-foreground/80 leading-snug">{t.detail}</p>
                  </Surface>
                ))}
              </div>
            )}
          </div>
        </div>
      </Surface>

      {/* ─── Global Progress Summary ─── */}
      <Surface variant="glass" padding="sm" className="border-border/20 bg-secondary/20">
        <div className="grid grid-cols-3 divide-x divide-border/20">
          <div className="flex flex-col items-center py-2">
            <span className="text-2xl font-mono font-black text-foreground">{tokens.length}</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Total Registry</span>
          </div>
          <div className="flex flex-col items-center py-2">
            <span className="text-2xl font-mono font-black text-arena-gold">{weaponTokens.length}</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Armature Intel</span>
          </div>
          <div className="flex flex-col items-center py-2">
            <span className="text-2xl font-mono font-black text-arena-pop">{rhythmTokens.length}</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Kinetic Insights</span>
          </div>
        </div>
      </Surface>
    </div>
  );
}
