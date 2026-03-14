const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const search = `      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold tracking-wide">
            Arena Hub
          </h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, <span className="text-foreground font-medium">{state.player.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {isEditing && (
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground" onClick={resetLayout}>
              <RotateCcw className="h-3 w-3" /> Reset
            </Button>
          )}
          <Button
            variant={isEditing ? "default" : "outline"}
            size="sm"
            className="text-xs gap-1"
            onClick={() => setIsEditing(v => !v)}
          >
            <GripVertical className="h-3 w-3" />
            {isEditing ? "Done" : "Customize"}
          </Button>
        </div>
      </div>

      {/* Widget Grid */}
      <div className="grid gap-3 md:grid-cols-3">`;

const replace = `      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-secondary/30 p-4 rounded-xl border border-border/50">
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold tracking-wide flex items-center gap-2 text-foreground">
            Arena Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, <span className="text-foreground font-medium">{state.player.name}</span> of <span className="text-primary font-bold">{state.player.stableName}</span>
          </p>
        </div>

        <div className="flex items-center gap-4 text-sm bg-background/50 px-4 py-2 rounded-lg border border-border/40 shrink-0 shadow-inner">
           <div className="flex items-center gap-2 border-r border-border/50 pr-4">
              <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">Gold</span>
              <span className="font-mono text-arena-gold font-bold">{state.gold.toLocaleString()} G</span>
           </div>
           <div className="flex items-center gap-2 border-r border-border/50 pr-4">
              <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">Fame</span>
              <span className="font-mono text-arena-fame font-bold">{state.fame.toLocaleString()}</span>
           </div>
           <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">Pop</span>
              <span className="font-mono text-arena-pop font-bold">{Math.round(state.popularity)}%</span>
           </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isEditing && (
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={resetLayout}>
              <RotateCcw className="h-3 w-3" /> Reset
            </Button>
          )}
          <Button
            variant={isEditing ? "default" : "secondary"}
            size="sm"
            className={cn("text-xs gap-1 transition-colors shadow-sm", isEditing && "bg-primary text-primary-foreground")}
            onClick={() => setIsEditing(v => !v)}
          >
            <GripVertical className="h-3 w-3" />
            {isEditing ? "Done" : "Customize"}
          </Button>
        </div>
      </div>

      {/* Widget Grid */}
      <div className="grid gap-4 md:grid-cols-3 auto-rows-min">`;

content = content.replace(search, replace);
content = content.replace(`<div className="space-y-4">`, `<div className="space-y-6">`);

fs.writeFileSync('src/pages/Dashboard.tsx', content);
