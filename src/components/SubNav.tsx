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
    <div className="sticky top-12 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="flex gap-0.5 overflow-x-auto -mb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
              activeTab === tab.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
