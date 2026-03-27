import React from "react";
import { useGameStore } from "@/state/useGameStore";
import { cn } from "@/lib/utils";

export interface SubNavTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface SubNavProps {
  tabs: SubNavTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function SubNav({ tabs, activeTab, onTabChange }: SubNavProps) {
  const isFTUE = useGameStore(s => s.state.isFTUE);
  if (isFTUE) return null;

  return (
    <div className="sticky top-0 z-30 -mx-6 px-6 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40">
      <nav className="flex gap-1 overflow-x-auto no-scrollbar scroll-smooth">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            aria-current={activeTab === tab.id ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 px-4 py-4 text-xs font-black uppercase tracking-widest transition-all relative group",
              activeTab === tab.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground/80"
            )}
          >
            {tab.icon && (
              <span className={cn(
                "transition-transform duration-300 group-hover:scale-110",
                activeTab === tab.id ? "text-primary" : "text-muted-foreground/50"
              )}>
                {tab.icon}
              </span>
            )}
            {tab.label}
            
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-t-full shadow-[0_-4px_10px_rgba(34,197,94,0.4)]" />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
