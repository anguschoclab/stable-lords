/**
 * Equipment Card Component - Displays detailed equipment information
 * Demonstrates UI/UX connectivity with the modular equipment system
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sword,
  Shield,
  HardHat,
  Shirt,
  AlertTriangle,
  Star,
  Weight,
} from 'lucide-react';
import type { EquipmentItem, WeaponReqResult } from '@/data/equipment';
import { checkWeaponRequirements } from '@/data/equipment';
import { FightingStyle } from '@/types/shared.types';

interface EquipmentCardProps {
  item: EquipmentItem;
  warriorAttrs?: { ST: number; SZ: number; WT: number; DF: number };
  warriorStyle?: FightingStyle;
  showRequirements?: boolean;
}

const SLOT_ICONS: Record<string, React.ReactNode> = {
  weapon: <Sword className="h-4 w-4" />,
  armor: <Shirt className="h-4 w-4" />,
  shield: <Shield className="h-4 w-4" />,
  helm: <HardHat className="h-4 w-4" />,
};

const SLOT_COLORS: Record<string, string> = {
  weapon: 'bg-destructive/10 text-destructive border-destructive/20',
  armor: 'bg-primary/10 text-primary border-primary/20',
  shield: 'bg-arena-pop/10 text-arena-pop border-arena-pop/20',
  helm: 'bg-arena-gold/10 text-arena-gold border-arena-gold/20',
};

const RARITY_COLORS: Record<number, string> = {
  0: 'border-border/40', // Common
  1: 'border-arena-pop/40', // Uncommon
  2: 'border-primary/40', // Rare
  3: 'border-arena-fame/40', // Epic
  4: 'border-arena-gold/60', // Legendary
};

function getEquipmentRarity(item: EquipmentItem): number {
  // Simple rarity calculation based on weight and requirements
  let rarity = 0;
  if (item.weight >= 4) rarity++;
  if (item.reqST && item.reqST >= 11) rarity++;
  if (item.reqWT && item.reqWT >= 11) rarity++;
  if (item.twoHanded) rarity++;
  if (item.slot === 'weapon' && (item.id.includes('great') || item.id.includes('battle'))) rarity++;
  return Math.min(rarity, 4);
}

export function EquipmentCard({ 
  item, 
  warriorAttrs, 
  warriorStyle, 
  showRequirements = false 
}: EquipmentCardProps) {
  const rarity = getEquipmentRarity(item);
  const isPreferred = warriorStyle && item.preferredStyles?.includes(warriorStyle);
  const isRestricted = warriorStyle && item.restrictedStyles?.includes(warriorStyle);
  
  let weaponReqResult: WeaponReqResult | null = null;
  if (showRequirements && warriorAttrs && item.slot === 'weapon') {
    weaponReqResult = checkWeaponRequirements(item.id, warriorAttrs);
  }

  return (
    <Card className={`w-full max-w-sm ${RARITY_COLORS[rarity]} border-2`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {SLOT_ICONS[item.slot]}
            {item.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={SLOT_COLORS[item.slot]}>
              {item.slot}
            </Badge>
            {item.code && (
              <Badge variant="outline" className="text-xs">
                {item.code}
              </Badge>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{item.description}</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Basic Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Weight className="h-4 w-4 text-muted-foreground" />
            <span>Weight: {item.weight}</span>
          </div>
          {item.twoHanded && (
            <div className="flex items-center gap-2">
              <Sword className="h-4 w-4 text-arena-gold" />
              <span className="text-arena-gold">Two-Handed</span>
            </div>
          )}
        </div>

        {/* Style Compatibility */}
        {warriorStyle && (
          <>
            <Separator />
            <div>
              <h4 className="font-semibold text-sm mb-2">Style Compatibility</h4>
              <div className="space-y-2">
                {isPreferred && (
                  <div className="flex items-center gap-2 text-primary">
                    <Star className="h-4 w-4" />
                    <span className="text-sm">Preferred for {warriorStyle}</span>
                  </div>
                )}
                {isRestricted && (
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">Restricted for {warriorStyle}</span>
                  </div>
                )}
                {!isPreferred && !isRestricted && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm">Compatible with {warriorStyle}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Weapon Requirements */}
        {showRequirements && weaponReqResult && (
          <>
            <Separator />
            <div>
              <h4 className="font-semibold text-sm mb-2">Requirements</h4>
              <div className="space-y-2">
                {item.reqST && (
                  <div className="flex justify-between text-sm">
                    <span>Strength:</span>
                    <span className={warriorAttrs && warriorAttrs.ST < item.reqST ? 'text-destructive' : 'text-primary'}>
                      {warriorAttrs?.ST || 0} / {item.reqST}
                    </span>
                  </div>
                )}
                {item.reqSZ && (
                  <div className="flex justify-between text-sm">
                    <span>Size:</span>
                    <span className={warriorAttrs && warriorAttrs.SZ < item.reqSZ ? 'text-destructive' : 'text-primary'}>
                      {warriorAttrs?.SZ || 0} / {item.reqSZ}
                    </span>
                  </div>
                )}
                {item.reqWT && (
                  <div className="flex justify-between text-sm">
                    <span>Wit:</span>
                    <span className={warriorAttrs && warriorAttrs.WT < item.reqWT ? 'text-destructive' : 'text-primary'}>
                      {warriorAttrs?.WT || 0} / {item.reqWT}
                    </span>
                  </div>
                )}
                {item.reqDF && (
                  <div className="flex justify-between text-sm">
                    <span>Deftness:</span>
                    <span className={warriorAttrs && warriorAttrs.DF < item.reqDF ? 'text-destructive' : 'text-primary'}>
                      {warriorAttrs?.DF || 0} / {item.reqDF}
                    </span>
                  </div>
                )}
              </div>
              
              {!weaponReqResult.met && (
                <div className="mt-3 p-2 bg-destructive/10 rounded-none">
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Penalties: ATT {weaponReqResult.attPenalty}, Endurance +{(weaponReqResult.endurancePenalty - 1) * 100}%</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Preferred Styles */}
        {item.preferredStyles && item.preferredStyles.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-semibold text-sm mb-2">Preferred Styles</h4>
              <div className="flex flex-wrap gap-1">
                {item.preferredStyles.map((style: string) => (
                  <Badge key={style} variant="secondary" className="text-xs">
                    {style}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Restricted Styles */}
        {item.restrictedStyles && item.restrictedStyles.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-semibold text-sm mb-2">Restricted Styles</h4>
              <div className="flex flex-wrap gap-1">
                {item.restrictedStyles.map((style: string) => (
                  <Badge key={style} variant="destructive" className="text-xs">
                    {style}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Shield Coverage */}
        {item.coverage && (
          <>
            <Separator />
            <div>
              <h4 className="font-semibold text-sm mb-2">Shield Coverage</h4>
              <Badge variant="outline" className="text-xs">
                {item.coverage}
              </Badge>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Equipment Gallery Component - Displays multiple equipment items
 */
export function EquipmentGallery({
  items,
  warriorAttrs,
  warriorStyle,
  showRequirements = false,
}: {
  items: EquipmentItem[];
  warriorAttrs?: { ST: number; SZ: number; WT: number; DF: number };
  warriorStyle?: FightingStyle;
  showRequirements?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <EquipmentCard
          key={item.id}
          item={item}
          warriorAttrs={warriorAttrs}
          warriorStyle={warriorStyle}
          showRequirements={showRequirements}
        />
      ))}
    </div>
  );
}
