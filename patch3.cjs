const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const searchRecentBouts = `// ─── Widget: Recent Bouts ──────────────────────────────────────────────────

function RecentBoutsWidget() {
  const { state } = useGame();

  // Get the last 5 bouts involving the player's stable
  const recentBouts = useMemo(() => {
    return state.arenaHistory
      .filter(bout => bout.a === state.player.stableName || bout.d === state.player.stableName)
      .slice(0, 5);
  }, [state.arenaHistory, state.player.stableName]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex-none">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <History className="h-4 w-4 text-primary" /> Recent Bouts
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        {recentBouts.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-4">No recent bouts to display.</div>
        ) : (
          <div className="space-y-3">
            {recentBouts.map((bout) => {
              const isPlayerA = bout.a === state.player.stableName;
              const playerWarrior = isPlayerA ? bout.styleA : bout.styleD; // Placeholder for warrior name if available in bout summary, currently only stable name is available as a/d and style
              const opponentWarrior = isPlayerA ? bout.styleD : bout.styleA;
              const playerWon = (isPlayerA && bout.winner === "A") || (!isPlayerA && bout.winner === "D");

              return (
                <div key={bout.id} className="flex items-center justify-between text-sm border-b border-border/50 pb-2 last:border-0 last:pb-0">
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{playerWarrior}</span>
                    <span className="text-xs text-muted-foreground">vs {opponentWarrior}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <Badge variant={playerWon ? "default" : "destructive"} className="text-[10px] px-1.5 py-0">
                      {playerWon ? "WIN" : "LOSS"}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground mt-1">Week {bout.week} - {bout.by || "Decision"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}`;

const searchHistoryFallback = `// ─── Widget: Arena Gazette ─────────────────────────────────────────────────`;

// Looks like RecentBoutsWidget is already there, let's search for it.
if (content.includes("function RecentBoutsWidget()")) {
    const startIdx = content.indexOf("function RecentBoutsWidget()");
    let endIdx = content.indexOf("// ─── Widget", startIdx + 1);
    if(endIdx === -1) endIdx = content.indexOf("export default function Dashboard()", startIdx);

    const oldWidget = content.substring(startIdx, endIdx);

    const newWidget = `function RecentBoutsWidget() {
  const { state } = useGame();

  // Get the last 5 bouts involving the player's stable
  const recentBouts = useMemo(() => {
    return state.arenaHistory
      .filter(bout => bout.a === state.player.stableName || bout.d === state.player.stableName)
      .slice(0, 5);
  }, [state.arenaHistory, state.player.stableName]);

  return (
    <Card className="flex flex-col h-full border-border/50 shadow-sm col-span-1 md:col-span-2">
      <CardHeader className="pb-2 border-b border-border/20 bg-secondary/10">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-sm tracking-wide flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-primary" /> RECENT BOUTS
          </CardTitle>
          <span className="text-[10px] text-muted-foreground font-mono">LAST 5 MATCHES</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-muted-foreground uppercase bg-secondary/5 border-b border-border/20 font-bold tracking-wider">
              <tr>
                <th className="px-4 py-2">Week</th>
                <th className="px-4 py-2">Fighter</th>
                <th className="px-4 py-2">Opponent</th>
                <th className="px-4 py-2">Result</th>
                <th className="px-4 py-2 text-right">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {recentBouts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-xs">No match history available</td>
                </tr>
              ) : (
                recentBouts.map((bout) => {
                  const isPlayerA = bout.a === state.player.stableName;
                  const playerWon = (isPlayerA && bout.winner === "A") || (!isPlayerA && bout.winner === "D");
                  const resultColor = playerWon ? "text-arena-pop" : "text-destructive";

                  return (
                    <tr key={bout.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">Wk {bout.week}</td>
                      <td className="px-4 py-2.5 font-bold">
                        {isPlayerA ? bout.a : bout.d}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">
                         {isPlayerA ? bout.d : bout.a}
                      </td>
                      <td className={\`px-4 py-2.5 font-bold \${resultColor}\`}>
                         {playerWon ? "WIN" : "LOSS"}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-[10px] uppercase text-muted-foreground">
                        {bout.by || "DECISION"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="p-2 border-t border-border/20 bg-background/50 text-center">
            <Link to="/hall-of-fights" className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors font-bold flex items-center justify-center gap-1">
               Full History <ChevronRight className="h-3 w-3" />
            </Link>
        </div>
      </CardContent>
    </Card>
  );
}
`;
    content = content.replace(oldWidget, newWidget);
    fs.writeFileSync('src/pages/Dashboard.tsx', content);
}
