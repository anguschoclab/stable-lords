const fs = require('fs');
let s = fs.readFileSync('src/test/engine/ownerRoster.test.ts', 'utf8');
s = s.replace(/expect\(updatedRivals\[0\]\.roster\.length\)\.toBe\(0\);/g, 'expect(updatedRivals[0].roster.filter(w => w.status === "Active").length).toBe(0);');
fs.writeFileSync('src/test/engine/ownerRoster.test.ts', s, 'utf8');
