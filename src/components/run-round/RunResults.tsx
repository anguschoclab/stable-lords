import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Skull, Activity, Swords, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import BoutViewer from "@/components/BoutViewer";
import type { BoutResult } from "@/engine/boutProcessor";
import { cn } from "@/lib/utils";

interface RunResultsProps {
  results: BoutResult[];
  expandedId: string | null;
  onToggleExpand: (id: string | null) => void;
}

export function RunResults({ results, expandedId, onToggleExpand }: RunResultsProps) {
  if (results.length === 0) return null;

  const deaths = results.filter(r => r.outcome.by === "Kill").length;
  const KOs = results.filter(r => r.outcome.by === "KO").length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 px-2">
        <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Post_Engagement_Analysis</h3>
        <div className="h-px flex-1 bg-border/20" />
        <div className="flex gap-4">
           {deaths > 0 && <span className="text-[10px] font-black text-destructive uppercase tracking-widest flex items-center gap-1.5"><Skull className="h-3 w-3" /> {deaths}_CASUALTIES</span>}
           {KOs > 0 && <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5"><Activity className="h-3 w-3" /> {KOs}_KOS</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {results.map((res, idx) => {
          const id = `res_${idx}`;
          const isExpanded = expandedId === id;
          const isWinnerA = res.outcome.winner === "A";
          const isWinnerD = res.outcome.winner === "D";

          return (
            <Collapsible key={id} open={isExpanded} onOpenChange={() => onToggleExpand(isExpanded ? null : id)}>
              <Card className={cn(
                "border-border/30 bg-glass-card shadow-sm transition-all overflow-hidden",
                isExpanded ? "border-primary/40 ring-1 ring-primary/20 shadow-lg" : "hover:border-border/60"
              )}>
                <CollapsibleTrigger asChild>
                  <div className="p-4 cursor-pointer flex items-center justify-between group">
                    <div className="flex items-center gap-6 flex-1">
                       <div className="flex items-center gap-3 min-w-[140px]">
                          <div className={cn("w-1.5 h-6 rounded-full", isWinnerA ? "bg-primary" : "bg-muted-foreground/20")} />
                          <span className={cn("font-display font-black uppercase text-xs tracking-tight", isWinnerA ? "text-primary" : "text-muted-foreground")}>
                            {res.a.name}
                          </span>
                       </div>
                       
                       <div className="flex flex-col items-center gap-0.5 px-4">
                          <span className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-widest">VS</span>
                          <Badge variant="outline" className="text-[7px] font-black uppercase tracking-widest h-4 bg-secondary/20 border-border/40">
                            {res.outcome.by}
                          </Badge>
                       </div>

                       <div className="flex items-center gap-3 min-w-[140px] justify-end text-right">
                          <span className={cn("font-display font-black uppercase text-xs tracking-tight", isWinnerD ? "text-primary" : "text-muted-foreground")}>
                            {res.d.name}
                          </span>
                          <div className={cn("w-1.5 h-6 rounded-full", isWinnerD ? "bg-primary" : "bg-muted-foreground/20")} />
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-4 ml-6">
                       {res.outcome.by === "Kill" && <Skull className="h-4 w-4 text-destructive animate-pulse" />}
                       {res.outcome.by === "KO" && <Zap className="h-4 w-4 text-amber-500" />}
                       <div className={cn(
                         "p-1.5 rounded-lg border border-border/20 transition-colors",
                         isExpanded ? "bg-primary/20 text-primary border-primary/20" : "bg-secondary/40 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                       )}>
                         {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                       </div>
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="px-4 pb-4 border-t border-border/10 bg-secondary/10 pt-4">
                    <BoutViewer
                      nameA={res.a.name}
                      nameD={res.d.name}
                      styleA={res.a.style}
                      styleD={res.d.style}
                      log={res.outcome.log}
                      winner={res.outcome.winner}
                      by={res.outcome.by}
                      isRivalry={res.isRivalry}
                    />
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
