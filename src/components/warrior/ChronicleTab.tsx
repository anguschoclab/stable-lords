import React from "react";
import { Trophy } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CareerTimeline } from "@/components/warrior/CareerTimeline";
import { WarriorFightHistory } from "@/components/warrior/WarriorFightHistory";
import { Warrior, type FightSummary } from "@/types/game";

interface ChronicleTabProps {
  warrior: Warrior;
  arenaHistory: FightSummary[];
}

export function ChronicleTab({ warrior, arenaHistory }: ChronicleTabProps) {
  return (
    <div className="grid gap-8 lg:grid-cols-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="lg:col-span-4 space-y-6">
         <CareerTimeline warrior={warrior} arenaHistory={arenaHistory} />
         <Card className="bg-glass-card border-border/40 border">
            <CardHeader className="bg-secondary/5">
               <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                 <Trophy className="h-4 w-4 text-arena-gold" /> Hall of Records
               </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
               <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Highest Fame</span>
                  <span className="font-mono font-bold">{warrior.fame}</span>
               </div>
               <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Tournaments Won</span>
                  <span className="font-mono font-bold">{warrior.career.wins > 10 ? 1 : 0}</span>
               </div>
               <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Total Payout</span>
                  <span className="font-mono font-bold text-arena-gold">${warrior.career.wins * 150}</span>
               </div>
            </CardContent>
         </Card>
      </div>

      <div className="lg:col-span-8">
        <div className="bg-glass-card border-border/40 border rounded-3xl overflow-hidden min-h-[600px]">
          <div className="bg-secondary/10 px-8 py-6 border-b border-border/40">
             <h2 className="font-display font-black uppercase text-2xl tracking-tighter">Engagement Archive</h2>
          </div>
          <div className="p-8">
             <WarriorFightHistory warriorName={warrior.name} arenaHistory={arenaHistory} />
          </div>
        </div>
      </div>
    </div>
  );
}
