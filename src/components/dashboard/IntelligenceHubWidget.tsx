import React, { useMemo } from "react";
import { useGameStore } from "@/state/useGameStore";
import { Newspaper, Bell, Quote, ChevronRight, Info, Zap, TrendingUp, Target, Activity, Send } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function IntelligenceHubWidget() {
  const { state } = useGameStore();

  const recentGazettes = useMemo(() => {
    return [...(state.gazettes || [])]
      .sort((a, b) => b.week - a.week)
      .slice(0, 5);
  }, [state.gazettes]);

  const recentNewsletter = useMemo(() => {
    return [...(state.newsletter || [])]
      .sort((a, b) => b.week - a.week)
      .slice(0, 5);
  }, [state.newsletter]);

  const totalCommCount = recentGazettes.length + recentNewsletter.length;

  return (
    <Surface variant="glass" padding="none" className="h-full border-border/10 group overflow-hidden relative flex flex-col shadow-2xl md:col-span-2">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
         <Send className="h-48 w-48 text-primary" />
      </div>

      <div className="p-6 border-b border-white/5 bg-neutral-900/40 relative z-10 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]">
               <Newspaper className="h-5 w-5 text-primary" />
            </div>
            <div>
               <h3 className="font-display text-base font-black uppercase tracking-tight">Intelligence_Hub</h3>
               <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">Tactical_Comms_Synchronizer</p>
            </div>
         </div>
         <Badge variant="outline" className="text-[9px] font-mono font-black border-white/10 bg-white/5 text-muted-foreground/60 h-7 px-3 tracking-widest uppercase">
            {totalCommCount.toString().padStart(2, '0')} ACTIVE_STREAMS
         </Badge>
      </div>

      <div className="p-0 flex-1 relative z-10 overflow-hidden">
        <Tabs defaultValue="gazette" className="h-full flex flex-col">
          <div className="px-6 border-b border-white/5 bg-black/20">
            <TabsList className="bg-transparent border-none gap-6 h-10">
              <TabsTrigger 
                value="gazette" 
                className="bg-transparent border-none p-0 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 data-[state=active]:text-primary data-[state=active]:shadow-none relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:scale-x-0 data-[state=active]:after:scale-x-100 after:transition-transform"
              >
                Gazette_Feed
              </TabsTrigger>
              <TabsTrigger 
                value="briefing" 
                className="bg-transparent border-none p-0 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 data-[state=active]:text-arena-gold data-[state=active]:shadow-none relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-arena-gold after:scale-x-0 data-[state=active]:after:scale-x-100 after:transition-transform"
              >
                Intelligence_Reports
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="gazette" className="m-0 h-full">
              <ScrollArea className="h-72 px-6">
                {recentGazettes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 opacity-20">
                    <Zap className="h-8 w-8 mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">No_Arena_Transmission</p>
                  </div>
                ) : (
                  <div className="py-6 space-y-8">
                    {recentGazettes.map((story, i) => (
                      <div key={i} className="group/story relative pl-12 border-l border-white/5 hover:border-primary/40 transition-colors py-1">
                        <div className="absolute left-[-5px] top-2 h-2.5 w-2.5 rounded-full bg-neutral-800 border boder-white/10 group-hover/story:bg-primary group-hover/story:shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)] transition-all" />
                        
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-[9px] font-mono font-black text-primary/60">WK_{story.week.toString().padStart(2, '0')}</span>
                          <h4 className="text-xs font-black uppercase tracking-tight text-foreground/80 group-hover/story:text-foreground transition-colors italic">
                            {story.headline}
                          </h4>
                        </div>
                        
                        <div className="relative">
                          <Quote className="absolute -left-6 top-0 h-4 w-4 text-primary/10" />
                          <p className="text-[11px] text-muted-foreground/70 group-hover/story:text-muted-foreground leading-relaxed italic line-clamp-3">
                            {story.body}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="h-6" />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="briefing" className="m-0 h-full">
              <ScrollArea className="h-72 px-6">
                {recentNewsletter.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 opacity-20">
                    <Info className="h-8 w-8 mb-4 text-arena-gold" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">No_Strategic_Intel</p>
                  </div>
                ) : (
                  <div className="py-6 space-y-8">
                    {recentNewsletter.map((report, i) => (
                      <div key={i} className="group/report relative space-y-3 bg-white/[0.02] border border-white/5 rounded-2xl p-4 hover:border-arena-gold/30 transition-all">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="p-1.5 rounded-lg bg-arena-gold/10 border border-arena-gold/20">
                                <Zap className="h-3 w-3 text-arena-gold" />
                              </div>
                              <span className="text-[9px] font-mono font-black text-arena-gold opacity-60 uppercase tracking-widest">Wk_{report.week} Strategic_Update</span>
                           </div>
                        </div>
                        
                        <h4 className="text-xs font-black uppercase tracking-tight text-arena-gold/80 group-hover/report:text-arena-gold transition-colors">
                           {report.title}
                        </h4>
                        
                        <ul className="space-y-2">
                           {report.items.map((item, j) => (
                              <li key={j} className="flex gap-3 text-[10px] text-muted-foreground leading-relaxed">
                                 <span className="text-arena-gold/40 font-mono mt-0.5">[{j+1}]</span>
                                 <span className="flex-1">{item}</span>
                              </li>
                           ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
                <div className="h-6" />
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <div className="p-4 border-t border-white/5 bg-black/40 flex justify-center relative z-10 mt-auto">
         <Link 
            to="/world/gazette"
            className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground hover:text-primary transition-colors opacity-40 hover:opacity-100 flex items-center gap-2 group"
         >
            Sync_Full_Archive <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
         </Link>
      </div>
    </Surface>
  );
}
