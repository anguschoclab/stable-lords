import re

with open('src/pages/Scouting.tsx', 'r') as f:
    content = f.read()

# 1. Insert new components above StableComparison
new_components = """
/* ── Subcomponents for StableComparison ──────────────────── */

function StableSelector({
  rivals, idA, setIdA, idB, setIdB
}: {
  rivals: RivalStableData[]; idA: string | null; setIdA: (id: string | null) => void; idB: string | null; setIdB: (id: string | null) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-3">
        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2">TACTICAL_ASSET_A</label>
        <div className="grid grid-cols-1 gap-1.5">
          {rivals.map((r) => (
            <button
              key={r.owner.id}
              onClick={() => setIdA(r.owner.id === idA ? null : r.owner.id)}
              disabled={r.owner.id === idB}
              className={cn(
                "w-full text-left px-4 py-2.5 rounded-xl border font-display font-black uppercase text-[10px] tracking-tight transition-all",
                idA === r.owner.id
                  ? "border-primary bg-primary/10 text-primary shadow-[0_0_15px_-5px_rgba(var(--primary-rgb),0.3)]"
                  : r.owner.id === idB
                  ? "border-border/10 text-muted-foreground/20 cursor-not-allowed grayscale"
                  : "border-border/30 bg-glass-card hover:border-primary/40 text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <Shield className="h-3.5 w-3.5" />
                {r.owner.stableName}
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2">TACTICAL_ASSET_B</label>
        <div className="grid grid-cols-1 gap-1.5">
          {rivals.map((r) => (
            <button
              key={r.owner.id}
              onClick={() => setIdB(r.owner.id === idB ? null : r.owner.id)}
              disabled={r.owner.id === idA}
              className={cn(
                "w-full text-left px-4 py-2.5 rounded-xl border font-display font-black uppercase text-[10px] tracking-tight transition-all",
                idB === r.owner.id
                  ? "border-accent bg-accent/10 text-accent shadow-[0_0_15px_-5px_rgba(var(--accent-rgb),0.3)]"
                  : r.owner.id === idA
                  ? "border-border/10 text-muted-foreground/20 cursor-not-allowed grayscale"
                  : "border-border/30 bg-glass-card hover:border-accent/40 text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <Shield className="h-3.5 w-3.5" />
                {r.owner.stableName}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ComparisonHeader({ rivalA, rivalB }: { rivalA: RivalStableData; rivalB: RivalStableData }) {
  return (
    <div className="flex items-center justify-between bg-glass-card rounded-2xl p-6 border border-border/40 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      <div className="text-center flex-1 relative z-10">
        <h3 className="font-display font-black uppercase text-xl tracking-tighter text-foreground decoration-primary decoration-4 underline-offset-8 transition-all">{rivalA.owner.stableName}</h3>
        <Badge variant="outline" className="text-[9px] font-black tracking-widest uppercase mt-3 border-primary/20 bg-primary/5 text-primary">{rivalA.tier}</Badge>
      </div>
      <div className="flex flex-col items-center justify-center mx-6 relative z-10">
         <ArrowLeftRight className="h-6 w-6 text-muted-foreground/40 mb-1" />
         <span className="text-[8px] font-black text-muted-foreground/30 tracking-widest uppercase">VS</span>
      </div>
      <div className="text-center flex-1 relative z-10">
        <h3 className="font-display font-black uppercase text-xl tracking-tighter text-foreground decoration-accent decoration-4 underline-offset-8 transition-all">{rivalB.owner.stableName}</h3>
        <Badge variant="outline" className="text-[9px] font-black tracking-widest uppercase mt-3 border-accent/20 bg-accent/5 text-accent">{rivalB.tier}</Badge>
      </div>
    </div>
  );
}

function StyleBreakdown({
  statsA, statsB, rivalA, rivalB
}: {
  statsA: ReturnType<typeof stableStats>; statsB: ReturnType<typeof stableStats>; rivalA: RivalStableData; rivalB: RivalStableData
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-display">{rivalA.owner.stableName} Styles</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {Object.entries(statsA.styleCounts).sort(([, a], [, b]) => b - a).map(([style, count]) => (
            <div key={style} className="flex items-center justify-between py-1 text-[11px]">
              <span className="text-foreground">{STYLE_DISPLAY_NAMES[style as keyof typeof STYLE_DISPLAY_NAMES] ?? style}</span>
              <Badge variant="outline" className="text-[9px] font-mono">{count}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-display">{rivalB.owner.stableName} Styles</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {Object.entries(statsB.styleCounts).sort(([, a], [, b]) => b - a).map(([style, count]) => (
            <div key={style} className="flex items-center justify-between py-1 text-[11px]">
              <span className="text-foreground">{STYLE_DISPLAY_NAMES[style as keyof typeof STYLE_DISPLAY_NAMES] ?? style}</span>
              <Badge variant="outline" className="text-[9px] font-mono">{count}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function TopWarriors({ statsA, statsB }: { statsA: ReturnType<typeof stableStats>; statsB: ReturnType<typeof stableStats> }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-display flex items-center gap-2">
          <Trophy className="h-4 w-4 text-arena-gold" /> Top Warriors
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {[statsA.topWarrior, statsB.topWarrior].map((w, i) => (
            <div key={i} className={`p-3 rounded-lg border ${i === 0 ? "border-primary/30 bg-primary/5" : "border-accent/30 bg-accent/5"}`}>
              {w ? (
                <>
                  <div className="font-display text-sm font-bold text-foreground">{w.name}</div>
                  <div className="text-[10px] text-muted-foreground font-mono mt-1">
                    {STYLE_DISPLAY_NAMES[w.style as keyof typeof STYLE_DISPLAY_NAMES] ?? w.style}
                  </div>
                  <div className="flex gap-3 mt-2 text-[10px] font-mono">
                    <span>{w.career.wins}W-{w.career.losses}L</span>
                    {w.career.kills > 0 && <span className="text-arena-blood">{w.career.kills}K</span>}
                    <span className="text-arena-fame">{w.fame ?? 0}F</span>
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground italic">No active warriors</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Comparison Panel ────────────────────────────────────── */
"""

content = content.replace("/* ── Comparison Panel ────────────────────────────────────── */", new_components)

search_block = """      {/* Selector row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2">TACTICAL_ASSET_A</label>
          <div className="grid grid-cols-1 gap-1.5">
            {rivals.map((r) => (
              <button
                key={r.owner.id}
                onClick={() => setIdA(r.owner.id === idA ? null : r.owner.id)}
                disabled={r.owner.id === idB}
                className={cn(
                  "w-full text-left px-4 py-2.5 rounded-xl border font-display font-black uppercase text-[10px] tracking-tight transition-all",
                  idA === r.owner.id
                    ? "border-primary bg-primary/10 text-primary shadow-[0_0_15px_-5px_rgba(var(--primary-rgb),0.3)]"
                    : r.owner.id === idB
                    ? "border-border/10 text-muted-foreground/20 cursor-not-allowed grayscale"
                    : "border-border/30 bg-glass-card hover:border-primary/40 text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <Shield className="h-3.5 w-3.5" />
                  {r.owner.stableName}
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2">TACTICAL_ASSET_B</label>
          <div className="grid grid-cols-1 gap-1.5">
            {rivals.map((r) => (
              <button
                key={r.owner.id}
                onClick={() => setIdB(r.owner.id === idB ? null : r.owner.id)}
                disabled={r.owner.id === idA}
                className={cn(
                  "w-full text-left px-4 py-2.5 rounded-xl border font-display font-black uppercase text-[10px] tracking-tight transition-all",
                  idB === r.owner.id
                    ? "border-accent bg-accent/10 text-accent shadow-[0_0_15px_-5px_rgba(var(--accent-rgb),0.3)]"
                    : r.owner.id === idA
                    ? "border-border/10 text-muted-foreground/20 cursor-not-allowed grayscale"
                    : "border-border/30 bg-glass-card hover:border-accent/40 text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <Shield className="h-3.5 w-3.5" />
                  {r.owner.stableName}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison body */}
      {statsA && statsB && rivalA && rivalB && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between bg-glass-card rounded-2xl p-6 border border-border/40 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none" />
            <div className="text-center flex-1 relative z-10">
              <h3 className="font-display font-black uppercase text-xl tracking-tighter text-foreground decoration-primary decoration-4 underline-offset-8 transition-all">{rivalA.owner.stableName}</h3>
              <Badge variant="outline" className="text-[9px] font-black tracking-widest uppercase mt-3 border-primary/20 bg-primary/5 text-primary">{rivalA.tier}</Badge>
            </div>
            <div className="flex flex-col items-center justify-center mx-6 relative z-10">
               <ArrowLeftRight className="h-6 w-6 text-muted-foreground/40 mb-1" />
               <span className="text-[8px] font-black text-muted-foreground/30 tracking-widest uppercase">VS</span>
            </div>
            <div className="text-center flex-1 relative z-10">
              <h3 className="font-display font-black uppercase text-xl tracking-tighter text-foreground decoration-accent decoration-4 underline-offset-8 transition-all">{rivalB.owner.stableName}</h3>
              <Badge variant="outline" className="text-[9px] font-black tracking-widest uppercase mt-3 border-accent/20 bg-accent/5 text-accent">{rivalB.tier}</Badge>
            </div>
          </div>

          {/* Key stats comparison bands */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-display flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Key Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ComparisonBar label="Roster Size" valA={statsA.rosterSize} valB={statsB.rosterSize} maxVal={maxRoster} colorA="bg-primary" colorB="bg-accent" />
              <ComparisonBar label="Total Wins" valA={statsA.totalWins} valB={statsB.totalWins} maxVal={maxWins} colorA="bg-primary" colorB="bg-accent" />
              <ComparisonBar label="Win Rate %" valA={statsA.winRate} valB={statsB.winRate} maxVal={100} colorA="bg-primary" colorB="bg-accent" />
              <ComparisonBar label="Total Kills" valA={statsA.totalKills} valB={statsB.totalKills} maxVal={maxKills} colorA="bg-primary" colorB="bg-accent" />
              <ComparisonBar label="Total Fame" valA={statsA.totalFame} valB={statsB.totalFame} maxVal={maxFame} colorA="bg-primary" colorB="bg-accent" />
              <ComparisonBar label="Avg Fame" valA={statsA.avgFame} valB={statsB.avgFame} maxVal={Math.max(statsA.avgFame, statsB.avgFame, 1)} colorA="bg-primary" colorB="bg-accent" />
            </CardContent>
          </Card>

          {/* Average attributes comparison */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-display flex items-center gap-2">
                <Swords className="h-4 w-4 text-arena-gold" /> Average Attributes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ATTRIBUTE_KEYS.map((key) => (
                <ComparisonBar
                  key={key}
                  label={key}
                  valA={statsA.avgAttrs[key] ?? 0}
                  valB={statsB.avgAttrs[key] ?? 0}
                  maxVal={maxAttr}
                  colorA="bg-primary"
                  colorB="bg-accent"
                />
              ))}
            </CardContent>
          </Card>

          {/* Style breakdown */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-display">{rivalA.owner.stableName} Styles</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {Object.entries(statsA.styleCounts).sort(([, a], [, b]) => b - a).map(([style, count]) => (
                  <div key={style} className="flex items-center justify-between py-1 text-[11px]">
                    <span className="text-foreground">{STYLE_DISPLAY_NAMES[style as keyof typeof STYLE_DISPLAY_NAMES] ?? style}</span>
                    <Badge variant="outline" className="text-[9px] font-mono">{count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-display">{rivalB.owner.stableName} Styles</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {Object.entries(statsB.styleCounts).sort(([, a], [, b]) => b - a).map(([style, count]) => (
                  <div key={style} className="flex items-center justify-between py-1 text-[11px]">
                    <span className="text-foreground">{STYLE_DISPLAY_NAMES[style as keyof typeof STYLE_DISPLAY_NAMES] ?? style}</span>
                    <Badge variant="outline" className="text-[9px] font-mono">{count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Top warriors face-off */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-display flex items-center gap-2">
                <Trophy className="h-4 w-4 text-arena-gold" /> Top Warriors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[statsA.topWarrior, statsB.topWarrior].map((w, i) => (
                  <div key={i} className={`p-3 rounded-lg border ${i === 0 ? "border-primary/30 bg-primary/5" : "border-accent/30 bg-accent/5"}`}>
                    {w ? (
                      <>
                        <div className="font-display text-sm font-bold text-foreground">{w.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-1">
                          {STYLE_DISPLAY_NAMES[w.style as keyof typeof STYLE_DISPLAY_NAMES] ?? w.style}
                        </div>
                        <div className="flex gap-3 mt-2 text-[10px] font-mono">
                          <span>{w.career.wins}W-{w.career.losses}L</span>
                          {w.career.kills > 0 && <span className="text-arena-blood">{w.career.kills}K</span>}
                          <span className="text-arena-fame">{w.fame ?? 0}F</span>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No active warriors</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}"""

replace_block = """      {/* Selector row */}
      <StableSelector rivals={rivals} idA={idA} setIdA={setIdA} idB={idB} setIdB={setIdB} />

      {/* Comparison body */}
      {statsA && statsB && rivalA && rivalB && (
        <div className="space-y-6">
          {/* Header */}
          <ComparisonHeader rivalA={rivalA} rivalB={rivalB} />

          {/* Key stats comparison bands */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-display flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Key Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ComparisonBar label="Roster Size" valA={statsA.rosterSize} valB={statsB.rosterSize} maxVal={maxRoster} colorA="bg-primary" colorB="bg-accent" />
              <ComparisonBar label="Total Wins" valA={statsA.totalWins} valB={statsB.totalWins} maxVal={maxWins} colorA="bg-primary" colorB="bg-accent" />
              <ComparisonBar label="Win Rate %" valA={statsA.winRate} valB={statsB.winRate} maxVal={100} colorA="bg-primary" colorB="bg-accent" />
              <ComparisonBar label="Total Kills" valA={statsA.totalKills} valB={statsB.totalKills} maxVal={maxKills} colorA="bg-primary" colorB="bg-accent" />
              <ComparisonBar label="Total Fame" valA={statsA.totalFame} valB={statsB.totalFame} maxVal={maxFame} colorA="bg-primary" colorB="bg-accent" />
              <ComparisonBar label="Avg Fame" valA={statsA.avgFame} valB={statsB.avgFame} maxVal={Math.max(statsA.avgFame, statsB.avgFame, 1)} colorA="bg-primary" colorB="bg-accent" />
            </CardContent>
          </Card>

          {/* Average attributes comparison */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-display flex items-center gap-2">
                <Swords className="h-4 w-4 text-arena-gold" /> Average Attributes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ATTRIBUTE_KEYS.map((key) => (
                <ComparisonBar
                  key={key}
                  label={key}
                  valA={statsA.avgAttrs[key] ?? 0}
                  valB={statsB.avgAttrs[key] ?? 0}
                  maxVal={maxAttr}
                  colorA="bg-primary"
                  colorB="bg-accent"
                />
              ))}
            </CardContent>
          </Card>

          {/* Style breakdown */}
          <StyleBreakdown statsA={statsA} statsB={statsB} rivalA={rivalA} rivalB={rivalB} />

          {/* Top warriors face-off */}
          <TopWarriors statsA={statsA} statsB={statsB} />
        </div>
      )}"""

content = content.replace(search_block, replace_block)

with open('src/pages/Scouting.tsx', 'w') as f:
    f.write(content)
