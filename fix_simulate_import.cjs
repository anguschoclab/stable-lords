const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/engine/simulate.ts');
let code = fs.readFileSync(filePath, 'utf8');

// remove misplaced import
code = code.replace('import {\nimport { getSecureSeed } from "@/utils/random";', 'import {');

// append to the end of imports
const endOfImports = code.lastIndexOf('} from "./narrativePBP";') + '} from "./narrativePBP";'.length;
code = code.slice(0, endOfImports) + '\nimport { getSecureSeed } from "@/utils/random";' + code.slice(endOfImports);

fs.writeFileSync(filePath, code);
