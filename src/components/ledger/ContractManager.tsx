import React from "react";
import { useGameStore } from "@/state/useGameStore";
import { Link } from "@tanstack/react-router";
import { TRAINER_WEEKLY_SALARY } from "@/engine/trainers";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GraduationCap, AlertTriangle, Coins, Target, Calendar, UserCheck, Clock, TrendingDown, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ─── Contract Portfolio Matrix ─── */}
      <Surface variant="glass" padding="none" className="border-border/10 overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary/40 via-primary/10 to-transparent opacity-50" />
        
        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-neutral-900/40 backdrop-blur-md">
          <div className="flex items-center gap-4">
             <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]">
               <UserCheck className="h-6 w-6 text-primary" />
             </div>
             <div>
               <h3 className="font-display text-base font-black uppercase tracking-tight">Personnel_Contract_Ledger</h3>
               <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-60">Faculty_Enlistment // Active_Staff: {activeTrainers.length}</span>
                  <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
               </div>
             </div>
          </div>
          
          <div className="flex items-center gap-8">
             <div className="flex flex-col items-end">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Weekly_Payroll_Sync</span>
                <span className="font-mono font-black text-destructive text-lg">-{totalWeeklyExpense.toLocaleString()}G</span>
             </div>
             {expiringSoonCount > 0 && (
               <div className="flex flex-col items-end px-6 border-l border-white/5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-destructive opacity-40">Impaired_Tenure</span>
                  <div className="flex items-center gap-2 font-mono font-black text-destructive text-lg">
                    <AlertTriangle className="h-4 w-4 animate-bounce" />
                    {expiringSoonCount}
                  </div>
               </div>
             )}
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          {activeTrainers.length === 0 ? (
            <div className="py-24 text-center flex flex-col items-center gap-6 group">
              <div className="relative">
                 <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
                 <GraduationCap className="h-16 w-16 text-muted-foreground opacity-20 relative z-10 group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-display font-black uppercase tracking-[0.2em] text-muted-foreground">The_Academy_Is_Offline</p>
                <p className="text-xs text-muted-foreground/60 italic max-w-sm mx-auto leading-relaxed">
                  No specialists are currently under contract. Institutional growth is stagnant. Access the recruitment terminal to restore faculty operations.
                </p>
              </div>
              <Link to="/stable/trainers" className="mt-4">
                <Button className="bg-primary text-white font-black uppercase tracking-[0.2em] text-[10px] px-10 h-11 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] hover:scale-105 transition-all">
                  Access_Recruitment_Hub
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-black/20 sticky top-0 z-10 backdrop-blur-md border-b border-white/5">
                <TableRow className="hover:bg-transparent border-white/5">
                  <TableHead className="font-black uppercase text-[10px] tracking-widest pl-8 py-4">Personnel_Asset</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground/60 py-4">Classification</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground/60 py-4">Specialization</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-center text-muted-foreground/60 py-4">Tenure_Stability</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-right pr-8 py-4">Weekly_Payroll</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeTrainers.map(t => {
                  const weeksLeft = t.contractWeeksLeft;
                  const pct = Math.min((weeksLeft / 52) * 100, 100);
                  const isExpiring = weeksLeft <= 4;
                  
                  return (
                    <TableRow key={t.id} className="border-white/5 group hover:bg-white/2 transition-colors">
                      <TableCell className="pl-8 py-5">
                        <div className="flex flex-col">
                           <span className="font-display font-black text-sm uppercase tracking-tight group-hover:text-primary transition-colors">{t.name}</span>
                           {t.retiredFromWarrior && (
                             <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest mt-0.5">VETERAN_ID: {t.retiredFromWarrior}</span>
                           )}
                        </div>
                      </TableCell>
                      <TableCell className="py-5">
                        <Badge variant="outline" className={cn(
                          "text-[9px] font-black border-none uppercase tracking-[0.2em] px-3 py-0.5 h-auto",
                          t.tier === "Master" ? "bg-arena-gold/20 text-arena-gold shadow-[0_0_10px_rgba(255,215,0,0.1)]" :
                          t.tier === "Seasoned" ? "bg-primary/20 text-primary" :
                          "bg-secondary/40 text-muted-foreground"
                        )}>
                          {t.tier}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-5">
                        <div className="flex items-center gap-2.5">
                           <div className="h-1.5 w-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                           <span className="text-xs font-black uppercase tracking-widest text-foreground/80 group-hover:text-foreground transition-all">{t.focus}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-5">
                        <Tooltip>
                           <TooltipTrigger asChild>
                              <div className="flex flex-col items-center gap-2 mx-auto w-full max-w-32">
                                 <div className="flex items-center gap-2 w-full">
                                    <div className="h-1.5 flex-1 bg-black rounded-full overflow-hidden border border-white/5 relative">
                                       <div 
                                          className={cn(
                                             "absolute inset-y-0 left-0 transition-all duration-1000",
                                             isExpiring ? "bg-destructive shadow-[0_0_10px_rgba(255,0,0,0.3)] animate-pulse" : "bg-primary"
                                          )} 
                                          style={{ width: `${pct}%` }}
                                       />
                                    </div>
                                    <span className={cn("text-[10px] font-mono font-black min-w-8 text-right", isExpiring ? "text-destructive" : "text-primary/60")}>
                                       {weeksLeft}W
                                    </span>
                                 </div>
                                 {isExpiring && <span className="text-[8px] font-black uppercase text-destructive tracking-[0.2em] animate-pulse">Critical_End_Notice</span>}
                              </div>
                           </TooltipTrigger>
                           <TooltipContent className="bg-neutral-950 border-white/10 text-[9px] font-black tracking-widest">
                              Tenure Remainder: {weeksLeft} Weeks
                           </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-right pr-8 py-5">
                         <div className="flex flex-col items-end">
                            <div className="flex items-center justify-end gap-2 text-sm font-mono font-black text-destructive/80 group-hover:text-destructive group-hover:drop-shadow-[0_0_5px_rgba(255,0,0,0.2)] transition-all">
                               <span>{TRAINER_WEEKLY_SALARY[t.tier] ?? 35}</span>
                               <Coins className="h-4 w-4 text-arena-gold opacity-60" />
                            </div>
                            <span className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-widest mt-0.5">Recurring_Debit</span>
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

      {/* ─── Strategic Personnel Summary ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Surface variant="glass" padding="md" className="bg-neutral-900/40 border-border/10 flex items-center gap-6 group hover:border-destructive/30 transition-all">
           <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 shadow-[0_0_15px_rgba(255,0,0,0.1)] group-hover:bg-destructive/20 transition-all">
              <TrendingDown className="h-6 w-6 text-destructive" />
           </div>
           <div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40">System_Fiscal_Impact</p>
              <p className="text-xl font-mono font-black text-destructive drop-shadow-[0_0_10px_rgba(255,0,0,0.2)]">-{totalWeeklyExpense.toLocaleString()}G / Cycle</p>
              <p className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest mt-1">Aggregated_Personnel_Maintenance</p>
           </div>
        </Surface>
        
        <Surface variant="glass" padding="md" className="bg-neutral-900/40 border-border/10 flex items-center gap-6 group hover:border-primary/30 transition-all">
           <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)] group-hover:bg-primary/20 transition-all">
              <ShieldCheck className="h-6 w-6 text-primary" />
           </div>
           <div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40">Strategic_Operational_Status</p>
              <p className="text-xl font-display font-black uppercase text-foreground group-hover:text-primary transition-colors">Martial_Optimization</p>
              <p className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest mt-1">Institutional_Efficiency_Synced</p>
           </div>
        </Surface>
      </div>
    </div>
  );
}
