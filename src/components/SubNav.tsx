import React from 'react';
import { useGameStore, useWorldState } from '@/state/useGameStore';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
  const state = useWorldState();
  const isFTUE = state.isFTUE;
  if (isFTUE) return null;

  return (
    <div className="sticky top-0 z-30 -mx-6 px-6 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40">
      <nav className="flex gap-1 overflow-x-auto no-scrollbar scroll-smooth">
        {tabs.map((tab) => (
          <Tooltip key={tab.id}>
            <TooltipTrigger asChild>
              <button
                aria-label={`Switch to ${tab.label} tab`}
                onClick={() => onTabChange(tab.id)}
                aria-current={activeTab === tab.id ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2 px-4 py-4 text-xs font-black uppercase tracking-widest transition-all relative group',
                  activeTab === tab.id
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground/80'
                )}
              >
                {tab.icon && (
                  <span
                    className={cn(
                      'transition-transform duration-300 group-hover:scale-110',
                      activeTab === tab.id ? 'text-primary' : 'text-muted-foreground/50'
                    )}
                  >
                    {tab.icon}
                  </span>
                )}
                {tab.label}

                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-none shadow-[0_-4px_10px_rgba(var(--arena-blood-rgb),0.5)]" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={0}>
              <p className="text-[10px] font-black uppercase tracking-widest">{tab.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </nav>
    </div>
  );
}
