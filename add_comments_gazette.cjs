const fs = require('fs');
let content = fs.readFileSync('src/engine/gazetteNarrative.ts', 'utf8');

content = content.replace(
  '  if (hotStreakers.length > 0) {\n    const top = hotStreakers.reduce((max, curr) => curr.streak > max.streak ? curr : max, hotStreakers[0]);',
  '  if (hotStreakers.length > 0) {\n    // ⚡ Bolt: Reduced O(N log N) sort to O(N) single-pass reduce to find the max streak.\n    const top = hotStreakers.reduce((max, curr) => curr.streak > max.streak ? curr : max, hotStreakers[0]);'
);

fs.writeFileSync('src/engine/gazetteNarrative.ts', content);
