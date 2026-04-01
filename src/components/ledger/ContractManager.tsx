import React from "react";
import { useGameStore } from "@/state/useGameStore";
import { Link } from "@tanstack/react-router";
import { TRAINER_WEEKLY_SALARY } from "@/engine/trainers";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GraduationCap, AlertTriangle, Coins, Target, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export function ContractManager() {
  const { state } = useGameStore();
  const trainers = state.trainers ?? [];
  const activeTrainers = trainers.filter(t => t.contractWeeksLeft > 0);

  const totalWeeklyExpense = activeTrainers.reduce(
    (sum, t) => sum + (TRAINER_WEEKLY_SALARY[t.tier] ?? 35), 
    0
  );
  
  const expiringSoonCount = activeTrainers.filter(t => t.contractWeeksLeft <= 4).length;

  return (
    <div className="space-y-6">
      {/* ─── Contract Portfolio ─── */}
      <Surface variant="glass" padding="none" className="border-primary/10 overflow-hidden">
        <div className="p-6 border-b border-border/20 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-primary/5">
          <div className="flex items-center gap-3">
             <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
               <GraduationCap className="h-5 w-5 text-primary" />
             </div>
             <div>
               <h3 className="font-display text-sm font-black uppercase tracking-tight">Active Faculty Contracts</h3>
               <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">Total Staff: {activeTrainers.length} · Academy Enlistment</p>
             </div>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="flex flex-col items-end">
               <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Weekly Disbursement</span>
               <span className="font-mono font-black text-destructive">-{totalWeeklyExpense}G</span>
             </div>
             {expiringSoonCount > 0 && (
               <div className="flex flex-col items-end">
                 <span className="text-[9px] font-black uppercase tracking-widest text-destructive">Impaired Contracts</span>
                 <span className="flex items-center gap-1 font-mono font-black text-destructive">
                   <AlertTriangle className="h-3 w-3 animate-pulse" />
                   {expiringSoonCount}
                 </span>
               </div>
             )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeTrainers.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center gap-4">
              <GraduationCap className="h-10 w-10 text-muted-foreground opacity-20" />
              <div className="space-y-1">
                <p className="text-sm font-display font-black uppercase tracking-tight text-muted-foreground">The Academy is Empty</p>
                <p className="text-xs text-muted-foreground/60 italic max-w-xs mx-auto">No trainers are currently on payroll. Recruit specialists to accelerate warrior evolution.</p>
              </div>
              <Link to="/stable/recruit" className="mt-2 group">
                <Surface variant="neon" padding="sm" className="text-[10px] font-black uppercase tracking-[0.2em] px-6 py-2 group-hover:scale-105 transition-transform">
                  Access Recruitment Office
                </Surface>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/20">
                  <TableHead className="font-black uppercase text-[10px] tracking-widest pl-6">Personnel</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Classification</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Specialization</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-center">Tenure Remaining</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-right pr-6">Weekly Fee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeTrainers.map(t => {
                  const weeksLeft = t.contractWeeksLeft;
                  const pct = Math.min((weeksLeft / 52) * 100, 100);
                  const isExpiring = weeksLeft <= 4;
                  
                  return (
                    <TableRow key={t.id} className="border-border/10 group hover:bg-white/5 transition-colors">
                      <TableCell className="pl-6">
                        <div className="flex flex-col">
                          <span className="font-display font-black text-sm uppercase tracking-tight group-hover:text-primary transition-colors">{t.name}</span>
                          {t.retiredFromWarrior && (
                            <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">EX-WARRIOR: {t.retiredFromWarrior}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          "text-[9px] font-black border-none uppercase tracking-widest px-2",
                          t.tier === "Master" ? "bg-arena-gold/20 text-arena-gold" :
                          t.tier === "Seasoned" ? "bg-primary/20 text-primary" :
                          "bg-secondary/40 text-muted-foreground"
                        )}>
                          {t.tier}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <div className="h-1 w-1 rounded-full bg-primary" />
                          <span className="text-xs font-medium text-foreground/80">{t.focus}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-2 w-24">
                             <Progress value={pct} className={cn("h-1.5 flex-1", isExpiring ? "bg-destructive/20" : "bg-primary/10")} />
                             <span className={cn("text-[10px] font-mono font-black", isExpiring ? "text-destructive" : "text-primary")}>
                               {weeksLeft}W
                             </span>
                          </div>
                          {isExpiring && <span className="text-[8px] font-black uppercase text-destructive tracking-widest animate-pulse">Critical Renewal</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5 text-xs font-mono font-black">
                           <span>{TRAINER_WEEKLY_SALARY[t.tier] ?? 35}</span>
                           <Coins className="h-3 w-3 text-arena-gold opacity-60" />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </Surface>

      {/* ─── Strategic Summary ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Surface variant="glass" padding="sm" className="bg-secondary/20 border-border/20 flex items-center gap-4">
           <div className="p-3 rounded-full bg-destructive/10">
              <Calendar className="h-5 w-5 text-destructive" />
           </div>
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Net Disbursement</p>
              <p className="text-lg font-mono font-black text-destructive">-{totalWeeklyExpense}G / Week</p>
           </div>
        </Surface>
        <Surface variant="glass" padding="sm" className="bg-secondary/20 border-border/20 flex items-center gap-4">
           <div className="p-3 rounded-full bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
           </div>
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Strategic Intent</p>
              <p className="text-lg font-display font-black uppercase text-foreground leading-none">Martial Optimization</p>
           </div>
        </Surface>
      </div>
    </div>
  );
}
