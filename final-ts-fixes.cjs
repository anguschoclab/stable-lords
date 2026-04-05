const fs = require('fs');

function repl(file, search, replace) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(search, replace);
  fs.writeFileSync(file, content, 'utf8');
}

// 1. Storage OPFS Interfaces
let opfs = fs.readFileSync('src/engine/storage/opfsArchive.ts', 'utf8');
opfs = opfs.replace(/retrieveBoutLog: \(season: number, boutId: string\) => Promise<import\("@\/types\/game"\)\.GameState \| null>;/, 'retrieveBoutLog: (season: number, boutId: string) => Promise<import("@/types/game").FightSummary | null>;');
opfs = opfs.replace(/retrieveHotState: \(slotId: string\) => Promise<import\("@\/types\/game"\)\.FightSummary \| null>;/, 'retrieveHotState: (slotId: string) => Promise<import("@/types/game").GameState | null>;');
opfs = opfs.replace(/catch \(error: unknown\)/g, 'catch (error)'); // Leave catch untyped locally or any
opfs = opfs.replace(/error\?\.name/g, '(error as Error)?.name');
opfs = opfs.replace(/error\.name/g, '(error as Error)?.name');
fs.writeFileSync('src/engine/storage/opfsArchive.ts', opfs, 'utf8');

// 2. Start Game Error
repl('src/pages/StartGame.tsx', /catch \(err: unknown\)/g, 'catch (err)');
repl('src/pages/StartGame.tsx', /err\?\.message/g, '(err as Error)?.message');

// 3. Mortality Handler casting
repl('src/engine/bout/mortalityHandler.ts', /\} as import\("@\/types\/game"\)\.GameState/g, '} as import("@/types/game").FightSummary');

// 4. idUtils math operation
repl('src/utils/idUtils.ts', /\[1e7\] as unknown as never/g, '[1e7] as unknown as number');
