const fs = require('fs');
let content = fs.readFileSync('src/pages/WarriorDetail.tsx', 'utf8');

const searchHeader = `  return (
    <div className="space-y-4 pb-8 max-w-5xl mx-auto">
      {/* 1. Header (Name, Style, Quick Stats) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-display font-bold">
              {warrior.name}
            </h1>
            <Badge variant="outline" className={cn(
              "uppercase tracking-widest text-[10px]",
              warrior.status === "Dead" ? "border-red-500 text-red-500" :
                warrior.status === "Retired" ? "border-gray-500 text-gray-500" :
                  "border-green-500 text-green-500"
            )}>
              {warrior.status}
            </Badge>
          </div>
          <div className="text-muted-foreground flex items-center gap-2 mt-1 flex-wrap">
            <span className="font-medium text-foreground">{STYLE_DISPLAY_NAMES[warrior.style as keyof typeof STYLE_DISPLAY_NAMES]}</span>
            <span>•</span>
            <span>Age {warrior.age}</span>
            {warrior.champion && (
              <>
                <span>•</span>
                <span className="text-yellow-500 font-bold flex items-center gap-1">
                  <Trophy className="h-3 w-3" /> Champion
                </span>
              </>
            )}
            {warrior.titles?.length > 0 && (
              <>
                <span>•</span>
                <span className="italic">"{warrior.titles.join(", ")}"</span>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Fame</div>
            <div className="font-mono text-xl text-yellow-500">{warrior.fame}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Popularity</div>
            <div className="font-mono text-xl text-blue-400">{Math.round(warrior.popularity)}%</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Record</div>
            <div className="font-mono text-xl">
              <span className="text-green-500">{warrior.career.wins}</span>-
              <span className="text-muted-foreground">{warrior.career.losses}</span>
              {warrior.career.kills > 0 && (
                <span className="text-red-500 ml-1">({warrior.career.kills}K)</span>
              )}
            </div>
          </div>
        </div>
      </div>`;

const replaceHeader = `  return (
    <div className="space-y-6 pb-8 max-w-6xl mx-auto">
      {/* 1. Header (FM26 Style Header Block) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-secondary/30 p-4 rounded-xl border border-border/50 shadow-inner">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-secondary/80 border border-border flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-2xl font-bold font-display">{warrior.name.charAt(0)}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-display font-bold text-foreground">
                {warrior.name}
              </h1>
              <Badge variant="outline" className={cn(
                "uppercase tracking-widest text-[10px] font-bold px-2 py-0.5 shadow-sm",
                warrior.status === "Dead" ? "border-destructive text-destructive bg-destructive/10" :
                  warrior.status === "Retired" ? "border-muted-foreground text-muted-foreground bg-muted/10" :
                    "border-green-500 text-green-500 bg-green-500/10"
              )}>
                {warrior.status}
              </Badge>
              {warrior.champion && (
                <Badge variant="outline" className="uppercase tracking-widest text-[10px] font-bold px-2 py-0.5 border-arena-gold text-arena-gold bg-arena-gold/10 shadow-sm gap-1">
                  <Trophy className="h-3 w-3" /> CHAMPION
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1 flex-wrap">
              <span className="font-bold text-foreground">{STYLE_DISPLAY_NAMES[warrior.style as keyof typeof STYLE_DISPLAY_NAMES]}</span>
              <span className="text-border/60">|</span>
              <span className="font-mono text-xs">AGE {warrior.age}</span>
              {warrior.titles?.length > 0 && (
                <>
                  <span className="text-border/60">|</span>
                  <span className="italic text-primary/80">"{warrior.titles.join(", ")}"</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm bg-background/50 px-5 py-3 rounded-lg border border-border/40 shadow-inner w-full md:w-auto overflow-x-auto">
          <div className="flex flex-col items-center border-r border-border/50 pr-6 shrink-0">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-0.5">Fame</div>
            <div className="font-mono text-xl text-arena-fame font-bold leading-none">{warrior.fame}</div>
          </div>
          <div className="flex flex-col items-center border-r border-border/50 pr-6 shrink-0">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-0.5">Popularity</div>
            <div className="font-mono text-xl text-arena-pop font-bold leading-none">{Math.round(warrior.popularity)}%</div>
          </div>
          <div className="flex flex-col items-center shrink-0">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-0.5">Record</div>
            <div className="font-mono text-xl leading-none">
              <span className="text-arena-pop font-bold">{warrior.career.wins}</span><span className="text-muted-foreground mx-0.5">-</span>
              <span className="text-muted-foreground font-bold">{warrior.career.losses}</span>
              {warrior.career.kills > 0 && (
                <span className="text-destructive font-bold ml-1 text-sm tracking-tighter">({warrior.career.kills}K)</span>
              )}
            </div>
          </div>
        </div>
      </div>`;

content = content.replace(searchHeader, replaceHeader);

// Adjust layout grid
content = content.replace(`<div className="grid grid-cols-1 md:grid-cols-12 gap-4">`, `<div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-min">`);

fs.writeFileSync('src/pages/WarriorDetail.tsx', content);
