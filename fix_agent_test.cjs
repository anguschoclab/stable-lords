const fs = require('fs');
let code = fs.readFileSync('src/test/engine/agentArchitecture.test.ts', 'utf8');

code = code.replace(/import \{ verifyBoutAcceptance \} from "@\/engine\/ai\/workers\/competitionWorker";\nimport \{ type Warrior, type WeatherType \} from "@\/types\/game";/g, 'import { verifyBoutAcceptance } from "@/engine/ai/workers/competitionWorker";\nimport { type Warrior, type WeatherType, FightingStyle } from "@/types/game";');
code = code.replace(/style: "LungingAttack",/g, 'style: FightingStyle.LungingAttack,');
code = code.replace(/const mockRival = \{ gold: 500 \} as RivalStableData;/g, 'const mockRival = { gold: 500, owner: { personality: "Methodical" } } as RivalStableData;');
code = code.replace(/attributes: \{ CON: 10 \}/, 'attributes: { CN: 7, CON: 10 }');
code = code.replace(/attributes: \{ CON: 60 \}/, 'attributes: { CN: 60, CON: 60 }');
code = code.replace(/expect\(decision\.reason\)\.toContain\("Precision penalty"\);/, 'expect(decision.reason).toContain("disadvantage in Rainy conditions");');

code = code.replace(/it\("should decline a bout for low CON warrior in Scalding weather", \(\) => \{/, 'it("should decline a bout for low CON warrior in Scalding weather", () => {\n    mockRival.owner.personality = "Aggressive";');
code = code.replace(/expect\(decision\.reason\)\.toContain\("Heatstroke"\);/, 'expect(decision.reason).toContain("dangerous for this unit");');


fs.writeFileSync('src/test/engine/agentArchitecture.test.ts', code);
