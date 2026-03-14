const fs = require('fs');
let content = fs.readFileSync('src/pages/Tournaments.tsx', 'utf8');

const searchRender = `  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Tournaments</h1>
          <p className="text-muted-foreground flex items-center gap-1.5 mt-1">
            <span>Current Season: {SEASON_ICONS[state.season]} {SEASON_NAMES[state.season]}</span>
            <span>•</span>
            <span>Week {state.week}</span>
          </p>
        </div>
        {!currentTournament && canStart && (
          <Button onClick={startTournament} className="gap-2">
            <Trophy className="h-4 w-4" /> Start {SEASON_NAMES[state.season]}
          </Button>
        )}
      </div>

      {currentTournament && (
        <Card className="border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.1)]">
          <CardHeader className="bg-primary/5 pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" /> {currentTournament.name}
              </CardTitle>
              <Badge variant="outline" className="border-primary text-primary">IN PROGRESS</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">`;

const replaceRender = `  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-8">
      {/* FM26 Style Header Block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-secondary/30 p-4 rounded-xl border border-border/50 shadow-inner">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground tracking-wide flex items-center gap-2">
             <Trophy className="h-6 w-6 text-arena-gold" /> TOURNAMENTS
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <span className="font-bold text-foreground uppercase tracking-wider text-[10px]">CURRENT SEASON</span>
            <span className="bg-background px-2 py-0.5 rounded border border-border/40 font-mono text-xs">{SEASON_ICONS[state.season]} {SEASON_NAMES[state.season]}</span>
            <span className="text-border">|</span>
            <span className="font-mono text-xs">WEEK {state.week}</span>
          </p>
        </div>
        {!currentTournament && canStart && (
          <Button onClick={startTournament} variant="default" className="gap-2 shadow-sm uppercase tracking-wider font-bold text-xs h-9">
            <Play className="h-3 w-3" /> INITIATE {SEASON_NAMES[state.season]}
          </Button>
        )}
        {!currentTournament && !canStart && (
           <div className="text-[10px] uppercase tracking-wider text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-md border border-border/30">
              Requires 2 Active Warriors
           </div>
        )}
      </div>

      {currentTournament && (
        <Card className="border-border/50 shadow-sm bg-background">
          <CardHeader className="bg-secondary/10 border-b border-border/20 pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-display uppercase tracking-wide flex items-center gap-2">
                 <Trophy className="h-5 w-5 text-arena-gold" /> {currentTournament.name}
              </CardTitle>
              <Badge variant="outline" className="border-arena-gold text-arena-gold bg-arena-gold/10 font-bold uppercase tracking-widest text-[10px] px-2 py-0.5">IN PROGRESS</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6 bg-secondary/5">`;

content = content.replace(searchRender, replaceRender);
fs.writeFileSync('src/pages/Tournaments.tsx', content);
