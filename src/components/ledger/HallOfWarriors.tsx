import React from "react";
import { useGameStore } from "@/state/useGameStore";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WarriorNameTag, StatBadge } from "@/components/ui/WarriorBadges";
import { Trophy, Skull, Star, Swords, Target, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export function HallOfWarriors() {
  const { state } = useGameStore();
  const graveyard = state.graveyard ?? [];
  const retired = state.retired ?? [];

  return (
    <div className="space-y-8">
      {/* ─── Retired Legends ─── */}
      <Surface variant="gold" padding="none" className="border-arena-gold/30 bg-arena-gold/5 shadow-[0_0_30px_rgba(255,191,0,0.05)] overflow-hidden">
        <div className="p-6 border-b border-arena-gold/20 flex items-center justify-between">
          <div className="flex items-center gap-3 text-left">
             <div className="p-2 rounded-lg bg-arena-gold/10 border border-arena-gold/20">
               <Trophy className="h-5 w-5 text-arena-gold" />
             </div>
             <div>
               <h3 className="font-display text-sm font-black uppercase tracking-tight text-arena-gold">Retired Legends</h3>
               <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">Total: {retired.length} · Eternal Recognition</p>
             </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {retired.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-[10px] uppercase tracking-widest opacity-40">
              No warriors have earned retirement yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-arena-gold/10">
                  <TableHead className="font-black uppercase text-[10px] tracking-widest pl-6">Warrior</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Martial Style</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-center">Final Record</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-right">Eminent Fame</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-right pr-6">Departure</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {retired.map(w => (
                  <TableRow key={w.id} className="border-arena-gold/10 hover:bg-arena-gold/5 transition-colors">
                    <TableCell className="pl-6">
                      <WarriorNameTag id={w.id} name={w.name} isChampion={w.champion} />
                    </TableCell>
                    <TableCell>
                      <StatBadge styleName={w.style as any} />
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2 text-xs font-mono font-black">
                        <span className="text-arena-pop">{w.career.wins}W</span>
                        <span className="text-muted-foreground/30">|</span>
                        <span className="text-destructive/60">{w.career.losses}L</span>
                        <span className="text-muted-foreground/30">|</span>
                        <span className="text-destructive font-bold">{w.career.kills}K</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-arena-gold font-mono font-black text-xs">{w.fame}G</TableCell>
                    <TableCell className="text-right font-mono font-black text-[10px] text-muted-foreground/60 pr-6 uppercase tracking-widest">
                      Week {w.retiredWeek ?? "?"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Surface>

      {/* ─── The Fallen ─── */}
      <Surface variant="blood" padding="none" className="border-destructive/30 bg-destructive/5 shadow-[0_0_30px_rgba(255,0,0,0.05)] overflow-hidden">
        <div className="p-6 border-b border-destructive/20 flex items-center justify-between">
          <div className="flex items-center gap-3 text-left">
             <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20">
               <Skull className="h-5 w-5 text-destructive" />
             </div>
             <div>
               <h3 className="font-display text-sm font-black uppercase tracking-tight text-destructive">The Fallen</h3>
               <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">Total: {graveyard.length} · Final Rites</p>
             </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {graveyard.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-[10px] uppercase tracking-widest opacity-40 italic">
              The graveyard is empty. Long may they live.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-destructive/10">
                  <TableHead className="font-black uppercase text-[10px] tracking-widest pl-6 text-destructive/60">The Deceased</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Style</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-center">Record</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Cause of Cessation</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-right pr-6">Incident Week</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {graveyard.map(w => (
                  <TableRow key={w.id} className="border-destructive/10 hover:bg-destructive/5 transition-colors group">
                    <TableCell className="pl-6">
                      <div className={cn(
                        "font-display font-black text-sm uppercase tracking-tight transition-colors",
                        "text-destructive/60 group-hover:text-destructive"
                      )}>
                        {w.name}
                      </div>
                    </TableCell>
                    <TableCell className="opacity-60 saturate-50 group-hover:opacity-100 group-hover:saturate-100">
                      <StatBadge styleName={w.style as any} />
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2 text-[10px] font-mono font-black opacity-60 group-hover:opacity-100 transition-opacity">
                        <span className="text-arena-pop">{w.career.wins}W</span>
                        <span className="text-destructive/60">{w.career.losses}L</span>
                        <span className="text-destructive font-bold">{w.career.kills}K</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                      {w.deathCause ?? "Obscured"}{w.killedBy ? ` · SLAYER: ${w.killedBy}` : ""}
                    </TableCell>
                    <TableCell className="text-right font-mono font-black text-[10px] text-muted-foreground/40 pr-6 uppercase tracking-widest">
                      Week {w.deathWeek ?? "?"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Surface>
    </div>
  );
}
