import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Fingerprint, History, Activity } from 'lucide-react';
import WarriorPaperDoll from '@/components/WarriorPaperDoll';
import { LineageTree } from '@/components/stable/LineageTree';
import type { Warrior } from '@/types/warrior.types';

interface WarriorDossierTabsProps {
  warrior: Warrior;
}

export function WarriorDossierTabs({ warrior }: WarriorDossierTabsProps) {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full bg-neutral-900 border border-white/5 p-1 rounded-none h-10">
          <TabsTrigger
            value="overview"
            className="flex-1 text-[9px] font-black uppercase tracking-widest rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Fingerprint className="h-3 w-3 mr-2" /> Biometrics
          </TabsTrigger>
          <TabsTrigger
            value="lineage"
            className="flex-1 text-[9px] font-black uppercase tracking-widest rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <History className="h-3 w-3 mr-2" /> Lineage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <Card className="bg-glass border-arena-blood/10 overflow-hidden relative">
            <CardHeader className="pb-0 pt-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-[9px] uppercase tracking-widest text-muted-foreground font-black">
                Trauma Mapping
              </CardTitle>
              <Activity className="h-3 w-3 text-arena-blood animate-pulse" />
            </CardHeader>
            <CardContent className="flex justify-center p-4">
              <WarriorPaperDoll
                injuries={warrior.injuries}
                isWeaponMastered={
                  !!(
                    warrior.favorites?.weaponId &&
                    warrior.equipment?.weapon === warrior.favorites.weaponId &&
                    warrior.favorites.discovered.weapon
                  )
                }
                size={140}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lineage" className="mt-4">
          <LineageTree lineage={warrior.lineage} warriorName={warrior.name} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
