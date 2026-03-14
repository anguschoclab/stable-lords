import fs from 'fs';

let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

// The dashboard already uses md:grid-cols-3 and has a customizable widget system
// The prompt asks to "Restructure the dashboard into a stricter 3-column modular grid"
// And to update the top Header Panel, and widgets.

// Let's modify the Dashboard component to match the requested top header panel and layout style

// Find Dashboard function
const dashboardRegex = /export default function Dashboard\(\) {[\s\S]*?return \([\s\S]*?\);\n}/;

content = content.replace(dashboardRegex, `export default function Dashboard() {
  const { state } = useGame();
  const {
    widgetOrder, dragIdx, dragOverIdx, isEditing, setIsEditing,
    handleDragStart, handleDragOver, handleDrop, handleDragEnd, resetLayout,
  } = useDraggableWidgets();

  const widgetMap = useMemo(
    () => new Map(WIDGET_REGISTRY.map(w => [w.id, w])),
    []
  );

  return (
    <div className="space-y-4">
      {/* Top Header Panel */}
      <Card className="border-primary/20 glow-neon-blue bg-card/80 backdrop-blur-sm">
        <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Swords className="h-8 w-8 text-primary glow-neon-green rounded-full p-1 bg-primary/10" />
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-bold tracking-wide">
                Arena Hub
              </h1>
              <p className="text-sm text-muted-foreground">
                Stable: <span className="text-foreground font-medium">{state.player.stableName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm">
             <div className="text-center">
                <div className="text-muted-foreground text-xs uppercase tracking-wider">Time</div>
                <div className="font-mono font-bold">Wk {state.week} · {state.season}</div>
             </div>
             <div className="text-center">
                <div className="text-muted-foreground text-xs uppercase tracking-wider">Gold</div>
                <div className="font-mono font-bold text-primary glow-neon-green">{state.gold}</div>
             </div>
             <div className="text-center">
                <div className="text-muted-foreground text-xs uppercase tracking-wider">Fame</div>
                <div className="font-mono font-bold text-arena-fame">{state.player.fame}</div>
             </div>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            {isEditing && (
              <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground hover:text-foreground" onClick={resetLayout}>
                <RotateCcw className="h-3 w-3" /> Reset
              </Button>
            )}
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              className="text-xs gap-1 border-primary/30 hover:border-primary/60 hover:bg-primary/10 transition-colors"
              onClick={() => setIsEditing(v => !v)}
            >
              <GripVertical className="h-3 w-3" />
              {isEditing ? "Done" : "Customize"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Widget Grid - Strict 3 Column */}
      <div className="grid gap-4 md:grid-cols-3">
        {widgetOrder.map((id, idx) => {
          const def = widgetMap.get(id);
          if (!def) return null;
          const Widget = def.component;
          const isDragging = dragIdx === idx;
          const isDragOver = dragOverIdx === idx && dragIdx !== idx;

          return (
            <div
              key={id}
              draggable={isEditing}
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={handleDragEnd}
              className={cn(
                "transition-all duration-300",
                def.wide ? "md:col-span-2 lg:col-span-2" : "md:col-span-1 lg:col-span-1",
                isEditing && "cursor-grab active:cursor-grabbing",
                isDragging && "opacity-40 scale-[0.98]",
                isDragOver && "ring-2 ring-primary/80 ring-offset-2 ring-offset-background rounded-xl shadow-[0_0_15px_rgba(var(--primary),0.5)]",
              )}
            >
              {isEditing && (
                <div className="flex items-center justify-between bg-primary/10 border border-primary/20 border-b-0 rounded-t-xl px-3 py-1.5 text-xs text-primary font-medium">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-3 w-3" />
                    <span className="uppercase tracking-wider">{def.label}</span>
                  </div>
                  {def.wide && <Badge variant="outline" className="text-[9px] border-primary/30 text-primary">WIDE</Badge>}
                </div>
              )}
              <div className={cn("h-full", isEditing && "rounded-t-none overflow-hidden ring-1 ring-primary/20")}>
                <Widget />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}`);

// Also fix some text colors in Widgets to use neon accents
content = content.replace(/text-arena-pop/g, 'text-accent');
content = content.replace(/bg-arena-pop/g, 'bg-accent');
content = content.replace(/glow-primary/g, 'glow-neon-green');

fs.writeFileSync('src/pages/Dashboard.tsx', content);
