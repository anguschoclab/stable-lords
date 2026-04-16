const fs = require('fs');

const tsFilePath = 'src/types/narrative.types.ts';
let tsContent = fs.readFileSync(tsFilePath, 'utf8');

// Update conclusions type to allow string[]
tsContent = tsContent.replace(
  /export interface Conclusions {([\s\S]*?)}/,
  `export interface Conclusions {
  Kill: string | string[];
  KO: string | string[];
  Stoppage: string | string[];
  Exhaustion: string | string[];
}`
);

fs.writeFileSync(tsFilePath, tsContent);
console.log("Updated narrative.types.ts successfully!");
