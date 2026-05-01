import React from 'react';
import { Surface } from '@/components/ui/Surface';
import { cn } from '@/lib/utils';
import { type Warrior } from '@/types/warrior.types';
import { LayoutDashboard, Swords, FileText, Activity } from 'lucide-react';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TABS = [
  { id: 'overview', label: 'Tactical Overview', icon: LayoutDashboard },
  { id: 'stats', label: 'Combat Attributes', icon: Activity },
  { id: 'history', label: 'Engagement Log', icon: Swords },
  { id: 'biography', label: 'Subject History', icon: FileText },
];

export default function WarriorDossierTabs({ activeTab, setActiveTab }: Props) {
  return (
    <div className="flex items-center gap-8 border-b border-white/5">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={cn(
            'flex items-center gap-2 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative',
            activeTab === tab.id ? 'text-primary' : 'text-muted-foreground/40 hover:text-foreground'
          )}
        >
          <tab.icon className="h-3.5 w-3.5" />
          {tab.label}
          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />
          )}
        </button>
      ))}
    </div>
  );
}
