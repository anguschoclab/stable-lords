const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/engine/simulate.ts');
let code = fs.readFileSync(filePath, 'utf8');

// Ensure import is there
if (code.includes('getSecureSeed()') && !code.includes('import { getSecureSeed }')) {
    const importStatement = "import { getSecureSeed } from \"@/utils/random\";\n";
    // insert after imports
    const lastImportIndex = code.lastIndexOf('import');
    const newlineAfterImport = code.indexOf('\n', lastImportIndex);
    code = code.substring(0, newlineAfterImport + 1) + importStatement + code.substring(newlineAfterImport + 1);
    fs.writeFileSync(filePath, code);
}
