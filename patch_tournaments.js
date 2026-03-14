import fs from 'fs';

let content = fs.readFileSync('src/pages/Tournaments.tsx', 'utf-8');

// The active tournament card
content = content.replace(
  /<Card className="border-primary\/50 glow-primary">/g,
  '<Card className="border-accent/40 shadow-[0_0_25px_-5px_hsl(var(--accent)/0.4)] backdrop-blur-sm">'
);
content = content.replace(
  /<CardTitle className="font-display text-lg flex items-center justify-between">/g,
  '<CardTitle className="font-display text-lg flex items-center justify-between text-accent drop-shadow-[0_0_8px_hsl(var(--accent)/0.6)]">'
);
content = content.replace(
  /<Badge className="bg-primary text-primary-foreground text-xs">Active<\/Badge>/g,
  '<Badge className="bg-primary text-primary-foreground text-xs animate-pulse glow-neon-green border border-primary/50 shadow-[0_0_10px_hsl(var(--primary)/0.5)]">LIVE</Badge>'
);

// Match highlights: Winner in primary/gold glow, loser dimmed
content = content.replace(
  /<span className={`font-medium text-sm \${bout\.winner === "A" \? "text-arena-gold" : ""}`}/g,
  '<span className={`font-medium text-sm transition-all ${bout.winner === "A" ? "text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)] scale-105" : bout.winner === "D" ? "text-muted-foreground opacity-50" : "text-foreground"}`}'
);
content = content.replace(
  /<span className={`font-medium text-sm \${bout\.winner === "D" \? "text-arena-gold" : ""}`}/g,
  '<span className={`font-medium text-sm transition-all ${bout.winner === "D" ? "text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)] scale-105" : bout.winner === "A" ? "text-muted-foreground opacity-50" : "text-foreground"}`}'
);

// Kill badges
content = content.replace(
  /<Badge variant="outline" className={bout\.by === "Kill" \? "text-destructive" : ""}>/g,
  '<Badge variant="outline" className={bout.by === "Kill" ? "text-destructive border-destructive shadow-[0_0_10px_hsl(var(--destructive)/0.5)]" : "border-accent/30 text-accent/80 shadow-[0_0_5px_hsl(var(--accent)/0.2)]"}>'
);

// Past seasons
content = content.replace(
  /className={s === state.season \? "border-primary\/50 glow-primary" : "opacity-70"}/g,
  'className={s === state.season ? "border-primary/50 shadow-[0_0_20px_hsl(var(--primary)/0.3)] bg-primary/5" : "opacity-60 grayscale hover:grayscale-0 transition-all duration-300"}'
);

content = content.replace(
  /<span className="font-semibold">{t\.champion \?\? "—"}<\/span>/g,
  '<span className="font-display font-semibold text-arena-gold drop-shadow-[0_0_5px_hsl(var(--arena-gold)/0.5)]">{t.champion ?? "—"}</span>'
);

fs.writeFileSync('src/pages/Tournaments.tsx', content);
