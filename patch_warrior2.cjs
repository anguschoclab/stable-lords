const fs = require('fs');
let content = fs.readFileSync('src/pages/WarriorDetail.tsx', 'utf8');

const searchEq = `        {/* 4. Equipment */}
        <Card className="md:col-span-12">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 font-display">
              <Shield className="h-4 w-4 text-primary" /> Current Equipment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['weapon', 'shield', 'armor', 'helm'].map(slot => {
                const eqId = warrior.equipment?.[slot as keyof typeof warrior.equipment];
                const item = eqId ? getItem(eqId) : null;
                return (
                  <div key={slot} className="p-3 border rounded-md bg-secondary/30 relative">
                    <div className="text-[10px] uppercase text-muted-foreground mb-1 tracking-wider">{slot}</div>
                    {item ? (
                      <div>
                        <div className="font-semibold text-sm leading-tight text-foreground">{item.name}</div>
                        <div className="text-xs text-muted-foreground mt-1 flex flex-col gap-0.5">
                          {item.attack > 0 && <span>+{item.attack} ATT</span>}
                          {item.defense > 0 && <span>+{item.defense} DEF</span>}
                          {item.damageType && <span>Dmg: {item.damageType}</span>}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground italic">None</div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>`;

const replaceEq = `        {/* 4. Equipment */}
        <Card className="md:col-span-12 border-border/50 shadow-sm bg-background">
          <CardHeader className="pb-2 border-b border-border/20 bg-secondary/10">
            <CardTitle className="text-sm font-display uppercase tracking-wide flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" /> LOADOUT / EQUIPMENT
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 bg-secondary/5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['weapon', 'shield', 'armor', 'helm'].map(slot => {
                const eqId = warrior.equipment?.[slot as keyof typeof warrior.equipment];
                const item = eqId ? getItem(eqId) : null;
                return (
                  <div key={slot} className="p-3 border border-border/30 rounded-lg bg-background shadow-inner relative hover:border-primary/50 transition-colors">
                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-border/10">
                       <span className="text-[10px] uppercase text-muted-foreground tracking-wider font-bold">{slot}</span>
                       <Shield className="h-3 w-3 text-border" />
                    </div>
                    {item ? (
                      <div className="flex flex-col h-[70px] justify-between">
                        <div className="font-bold text-sm leading-tight text-foreground truncate">{item.name}</div>
                        <div className="flex items-center gap-2 mt-auto">
                          {item.attack > 0 && <span className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded font-mono font-bold">+{item.attack} ATT</span>}
                          {item.defense > 0 && <span className="text-[10px] bg-arena-pop/10 text-arena-pop px-1.5 py-0.5 rounded font-mono font-bold">+{item.defense} DEF</span>}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col h-[70px] justify-center items-center opacity-50">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">EMPTY</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>`;

content = content.replace(searchEq, replaceEq);
fs.writeFileSync('src/pages/WarriorDetail.tsx', content);
