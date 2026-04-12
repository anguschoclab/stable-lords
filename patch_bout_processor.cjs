const fs = require('fs');
const path = 'src/engine/bout/services/boutProcessorService.ts';
let code = fs.readFileSync(path, 'utf8');

const importHelpers = `import { validateBoutCombatants, calculateBoutFame, processContractPayouts, getWinnerId, getDefaultPlan } from "../core/resolveHelpers";\n`;

code = code.replace(
  `import { StateImpact, mergeImpacts } from "@/engine/impacts";`,
  `import { StateImpact, mergeImpacts } from "@/engine/impacts";\n${importHelpers}`
);

const startIndex = code.indexOf('export function resolveBout(');
const processWeekBoutsIndex = code.indexOf('export function processWeekBouts(');

const before = code.substring(0, startIndex);
const after = code.substring(processWeekBoutsIndex);

const newResolveBout = `export function resolveBout(state: GameState, ctx: BoutContext): BoutImpact {
  const { warrior, opponent, isRivalry, rivalStable, rivalStableId, moodMods, week, warriorMap, contract } = ctx;
  const cW = warriorMap?.get(warrior?.id);
  const cO = warriorMap?.get(opponent?.id);

  if (!validateBoutCombatants(cW, cO)) {
    return { impact: {}, result: { a: warrior, d: opponent, outcome: { winner: null, by: "Draw", minutes: 0, log: [] } as FightOutcome, isRivalry, rivalStable, contractId: contract?.id }, stats: { death: false, playerDeath: false, injured: false, deathNames: [], injuredNames: [] } };
  }

  const boutSeed = hashStr(\`\${week}|\${cW!.id}|\${cO!.id}\`);
  const rng = new SeededRNGService(boutSeed);
  const outcome = simulateFight(getDefaultPlan(cW!, defaultPlanForWarrior), getDefaultPlan(cO!, defaultPlanForWarrior), cW!, cO!, boutSeed, state.trainers, state.weather);
  const tags = outcome.post?.tags ?? [];

  const { fameA, popA, fameD, popD } = calculateBoutFame(outcome, tags, moodMods, isRivalry);

  const impacts: StateImpact[] = processContractPayouts(state, contract, getWinnerId(outcome, cW!.id, cO!.id), cW!.id, cO!.id, rivalStableId);
  impacts.push(applyRecords(state, cW!, cO!, outcome, tags, fameA, popA, fameD, popD, rivalStableId));

  const deathRes = handleDeath(state, cW!, cO!, outcome, week, tags, rivalStableId, rng);
  const injuryRes = handleInjuries(state, cW!, cO!, outcome, week, rivalStableId, boutSeed);
  impacts.push(deathRes.impact, injuryRes.impact, handleProgressions(state, cW!, cO!, outcome, tags, week, rivalStableId, rng));

  const { summary, announcement } = handleReporting(cW!, cO!, outcome, tags, fameA, popA, fameD, popD, week, rivalStableId, isRivalry, 0, rng);
  impacts.push({ arenaHistory: [summary] });
  engineEventBus.emit({ type: 'BOUT_COMPLETED', payload: { summary, transcript: summary.transcript } });

  return { impact: mergeImpacts(impacts), result: { a: warrior, d: opponent, outcome, announcement, isRivalry, rivalStable, contractId: contract?.id }, stats: { death: deathRes.death, playerDeath: deathRes.playerDeath, injured: injuryRes.injured, deathNames: deathRes.deathNames, injuredNames: injuryRes.injuredNames } };
}

`;

fs.writeFileSync(path, before + newResolveBout + after);
