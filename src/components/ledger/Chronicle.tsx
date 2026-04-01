import React, { useMemo } from "react";
import { useGameStore } from "@/state/useGameStore";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/badge";
import { ScrollText, BookOpen, Clock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function Chronicle() {
  const { state } = useGameStore();
  
  const news = useMemo(
    () => [...(state.newsletter || [])].reverse().slice(0, 50),
    [state.newsletter]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 px-1">
        <ScrollText className="h-5 w-5 text-primary/60" />
        <h3 className="font-display text-lg font-black uppercase tracking-tight">The Stable Chronicle</h3>
        <div className="h-px flex-1 bg-gradient-to-r from-primary/20 via-border/20 to-transparent" />
      </div>

      {news.length === 0 ? (
        <Surface variant="glass" className="py-20 text-center flex flex-col items-center gap-4 border-dashed border-border/40">
          <BookOpen className="h-12 w-12 text-muted-foreground opacity-20" />
          <div className="space-y-1">
            <p className="text-sm font-display font-black uppercase tracking-tight text-muted-foreground">The Chronicle is Vacant</p>
            <p className="text-xs text-muted-foreground/60 italic">Your journey begins once the first bout is concluded.</p>
          </div>
        </Surface>
      ) : (
        <div className="relative border-l-2 border-primary/20 ml-3 pl-8 space-y-8">
          {news.map((n, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative"
            >
              <div className="absolute -left-[45px] top-0 p-1.5 rounded-full bg-background border-2 border-primary/40 shadow-[0_0_10px_rgba(255,0,0,0.2)]">
                <Clock className="h-3 w-3 text-primary" />
              </div>
              
              <Surface variant="glass" padding="md" className="border-border/30 hover:border-primary/20 transition-colors group">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-display font-black uppercase tracking-tight group-hover:text-primary transition-colors">{n.title}</h4>
                  <Badge variant="outline" className="text-[10px] font-mono font-black border-primary/20 bg-primary/5 text-primary">
                    WK_{n.week.toString().padStart(2, '0')}
                  </Badge>
                </div>
                
                <ul className="space-y-2">
                  {n.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-foreground/80 leading-relaxed font-medium">
                      <ChevronRight className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Surface>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
