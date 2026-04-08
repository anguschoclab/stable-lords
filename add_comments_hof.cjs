const fs = require('fs');
let content = fs.readFileSync('src/engine/pipeline/core/hallOfFame.ts', 'utf8');

content = content.replace(
  '  // 1. Warrior of the Year (Most Wins delta)\n  const woty = eligible.reduce((max, curr) => (curr.wins > max.wins || (curr.wins === max.wins && curr.fame > max.fame)) ? curr : max, eligible[0]);',
  '  // 1. Warrior of the Year (Most Wins delta)\n  // ⚡ Bolt: Reduced O(N log N) sort to O(N) linear scan to track max wins.\n  const woty = eligible.reduce((max, curr) => (curr.wins > max.wins || (curr.wins === max.wins && curr.fame > max.fame)) ? curr : max, eligible[0]);'
);

content = content.replace(
  '  // 2. Killer of the Year (Most Kills delta)\n  const koty = eligible.reduce((max, curr) => (curr.kills > max.kills || (curr.kills === max.kills && curr.wins > max.wins)) ? curr : max, eligible[0]);',
  '  // 2. Killer of the Year (Most Kills delta)\n  // ⚡ Bolt: Reduced O(N log N) sort to O(N) linear scan to track max kills.\n  const koty = eligible.reduce((max, curr) => (curr.kills > max.kills || (curr.kills === max.kills && curr.wins > max.wins)) ? curr : max, eligible[0]);'
);

content = content.replace(
  '  // 3. Class MVPs (10 Styles)\n  Object.values(FightingStyle).forEach(style => {\n    const styleEligible = eligible.filter(e => e.w.style === style);\n    const mvp = styleEligible.length > 0 ? styleEligible.reduce((max, curr) => (curr.wins > max.wins || (curr.wins === max.wins && curr.fame > max.fame)) ? curr : max) : undefined;',
  '  // 3. Class MVPs (10 Styles)\n  Object.values(FightingStyle).forEach(style => {\n    const styleEligible = eligible.filter(e => e.w.style === style);\n    // ⚡ Bolt: Reduced O(N log N) sort to O(N) linear scan to prevent intermediate GC pressure.\n    const mvp = styleEligible.length > 0 ? styleEligible.reduce((max, curr) => (curr.wins > max.wins || (curr.wins === max.wins && curr.fame > max.fame)) ? curr : max) : undefined;'
);

content = content.replace(
  '  let bestStable: [string, { name: string; wins: number; fame: number }] | undefined;\n  for (const entry of stableStats.entries()) {',
  '  // ⚡ Bolt: Replaced [...stableStats.entries()].sort()[0] with O(N) iteration, saving array allocations.\n  let bestStable: [string, { name: string; wins: number; fame: number }] | undefined;\n  for (const entry of stableStats.entries()) {'
);

fs.writeFileSync('src/engine/pipeline/core/hallOfFame.ts', content);
