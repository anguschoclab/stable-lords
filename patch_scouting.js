import fs from 'fs';

let content = fs.readFileSync('src/pages/Recruit.tsx', 'utf-8');

// Update RecruitCard layout and add neon potential
const cardRegex = /function RecruitCard\(\{ warrior, canAfford, rosterFull, onRecruit \}:[\s\S]*?return \([\s\S]*?<\/Card>\n  \);\n}/;

const newCard = `function RecruitCard({ warrior, canAfford, rosterFull, onRecruit }: {
  warrior: PoolWarrior;
  canAfford: boolean;
  rosterFull: boolean;
  onRecruit: (w: PoolWarrior) => void;
}) {
  return (
    <Card className="relative overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 group bg-card/80 backdrop-blur-sm">
      {/* Neon glowing edge based on tier */}
      <div className={\`absolute inset-x-0 top-0 h-1 \${
        warrior.tier === 'Prodigy' ? 'bg-primary glow-neon-green' :
        warrior.tier === 'Exceptional' ? 'bg-accent glow-neon-blue' :
        warrior.tier === 'Promising' ? 'bg-arena-gold glow-neon-gold' :
        'bg-muted'
      }\`} />

      <CardContent className="p-4 space-y-4">
        {/* Header: Name, Style, Tier */}
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <h3 className="font-display font-bold text-base truncate group-hover:text-primary transition-colors">
              {warrior.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[10px] font-mono border-primary/20 text-primary bg-primary/5">
                {STYLE_DISPLAY_NAMES[warrior.style]}
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">Age {warrior.age}</span>
            </div>
          </div>
          <TierBadge tier={warrior.tier} />
        </div>

        {/* Potential Rating & Stats Grid */}
        <div className="grid grid-cols-3 gap-3 items-center bg-secondary/30 rounded-lg p-3 border border-border/40">
           {/* Big Neon Potential */}
           <div className="col-span-1 flex flex-col items-center justify-center border-r border-border/50 pr-2">
             <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Potential</div>
             <div className={\`text-3xl font-display font-bold \${
               warrior.tier === 'Prodigy' ? 'text-primary drop-shadow-[0_0_8px_hsl(var(--primary))]' :
               warrior.tier === 'Exceptional' ? 'text-accent drop-shadow-[0_0_8px_hsl(var(--accent))]' :
               warrior.tier === 'Promising' ? 'text-arena-gold drop-shadow-[0_0_8px_hsl(var(--arena-gold))]' :
               'text-muted-foreground'
             }\`}>
               {warrior.tier === 'Prodigy' ? 'S' : warrior.tier === 'Exceptional' ? 'A' : warrior.tier === 'Promising' ? 'B' : 'C'}
             </div>
           </div>

           {/* Core Attributes */}
           <div className="col-span-2 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
             <div className="flex justify-between items-center">
               <span className="text-muted-foreground">STR</span>
               <span className="font-mono font-medium">{warrior.attributes.ST}</span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-muted-foreground">DEX</span>
               <span className="font-mono font-medium">{warrior.attributes.DX}</span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-muted-foreground">CON</span>
               <span className="font-mono font-medium">{warrior.attributes.CN}</span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-muted-foreground">WIT</span>
               <span className="font-mono font-medium text-accent glow-neon-blue">{warrior.attributes.WT}</span>
             </div>
           </div>
        </div>

        {/* Scout Opinion / Lore */}
        <div className="relative">
          <Quote className="absolute -top-1 -left-1 h-3 w-3 text-muted-foreground/30" />
          <p className="text-[11px] text-muted-foreground/90 italic leading-relaxed pl-3 border-l-2 border-primary/20">
            {warrior.lore}
          </p>
        </div>

        {/* Action Row */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-1.5 font-mono font-semibold">
            <Coins className="h-4 w-4 text-arena-gold drop-shadow-[0_0_5px_hsl(var(--arena-gold)/0.5)]" />
            <span className={canAfford ? "text-foreground" : "text-destructive"}>{warrior.cost}</span>
          </div>
          <Button
            size="sm"
            className="gap-1.5 bg-primary/10 text-primary border border-primary/30 hover:bg-primary hover:text-primary-foreground hover:glow-neon-green transition-all"
            disabled={!canAfford || rosterFull}
            onClick={() => onRecruit(warrior)}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Recruit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}`;

content = content.replace(cardRegex, newCard);

fs.writeFileSync('src/pages/Recruit.tsx', content);
