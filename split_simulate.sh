cat << 'INNER_EOF' > src/engine/simulate.ts
export { createFighterState } from "./bout/fighterState";
export { resolveDecision } from "./bout/decisionLogic";
export { defaultPlanForWarrior } from "./bout/planDefaults";
export { simulateFight } from "./combat/services/simulateFightService";
INNER_EOF
bun test src/test/combat.test.ts
