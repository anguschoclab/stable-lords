import fs from 'fs';

let content = fs.readFileSync('src/pages/Training.tsx', 'utf-8');

// Update Training progress bars to neon
content = content.replace(
  /<Progress value=\{\(val \/ 25\) \* 100\} className="h-1\.5" \/>/g,
  '<Progress value={(val / 25) * 100} className="h-1.5 [&>div]:bg-accent [&>div]:shadow-[0_0_8px_hsl(var(--accent))]" />'
);

// Update selected drill styling
content = content.replace(
  /isSelected\n\s*\? "border-primary bg-primary\/10 text-foreground"/g,
  'isSelected\n                            ? "border-primary bg-primary/20 text-foreground glow-neon-green"'
);

// Update recovery styling
content = content.replace(
  /isRecovery\n\s*\? "border-arena-pop bg-arena-pop\/10 text-foreground"/g,
  'isRecovery\n                ? "border-destructive bg-destructive/20 text-foreground glow-neon-red"'
);

// Update check icons for active drills
content = content.replace(
  /isSelected && <Check className="h-3\.5 w-3\.5 text-primary" \/>/g,
  'isSelected && <Check className="h-3.5 w-3.5 text-primary drop-shadow-[0_0_5px_hsl(var(--primary))]" />'
);

content = content.replace(
  /isRecovery && <Check className="h-3\.5 w-3\.5 text-arena-pop" \/>/g,
  'isRecovery && <Check className="h-3.5 w-3.5 text-destructive drop-shadow-[0_0_5px_hsl(var(--destructive))]" />'
);

// Header gradient
content = content.replace(
  /<div className="absolute inset-0 bg-gradient-to-r from-primary\/5 to-accent\/5" \/>/g,
  '<div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 glow-neon-blue rounded-xl mix-blend-overlay" />'
);

fs.writeFileSync('src/pages/Training.tsx', content);
