/**
 * Stable Lords — Equipment Loadout UI
 * Slot-based equipment selection with style restrictions, encumbrance tracking,
 * and canonical weapon requirement checks with visible penalty warnings.
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Shield,
  Swords,
  HardHat,
  Shirt,
  AlertTriangle,
  Star,
  XCircle,
  CheckCircle2,
} from 'lucide-react';
import { FightingStyle, STYLE_DISPLAY_NAMES } from '@/types/game';
import {
  type EquipmentLoadout as Loadout,
  type EquipmentSlot,
  getAvailableItems,
  getItemById,
  getLoadoutWeight,
  isPreferredWeapon,
  isOverEncumbered,
  checkWeaponRequirements,
  validateLoadout,
  type WeaponReqResult,
} from '@/data/equipment';

interface Props {
  loadout: Loadout;
  style: FightingStyle;
  carryCap: number;
  /** Warrior attributes for weapon requirement checks */
  warriorAttrs?: { ST: number; SZ: number; WT: number; DF: number };
  onChange: (loadout: Loadout) => void;
}

const SLOT_CONFIG: { slot: EquipmentSlot; label: string; icon: React.ReactNode }[] = [
  { slot: 'weapon', label: 'Weapon', icon: <Swords className="h-4 w-4" /> },
  { slot: 'armor', label: 'Armor', icon: <Shirt className="h-4 w-4" /> },
  { slot: 'shield', label: 'Shield', icon: <Shield className="h-4 w-4" /> },
  { slot: 'helm', label: 'Helm', icon: <HardHat className="h-4 w-4" /> },
];

function WeaponRequirementBadge({ reqResult }: { reqResult: WeaponReqResult }) {
  if (reqResult.met) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className="text-[10px] py-0 px-1 border-primary/30 text-primary gap-0.5"
            >
              <CheckCircle2 className="h-2.5 w-2.5" /> Reqs met
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            All stat requirements satisfied — no penalties.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="destructive" className="text-[10px] py-0 px-1 gap-0.5 animate-pulse">
            <XCircle className="h-2.5 w-2.5" /> {reqResult.failures.length} req
            {reqResult.failures.length > 1 ? 's' : ''} failed
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="space-y-1.5 max-w-64">
          <p className="font-semibold text-destructive text-xs">Weapon Requirement Failures</p>
          {reqResult.failures.map((f) => (
            <div key={f.stat} className="flex items-center gap-2 text-xs">
              <span className="text-destructive font-mono font-bold">{f.stat}</span>
              <span>
                {f.label}: need {f.required}, have{' '}
                <span className="text-destructive font-semibold">{f.current}</span>
              </span>
              <span className="text-muted-foreground">(−{f.deficit})</span>
            </div>
          ))}
          <div className="border-t border-border pt-1 mt-1 space-y-0.5">
            <p className="text-[10px] text-destructive">Penalties: {reqResult.attPenalty} ATT</p>
            <p className="text-[10px] text-destructive">
              Endurance cost ×{reqResult.endurancePenalty.toFixed(2)}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function SlotSelector({
  slot,
  label,
  icon,
  selectedId,
  style,
  disabled,
  warriorAttrs,
  onChange,
}: {
  slot: EquipmentSlot;
  label: string;
  icon: React.ReactNode;
  selectedId: string;
  style: FightingStyle;
  disabled: boolean;
  warriorAttrs?: { ST: number; SZ: number; WT: number; DF: number };
  onChange: (id: string) => void;
}) {
  const items = getAvailableItems(slot, style);
  const selected = getItemById(selectedId);
  const isPreferred = selected && slot === 'weapon' && isPreferredWeapon(selected, style);
  const reqResult =
    slot === 'weapon' && warriorAttrs ? checkWeaponRequirements(selectedId, warriorAttrs) : null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
        {selected && selected.weight > 0 && (
          <Badge variant="outline" className="text-xs ml-auto font-mono">
            {selected.weight} enc
          </Badge>
        )}
        {isPreferred && <Star className="h-3.5 w-3.5 text-arena-gold fill-arena-gold" />}
      </div>
      <Select value={selectedId} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(() => {
            if (slot !== 'weapon' || !warriorAttrs) {
              return items.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  <span>{item.name}</span>
                </SelectItem>
              ));
            }

            // Annotate each weapon with preferred + req status
            const annotated = items.map((item) => {
              const preferred = isPreferredWeapon(item, style);
              const req = checkWeaponRequirements(item.id, warriorAttrs);
              return { item, preferred, req };
            });

            // Group: preferred+met | non-preferred+met | preferred+failed
            // Non-preferred + failed are hidden (too noisy, not class-relevant)
            const classReady = annotated.filter((a) => a.preferred && a.req.met);
            const offClassReady = annotated.filter((a) => !a.preferred && a.req.met);
            const classUnmet = annotated.filter((a) => a.preferred && !a.req.met);

            const renderItem = ({ item, preferred, req }: (typeof annotated)[number]) => (
              <SelectItem key={item.id} value={item.id}>
                <div className="flex items-center gap-2">
                  <span className={!req.met ? 'text-destructive/80' : ''}>{item.name}</span>
                  {item.twoHanded && (
                    <Badge variant="secondary" className="text-[10px] py-0 px-1">
                      2H
                    </Badge>
                  )}
                  {preferred && req.met && (
                    <Star className="h-3 w-3 text-arena-gold fill-arena-gold" />
                  )}
                  {!req.met && (
                    <span className="text-muted-foreground text-[9px] font-mono">
                      {req.failures.map((f) => `${f.stat}${f.required}`).join('/')}
                    </span>
                  )}
                  <span className="text-muted-foreground text-xs ml-auto">wt {item.weight}</span>
                </div>
              </SelectItem>
            );

            return (
              <>
                {classReady.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-[9px] font-black uppercase tracking-widest text-arena-gold/70">
                      Class Weapons
                    </div>
                    {classReady.map(renderItem)}
                  </>
                )}
                {offClassReady.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 mt-1">
                      Available
                    </div>
                    {offClassReady.map(renderItem)}
                  </>
                )}
                {classUnmet.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-[9px] font-black uppercase tracking-widest text-destructive/50 mt-1">
                      Class Weapons (Reqs Not Met)
                    </div>
                    {classUnmet.map(renderItem)}
                  </>
                )}
              </>
            );
          })()}
        </SelectContent>
      </Select>
      {selected && <p className="text-xs text-muted-foreground pl-6">{selected.description}</p>}
      {/* Weapon requirement badge */}
      {reqResult && (
        <div className="pl-6">
          <WeaponRequirementBadge reqResult={reqResult} />
        </div>
      )}
      {/* Requirement failure detail below slot */}
      {reqResult && !reqResult.met && (
        <div className="pl-6 space-y-0.5">
          {reqResult.failures.map((f) => (
            <p key={f.stat} className="text-[11px] text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {f.label} {f.current}/{f.required} — −2 ATT, +10% END
            </p>
          ))}
        </div>
      )}
      {disabled && (
        <p className="text-xs text-destructive pl-6">Blocked — two-handed weapon equipped</p>
      )}
    </div>
  );
}

export default function EquipmentLoadoutUI({
  loadout,
  style,
  carryCap,
  warriorAttrs,
  onChange,
}: Props) {
  const totalWeight = getLoadoutWeight(loadout);
  const overEncumbered = isOverEncumbered(loadout, carryCap);
  const weaponItem = getItemById(loadout.weapon);
  const isTwoHanded = weaponItem?.twoHanded ?? false;
  const loadoutIssues = validateLoadout(loadout);

  const handleSlotChange = (slot: EquipmentSlot, id: string) => {
    const next = { ...loadout, [slot]: id };
    if (slot === 'weapon') {
      const item = getItemById(id);
      if (item?.twoHanded) {
        next.shield = 'none_shield';
      }
    }
    onChange(next);
  };

  const encPct = Math.min(100, (totalWeight / Math.max(1, carryCap)) * 100);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Equipment Loadout
          </CardTitle>
          <div className="flex items-center gap-2">
            {warriorAttrs && (
              <Badge variant="outline" className="text-[10px] font-mono">
                ST{warriorAttrs.ST} SZ{warriorAttrs.SZ} WT{warriorAttrs.WT} DF{warriorAttrs.DF}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {STYLE_DISPLAY_NAMES[style]}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Hard-block loadout validation — surfaces illegal combos (e.g. two-handed + shield). */}
        {loadoutIssues.length > 0 && (
          <div className="space-y-1.5">
            {loadoutIssues.map((issue) => (
              <div
                key={issue.code}
                className="flex items-start gap-2 p-2 border border-destructive/40 bg-destructive/10 rounded-none text-destructive"
              >
                <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span className="text-xs font-semibold">{issue.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Encumbrance bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Encumbrance</span>
            <span className={`font-mono font-semibold ${overEncumbered ? 'text-destructive' : ''}`}>
              {totalWeight} / {carryCap}
            </span>
          </div>
          <Progress
            value={encPct}
            className={`h-2.5 ${overEncumbered ? '[&>div]:bg-destructive' : ''}`}
          />
          {overEncumbered && (
            <div className="space-y-1 mt-2">
              <div className="flex items-center gap-1.5 text-xs text-destructive font-semibold">
                <AlertTriangle className="h-3.5 w-3.5" />
                Over-encumbered! Combat penalties apply:
              </div>
              <div className="grid grid-cols-2 gap-2 pl-5 text-[10px] font-mono">
                <div className="bg-destructive/10 text-destructive p-1 rounded border border-destructive/20 text-center">
                  -2 Initiative
                </div>
                <div className="bg-destructive/10 text-destructive p-1 rounded border border-destructive/20 text-center">
                  +20% END Cost
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Slots */}
        <div className="grid gap-4 sm:grid-cols-2">
          {SLOT_CONFIG.map(({ slot, label, icon }) => (
            <SlotSelector
              key={slot}
              slot={slot}
              label={label}
              icon={icon}
              selectedId={loadout[slot]}
              style={style}
              disabled={slot === 'shield' && isTwoHanded}
              warriorAttrs={warriorAttrs}
              onChange={(id) => handleSlotChange(slot, id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
