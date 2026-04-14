import React from "react";
import { useGameStore, useWorldState } from "@/state/useGameStore";
import { Cloud, Sun, CloudRain, ThermometerSun, Wind, Info, Moon } from "lucide-react";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const WEATHER_METADATA = {
  Clear: {
    icon: Sun,
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    border: "border-yellow-400/20",
    description: "Optimal conditions. No environmental modifiers applied to combat resolution.",
    stats: "NORMAL_VISIBILITY // ZERO_DRAIN"
  },
  Overcast: {
    icon: Cloud,
    color: "text-slate-400",
    bg: "bg-slate-400/10",
    border: "border-slate-400/20",
    description: "Cloudy skies. Slight reduction in precision for ranged and lunging attacks.",
    stats: "LOW_VISIBILITY // STABLE_ENDURANCE"
  },
  Rainy: {
    icon: CloudRain,
    color: "text-stone-400",
    bg: "bg-stone-400/10",
    border: "border-stone-400/20",
    description: "Driving rain. Significant penalties to precision and initiative. Footing is uncertain.",
    stats: "PRECISION_PENALTY_15% // INITIATIVE_-10"
  },
  Gale: {
    icon: Wind,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    description: "Fierce winds. Substantial penalty to stamina.",
    stats: "STAMINA_DRAIN_115%"
  },
  Scalding: {
    icon: ThermometerSun,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    description: "Oppressive heat. Endurance consumption is doubled. High-constitution warriors favored.",
    stats: "ENDURANCE_DRAIN_200% // FATIGUE_ACCEL"
  },
  Drafty: {
    icon: Wind,
    color: "text-stone-300",
    bg: "bg-stone-300/10",
    border: "border-stone-300/20",
    description: "Strong shifting winds. Erratic initiative modifiers and slight energy drain.",
    stats: "INITIATIVE_FLUX // STAMINA_DRAIN_120%"
  },
  Eclipse: {
    icon: Moon,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    description: "Eerie darkness descends. Fights become slow and methodical as combatants hesitate.",
    stats: "STAMINA_CONSERVATION_20% // HESITATION"
  }
};

export function WeatherWidget() {
  const state = useWorldState();
  const weather = state.weather || "Clear";
  const meta = WEATHER_METADATA[weather as keyof typeof WEATHER_METADATA] || WEATHER_METADATA.Clear;
  const Icon = meta.icon;

  return (
    <Surface variant="glass" className="h-full flex flex-col p-5 border-l-4 border-l-primary animate-in fade-in zoom-in-95 duration-500 delay-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Cloud className="h-4 w-4 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Arena_Environment</span>
        </div>
        <Badge variant="outline" className={cn("text-[9px] font-black tracking-widest uppercase", meta.border, meta.bg, meta.color)}>
           {weather}
        </Badge>
      </div>

      <div className="flex items-center justify-between mb-4">
         <Icon className={cn("h-10 w-10 drop-shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]", meta.color)} />
         <div className="text-right">
           <div className="text-[8px] text-muted-foreground uppercase font-black tracking-widest mb-1">Atmospheric_Data</div>
           <p className="text-[10px] text-muted-foreground italic leading-tight w-full max-w-36 border-r-2 border-primary/20 pr-3">
             {meta.description}
           </p>
         </div>
      </div>
      
      <div className="mt-auto pt-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="rounded-md border border-white/5 p-2 bg-white/[0.02] cursor-help transition-all hover:bg-white/[0.05] hover:border-white/10 flex items-center justify-between">
                <span className="text-[8px] text-muted-foreground uppercase font-black tracking-widest">Active_Modifiers</span>
                <Info className="h-3 w-3 text-muted-foreground/40" />
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-black/90 border-white/10 p-3 w-full max-w-xs">
              <p className="text-[10px] font-mono leading-relaxed text-primary/80 uppercase tracking-wider">
                {meta.stats}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </Surface>
  );
}
