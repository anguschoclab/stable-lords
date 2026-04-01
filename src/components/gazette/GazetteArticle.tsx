import React from "react";
import { motion } from "framer-motion";
import { Newspaper, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MarkdownReader } from "@/components/MarkdownReader";
import { Surface } from "@/components/ui/Surface";
import type { GazetteStory } from "@/types/game";

interface GazetteArticleProps {
  issue: GazetteStory;
  state: any;
}

export function GazetteArticle({ issue, state }: GazetteArticleProps) {
  return (
    <motion.article 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative"
    >
      <Surface 
        variant="paper" 
        padding="none" 
        className="group overflow-hidden border-double border-4 border-foreground/10 hover:border-foreground/20 transition-colors"
      >
        {/* Masthead Detail */}
        <div className="absolute top-0 left-0 w-full h-1 bg-foreground/10" />
        
        <div className="p-8 md:p-12 lg:p-16 space-y-10">
          {/* Header Section */}
          <div className="space-y-6 border-b-2 border-foreground/30 pb-10">
            <div className="flex items-center justify-between text-[10px] font-black tracking-[0.4em] uppercase text-foreground/40 border-b border-foreground/10 pb-4">
              <span className="flex items-center gap-2">
                 <Newspaper className="h-4 w-4" /> 
                 VOL. {Math.floor(issue.week / 4) + 1} // NO. {issue.week}
              </span>
              <span className="text-foreground/20 italic">{state.season} // WEEK {issue.week}</span>
              <span className="hidden sm:inline">ARENA DISTRICT CORE EDITION</span>
            </div>
            
            <h2 className="text-5xl md:text-7xl lg:text-8xl text-foreground font-black tracking-tighter leading-[0.8] uppercase text-center md:text-left py-4 selection:bg-primary selection:text-white">
              {issue.headline}
            </h2>

            <div className="flex flex-wrap gap-4 items-center justify-center md:justify-start">
              <Badge className="bg-foreground text-background text-[10px] font-black tracking-[0.2em] uppercase px-4 py-1.5 rounded-none border-none">
                EXTRA_EDITION
              </Badge>
              <Separator orientation="vertical" className="h-5 bg-foreground/20" />
              <div className="flex flex-wrap gap-3">
                {issue.tags.map(tag => (
                  <span key={tag} className="text-[11px] font-mono font-black tracking-widest text-foreground/60 uppercase hover:text-primary transition-colors cursor-default">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8 gazette-content first-letter:text-8xl first-letter:font-black first-letter:float-left first-letter:mr-4 first-letter:mt-2 first-letter:text-primary first-letter:leading-none text-lg leading-relaxed text-justify font-serif text-foreground/80 selection:bg-primary/20">
               <MarkdownReader content={issue.body} />
            </div>
            
            <aside className="lg:col-span-4 space-y-8 lg:border-l lg:border-foreground/10 lg:pl-8">
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-[0.3em] pb-2 border-b border-foreground/20">District Intel</h4>
                <div className="space-y-4">
                   <p className="text-xs leading-relaxed italic text-foreground/60">
                     "The sands do not lie. Every drop of blood spilled this week tells a story of ambition, failure, and the relentless pursuit of glory." 
                     <span className="block mt-2 font-black not-italic text-[10px] uppercase opacity-40">— ARENA OVERWATCH</span>
                   </p>
                </div>
              </div>
              
              <div className="p-4 bg-foreground/5 border border-foreground/10 space-y-2">
                 <span className="text-[9px] font-black uppercase tracking-widest text-primary">PUBLIC NOTICE</span>
                 <p className="text-[10px] leading-relaxed text-foreground/70 font-medium">
                   All combatants must register secondary style adaptations by the third clock. Failure to comply results in notoriety penalties.
                 </p>
              </div>
            </aside>
          </div>
          
          {/* Footer Detail */}
          <div className="flex flex-col md:flex-row items-center justify-between border-t-2 border-foreground/30 pt-8 mt-12 opacity-40 group-hover:opacity-60 transition-opacity">
            <span className="text-[11px] font-black uppercase tracking-[0.5em] mb-4 md:mb-0">THE TRUTH REMAINS WHEN THE BLOOD DRIES</span>
            <div className="flex items-center gap-8">
                <span className="text-[11px] font-black uppercase tracking-widest">PRICE: 2 COPPER</span>
                <Separator orientation="vertical" className="h-5 bg-foreground/40" />
                <span className="text-[11px] font-black uppercase tracking-widest font-mono">EST. 412 AE</span>
            </div>
          </div>
        </div>
      </Surface>
    </motion.article>
  );
}
