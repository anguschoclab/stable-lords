/**
 * Clean 1v1 matchup harness — samples each style-vs-style cell uniformly with
 * matched-attribute warriors, no world-sim cascading. Eliminates the
 * draft-feedback / population-shift noise that pollutes the world-driven audit.
 *
 * Each pair gets N bouts with mirrored attribute distributions so any residual
 * win-rate skew is attributable to (matchup matrix + style passives + RNG).
 */
import { simulateFight, defaultPlanForWarrior } from '../src/engine/simulate';
import { makeWarrior } from '../src/engine/factories/warriorFactory';
import { setFeatureFlags } from '../src/engine/featureFlags';
import { FightingStyle, type WarriorId } from '../src/types/shared.types';
import { SeededRNGService } from '../src/engine/core/rng/SeededRNGService';

setFeatureFlags({ skipCombatNarration: true });

const STYLES = [
  FightingStyle.AimedBlow,       // AB
  FightingStyle.BashingAttack,   // BA
  FightingStyle.LungingAttack,   // LU
  FightingStyle.ParryLunge,      // PL
  FightingStyle.ParryRiposte,    // PR
  FightingStyle.ParryStrike,     // PS
  FightingStyle.SlashingAttack,  // SL
  FightingStyle.StrikingAttack,  // ST
  FightingStyle.TotalParry,      // TP
  FightingStyle.WallOfSteel,     // WS
];
const ABBR = ['AB', 'BA', 'LU', 'PL', 'PR', 'PS', 'SL', 'ST', 'TP', 'WS'];

const N_PER_PAIR = parseInt(process.argv[2] || '500');

// Balanced attribute kit. Same values for both warriors so passives + matrix
// + RNG are the only variables. Slight randomization per warrior creation but
// from a controlled seed so re-runs are deterministic.
function buildWarrior(style: FightingStyle, name: string, seed: number) {
  const rng = new SeededRNGService(seed);
  const attrs = {
    ST: 12 + Math.floor(rng.next() * 3),
    CN: 12 + Math.floor(rng.next() * 3),
    SZ: 12 + Math.floor(rng.next() * 3),
    WT: 12 + Math.floor(rng.next() * 3),
    WL: 12 + Math.floor(rng.next() * 3),
    SP: 12 + Math.floor(rng.next() * 3),
    DF: 12 + Math.floor(rng.next() * 3),
  };
  return makeWarrior(undefined as unknown as WarriorId, name, style, attrs, undefined, rng);
}

type Cell = { aWins: number; dWins: number; draws: number; kills: number };
const grid: Cell[][] = Array.from({ length: 10 }, () =>
  Array.from({ length: 10 }, () => ({ aWins: 0, dWins: 0, draws: 0, kills: 0 }))
);

const start = Date.now();
let totalBouts = 0;

for (let i = 0; i < 10; i++) {
  for (let j = 0; j < 10; j++) {
    for (let n = 0; n < N_PER_PAIR; n++) {
      // Distinct seeds per warrior + per bout so the same matched attributes
      // don't produce a repeating outcome
      const seed = (i * 1000 + j * 100 + n) >>> 0;
      const wA = buildWarrior(STYLES[i]!, `A_${i}_${n}`, seed * 31 + 7);
      const wD = buildWarrior(STYLES[j]!, `D_${j}_${n}`, seed * 31 + 13);
      const planA = defaultPlanForWarrior(wA);
      const planD = defaultPlanForWarrior(wD);
      const outcome = simulateFight(planA, planD, wA, wD, seed);
      const cell = grid[i]![j]!;
      if (outcome.winner === 'A') cell.aWins++;
      else if (outcome.winner === 'D') cell.dWins++;
      else cell.draws++;
      if (outcome.by === 'Kill') cell.kills++;
      totalBouts++;
    }
  }
  process.stderr.write(`  row ${i + 1}/10 done\n`);
}

const elapsed = ((Date.now() - start) / 1000).toFixed(1);
const print = (s: string) => process.stdout.write(s + '\n');

print(`\n=== UNIFORM 1v1 HARNESS — ${N_PER_PAIR} bouts/cell, ${totalBouts} total (${elapsed}s) ===\n`);

// Aggregate per-style W%
print('=== AGGREGATE WIN RATES (across all matchups, both A and D positions) ===');
print('Style | Bouts | W%    | Kill rate');
for (let i = 0; i < 10; i++) {
  let wins = 0, total = 0, kills = 0;
  for (let j = 0; j < 10; j++) {
    wins += grid[i]![j]!.aWins + grid[j]![i]!.dWins;
    total += grid[i]![j]!.aWins + grid[i]![j]!.dWins + grid[i]![j]!.draws;
    total += grid[j]![i]!.aWins + grid[j]![i]!.dWins + grid[j]![i]!.draws;
    kills += grid[i]![j]!.kills + grid[j]![i]!.kills;
  }
  // De-dup mirror double count
  total -= grid[i]![i]!.aWins + grid[i]![i]!.dWins + grid[i]![i]!.draws;
  wins -= grid[i]![i]!.aWins + grid[i]![i]!.dWins;
  total += grid[i]![i]!.aWins + grid[i]![i]!.dWins + grid[i]![i]!.draws;
  wins += grid[i]![i]!.aWins + grid[i]![i]!.dWins;
  kills -= grid[i]![i]!.kills;
  const wpct = total > 0 ? (100 * wins / total).toFixed(1) : '-';
  const kpct = total > 0 ? (100 * kills / total).toFixed(1) : '-';
  print(`${ABBR[i]!.padEnd(3)} | ${String(total).padStart(5)} | ${wpct.padStart(5)}% | ${kpct.padStart(4)}%`);
}

// Symmetric per-pair view (i wins / total when sides are mirrored)
print('\n=== PER-MATCHUP IMBALANCE (sorted by deviation) ===');
print('Pair    | Bouts | i_W%  | Deviation | Edge to');
type Row = { i: number; j: number; iWins: number; jWins: number; total: number; iWP: number; dev: number };
const matchups: Row[] = [];
for (let i = 0; i < 10; i++) {
  for (let j = i; j < 10; j++) {
    let iWins = 0, jWins = 0, total = 0;
    if (i === j) {
      const c = grid[i]![j]!;
      iWins = c.aWins;
      jWins = c.dWins;
      total = c.aWins + c.dWins + c.draws;
    } else {
      const c1 = grid[i]![j]!;
      const c2 = grid[j]![i]!;
      iWins = c1.aWins + c2.dWins;
      jWins = c1.dWins + c2.aWins;
      total = c1.aWins + c1.dWins + c1.draws + c2.aWins + c2.dWins + c2.draws;
    }
    if (total === 0) continue;
    const iWP = 100 * iWins / total;
    matchups.push({ i, j, iWins, jWins, total, iWP, dev: Math.abs(50 - iWP) });
  }
}
matchups.sort((a, b) => b.dev - a.dev);
for (const m of matchups) {
  const edge = m.iWP > 50 ? ABBR[m.i]! : ABBR[m.j]!;
  print(`${ABBR[m.i]!} v ${ABBR[m.j]!} | ${String(m.total).padStart(5)} | ${m.iWP.toFixed(1).padStart(5)}% | ${m.dev.toFixed(1).padStart(4)}pp     | ${edge}`);
}

// Compact grid (rows = i style, cols = j style, value = i_W% combining both A and D positions)
print('\n=== COMPACT MATCHUP GRID (i row vs j col, i_W% combined both positions) ===');
print('     ' + ABBR.map(s => s.padStart(5)).join(' '));
for (let i = 0; i < 10; i++) {
  let row = `${ABBR[i]!.padEnd(4)} `;
  for (let j = 0; j < 10; j++) {
    let total = 0, iWins = 0;
    if (i === j) {
      total = grid[i]![j]!.aWins + grid[i]![j]!.dWins + grid[i]![j]!.draws;
      iWins = grid[i]![j]!.aWins;
    } else {
      const c1 = grid[i]![j]!;
      const c2 = grid[j]![i]!;
      total = c1.aWins + c1.dWins + c1.draws + c2.aWins + c2.dWins + c2.draws;
      iWins = c1.aWins + c2.dWins;
    }
    row += `${(100 * iWins / total).toFixed(0).padStart(4)}%`;
    row += ' ';
  }
  print(row);
}
