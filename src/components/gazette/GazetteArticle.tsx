import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Newspaper, Quote, Sparkles, Zap, Trophy, History, MessageSquare, ArrowRight, ExternalLink } from "lucide-react";
import { MarkdownReader } from "@/components/MarkdownReader";

interface GazetteIssue {
  week: number;
  mainHeadline: string;
  mainStory: string;
  sideStories: string[];
}

interface GazetteArticleProps {
  issue: GazetteIssue;
  season: string;
}

export function GazetteArticle({ issue, season }: GazetteArticleProps) {
  return (
    <Surface variant="glass" padding="none" className="border-border/10 bg-neutral-900/40 overflow-hidden shadow-2xl group transition-all duration-700 hover:shadow-primary/5">
      {/* ─── Masthead Branding ─── */}
      <div className="p-8 md:p-12 border-b border-white/5 relative overflow-hidden bg-black/40">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
           <Newspaper className="h-40 w-40" />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10">
           <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <Badge className="bg-primary/20 text-primary border-primary/30 font-mono font-black text-[10px] px-3 tracking-widest">
                    EDITION_SYNC: WK_{issue.week.toString().padStart(2, '0')}
                 </Badge>
                 <div className="h-1 w-1 rounded-full bg-white/20" />
                 <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.4em]">SEASON_{season} // VOLUME_IV</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-display font-black uppercase tracking-tighter text-white leading-[0.95] max-w-4xl group-hover:text-primary transition-colors duration-500">
                 {issue.mainHeadline.replace("_", " ")}
              </h2>
           </div>
           
           <div className="flex flex-col items-end gap-1 opacity-40 group-hover:opacity-80 transition-opacity">
              <span className="text-[9px] font-black uppercase tracking-[0.5em] text-muted-foreground">PRESS_CERTIFIED</span>
              <div className="flex items-center gap-2">
                 <Sparkles className="h-3 w-3 text-arena-gold" />
                 <span className="text-[8px] font-mono font-black text-white/50">HASH: {Math.random().toString(16).slice(2, 10).toUpperCase()}</span>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/5 bg-black/20">
        {/* ─── The Lead Story ─── */}
        <div className="lg:col-span-8 p-8 md:p-12 space-y-8 relative group/story">
          <div className="absolute top-12 left-12 opacity-5 pointer-events-none group-hover/story:opacity-10 transition-opacity">
             <Quote className="h-24 w-24 text-primary" />
          </div>
          
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-3">
               <div className="h-px w-8 bg-primary/40" />
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">FEATURE_DISPATCH</span>
            </div>
            
            <MarkdownReader content={issue.mainStory} />
            
            <div className="pt-6 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                     {[1, 2].map((i) => (
                        <div key={i} className="h-6 w-6 rounded-full border border-black bg-white/5 flex items-center justify-center">
                           <History className="h-3 w-3 text-muted-foreground" />
                        </div>
                     ))}
                  </div>
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Contributed_By: ARCHIVE_BOTS</span>
               </div>
               <Button variant="ghost" className="h-8 group/btn text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 px-4">
                  Full_Transcript <ArrowRight className="ml-2 h-3 w-3 group-hover/btn:translate-x-1 transition-transform" />
               </Button>
            </div>
          </div>
        </div>

        {/* ─── The Side Registry ─── */}
        <div className="lg:col-span-4 p-8 md:p-12 bg-white/[0.01] space-y-10">
           <div className="space-y-6">
              <div className="flex items-center justify-between">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground opacity-40">ARENA_SHORTS</h4>
                 <div className="h-1.5 w-1.5 rounded-full bg-arena-gold animate-pulse" />
              </div>
              
              <div className="space-y-8">
                {issue.sideStories.map((story, i) => (
                  <div key={i} className="group/short space-y-3 relative pl-6 border-l border-white/5 hover:border-arena-gold/30 transition-all">
                    <div className="absolute -left-0.5 top-0 w-1 h-3 bg-arena-gold opacity-0 group-hover/short:opacity-100 transition-opacity shadow-[0_0_10px_rgba(255,215,0,0.5)]" />
                    <div className="flex items-center gap-2">
                       <Zap className="h-3 w-3 text-arena-gold opacity-40 group-hover/short:opacity-100 transition-opacity" />
                       <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 group-hover/short:text-arena-gold transition-colors">INTEL_FRAGMENT</span>
                    </div>
                    <div className="text-[11px] md:text-xs text-muted-foreground group-hover/short:text-foreground transition-colors leading-relaxed font-medium">
                       <MarkdownReader content={story} />
                    </div>
                  </div>
                ))}
              </div>
           </div>

           <div className="pt-6 border-t border-white/5 space-y-4">
              <Surface variant="paper" padding="sm" className="bg-primary/5 border border-primary/20 hover:border-primary/40 transition-all cursor-pointer group/cta">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <Trophy className="h-4 w-4 text-primary" />
                       <span className="text-[9px] font-black uppercase tracking-widest text-primary/80 group-hover:text-primary transition-colors">Bout_Replays_Active</span>
                    </div>
                    <ExternalLink className="h-3 w-3 text-white/20 group-hover:text-primary transition-colors" />
                 </div>
              </Surface>
              <div className="flex items-center justify-center gap-2 opacity-20">
                 <MessageSquare className="h-3 w-3" />
                 <span className="text-[8px] font-black uppercase tracking-[0.3em]">REACTION_LOGS_LOCKED</span>
              </div>
           </div>
        </div>
      </div>
    </Surface>
  );
}
