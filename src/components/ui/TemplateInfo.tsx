/**
 * Template Info Component - Displays stable template information
 * Demonstrates UI/UX connectivity with the modular template system
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Crown, Sword, Shield, Brain, Heart, Zap, Users, Target, TrendingUp } from 'lucide-react';
import type { StableTemplate } from '@/data/templates';
import { getTemplatesByTier } from '@/data/templates';

interface TemplateInfoProps {
  template: StableTemplate;
  showWarriorNames?: boolean;
}

const TIER_COLORS = {
  Legendary: 'bg-arena-gold text-black',
  Major: 'bg-arena-fame/80 text-foreground',
  Established: 'bg-primary/80 text-primary-foreground',
  Minor: 'bg-secondary text-muted-foreground',
};

const PHILOSOPHY_ICONS = {
  'Brute Force': <Sword className="h-4 w-4" />,
  'Speed Kills': <Zap className="h-4 w-4" />,
  'Iron Defense': <Shield className="h-4 w-4" />,
  Balanced: <Target className="h-4 w-4" />,
  Spectacle: <Heart className="h-4 w-4" />,
  Cunning: <Brain className="h-4 w-4" />,
  Endurance: <TrendingUp className="h-4 w-4" />,
  Specialist: <Users className="h-4 w-4" />,
};

export function TemplateInfo({ template, showWarriorNames = false }: TemplateInfoProps) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{template.stableName}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={TIER_COLORS[template.tier]}>
              <Crown className="h-3 w-3 mr-1" />
              {template.tier}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-italic italic">"{template.motto}"</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Owner Info */}
        <div>
          <h4 className="font-semibold text-sm mb-1">Owner</h4>
          <p className="text-sm">{template.ownerName}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{template.personality}</Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              {PHILOSOPHY_ICONS[template.philosophy]}
              {template.philosophy}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Origin */}
        <div>
          <h4 className="font-semibold text-sm mb-1">Origin</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{template.origin}</p>
        </div>

        {/* Preferred Styles */}
        <div>
          <h4 className="font-semibold text-sm mb-2">Preferred Styles</h4>
          <div className="flex flex-wrap gap-1">
            {template.preferredStyles.map((style) => (
              <Badge key={style} variant="secondary" className="text-xs">
                {style}
              </Badge>
            ))}
          </div>
        </div>

        {/* Attribute Bias */}
        <div>
          <h4 className="font-semibold text-sm mb-2">Attribute Bias</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(template.attrBias).map(([attr, value]) => (
              <div key={attr} className="flex justify-between">
                <span className="font-medium">{attr}:</span>
                <span className="text-muted-foreground">+{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Fame:</span>
            <span className="ml-2 text-muted-foreground">
              {template.fameRange[0]}-{template.fameRange[1]}
            </span>
          </div>
          <div>
            <span className="font-medium">Roster:</span>
            <span className="ml-2 text-muted-foreground">
              {template.rosterRange[0]}-{template.rosterRange[1]}
            </span>
          </div>
        </div>

        {/* Warrior Names */}
        {showWarriorNames && template.warriorNames.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-semibold text-sm mb-2">Warrior Names</h4>
              <ScrollArea className="h-20 w-full rounded-none border p-2">
                <div className="flex flex-wrap gap-1">
                  {template.warriorNames.map((name) => (
                    <Badge key={name} variant="outline" className="text-xs">
                      {name}
                    </Badge>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Template Gallery Component - Displays multiple templates
 */
export function TemplateGallery({
  templates,
  showWarriorNames = false,
}: {
  templates: StableTemplate[];
  showWarriorNames?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => (
        <TemplateInfo
          key={template.stableName}
          template={template}
          showWarriorNames={showWarriorNames}
        />
      ))}
    </div>
  );
}

/**
 * Tier Overview Component - Shows templates by tier
 */
export function TierOverview({ showWarriorNames = false }: { showWarriorNames?: boolean }) {
  const legendaryTemplates = getTemplatesByTier('Legendary');
  const majorTemplates = getTemplatesByTier('Major');
  const establishedTemplates = getTemplatesByTier('Established');
  const minorTemplates = getTemplatesByTier('Minor');

  return (
    <div className="space-y-6">
      {legendaryTemplates.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Crown className="h-5 w-5 text-arena-gold" />
            Legendary Stables
          </h3>
          <TemplateGallery templates={legendaryTemplates} showWarriorNames={showWarriorNames} />
        </div>
      )}

      {majorTemplates.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Sword className="h-5 w-5 text-purple-600" />
            Major Stables
          </h3>
          <TemplateGallery templates={majorTemplates} showWarriorNames={showWarriorNames} />
        </div>
      )}

      {establishedTemplates.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Established Stables
          </h3>
          <TemplateGallery templates={establishedTemplates} showWarriorNames={showWarriorNames} />
        </div>
      )}

      {minorTemplates.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-600" />
            Minor Stables
          </h3>
          <TemplateGallery templates={minorTemplates} showWarriorNames={showWarriorNames} />
        </div>
      )}
    </div>
  );
}
