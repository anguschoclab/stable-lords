const fs = require('fs');
let code = fs.readFileSync('src/test/engine/economy.test.ts', 'utf8');

code = code.replace(/console\.log\(breakdown\); expect\(breakdown\.totalIncome\)\.toBe\(45\);/, 'expect(breakdown.totalIncome).toBe(45);');

fs.writeFileSync('src/test/engine/economy.test.ts', code);
