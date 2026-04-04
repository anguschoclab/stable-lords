const fs = require('fs');
let code = fs.readFileSync('src/test/engine/pipeline/health.test.ts', 'utf8');

code = code.replace(/import { describe, it, expect, vi, beforeEach } from "vitest";/, 'import { describe, it, expect, beforeEach, vi } from "vitest";');
code = code.replace(/vi\.mock\("@\/engine\/injuries", \(\) => \(\{\n  tickInjuries: vi\.fn\(\),\n\}\)\);\n/g, '');
code = code.replace(/vi\.mock\("@\/engine\/matchmaking\/historyLogic", \(\) => \(\{\n  clearExpiredRest: vi\.fn\(\),\n\}\)\);\n/g, '');

fs.writeFileSync('src/test/engine/pipeline/health.test.ts', code);
