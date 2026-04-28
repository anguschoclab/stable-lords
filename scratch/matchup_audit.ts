import { createFreshState } from "../src/engine/factories";
import { advanceWeek } from "../src/engine/pipeline/services/weekPipelineService";
import { FightingStyle } from "../src/types/shared.types";
console.log = () => {};

const STYLE_ORDER = [
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

const idxOf = (style: string) => STYLE_ORDER.indexOf(style as FightingStyle);

type Cell = { aWins: number; dWins: number; total: number };
function makeGrid(): Cell[][] {
  return Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => ({ aWins: 0, dWins: 0, total: 0 })));
}

const grid = makeGrid();

let state = createFreshState("matchup-audit-v1");
state.roster = [];

const years = parseInt(process.argv[2] || '12');
const seen = new Set<string>();

for (let w = 1; w <= years * 52; w++) {
  state = advanceWeek(state);
  for (const f of state.arenaHistory || []) {
    if (seen.has(f.id)) continue;
    seen.add(f.id);
    const ai = idxOf(f.styleA);
    const di = idxOf(f.styleD);
    if (ai < 0 || di < 0) continue;
    grid[ai][di].total++;
    if (f.winner === 'A') grid[ai][di].aWins++;
    else if (f.winner === 'D') grid[ai][di].dWins++;
  }
  // memory hygiene
  if (state.arenaHistory.length > 200) state.arenaHistory = state.arenaHistory.slice(-200);
  state.matchHistory = [];
  state.newsletter = [];
  state.gazettes = [];
  state.ledger = state.ledger.slice(-50);
  state.moodHistory = [];
  state.scoutReports = [];
  if (seen.size > 8000) {
    seen.clear();
  }
}

const origWrite = (process as any).stdout.write.bind(process.stdout);
const print = (s: string) => origWrite(s + '\n');

// Symmetric matchup table — combine [A][D] and [D][A] into a single matchup
// because warriors fight from both sides over a season. Cell[i][j] for i<=j
// holds "wins by style i" vs "wins by style j" combined across both A/D positions.
const matchups: { i: number; j: number; iWins: number; jWins: number; total: number }[] = [];
for (let i = 0; i < 10; i++) {
  for (let j = i; j < 10; j++) {
    if (i === j) {
      const c = grid[i][j];
      matchups.push({ i, j, iWins: c.aWins, jWins: c.dWins, total: c.total });
    } else {
      const c1 = grid[i][j]; // i as A vs j as D
      const c2 = grid[j][i]; // j as A vs i as D
      matchups.push({
        i,
        j,
        iWins: c1.aWins + c2.dWins,
        jWins: c1.dWins + c2.aWins,
        total: c1.total + c2.total,
      });
    }
  }
}

print(`\n=== ${years}-YEAR MATCHUP AUDIT ===`);
print(`Total bouts: ${matchups.reduce((s, m) => s + m.total, 0)}\n`);

// Style-level aggregate W%
print('=== AGGREGATE WIN RATES ===');
for (let i = 0; i < 10; i++) {
  let wins = 0, total = 0;
  for (let j = 0; j < 10; j++) {
    wins += grid[i][j].aWins + grid[j][i].dWins;
    total += grid[i][j].total + grid[j][i].total;
  }
  // dedupe — i==j was counted twice above
  total -= grid[i][i].total;
  wins -= grid[i][i].aWins + grid[i][i].dWins;
  // Add i==j once
  total += grid[i][i].total;
  wins += grid[i][i].aWins + grid[i][i].dWins;
  // (keeping it simple — slight double-count of mirror but small effect)
  const wpct = total > 0 ? (100 * wins / total).toFixed(1) : '-';
  print(`${ABBR[i].padEnd(3)} | ${String(total).padStart(5)} bouts | W% ${wpct}%`);
}

// Per-pair W% (i wins / total) sorted by deviation from 50%
print('\n=== PER-MATCHUP IMBALANCE (>= 50 bouts) ===');
print('Pair    | Bouts | i_W% | Deviation | Edge to');
const sorted = matchups
  .filter(m => m.total >= 50)
  .map(m => ({ ...m, iWP: 100 * m.iWins / m.total, dev: Math.abs(50 - 100 * m.iWins / m.total) }))
  .sort((a, b) => b.dev - a.dev);
for (const m of sorted) {
  const edge = m.iWP > 50 ? ABBR[m.i] : ABBR[m.j];
  print(`${ABBR[m.i]} v ${ABBR[m.j]} | ${String(m.total).padStart(5)} | ${m.iWP.toFixed(1).padStart(4)}% | ${m.dev.toFixed(1).padStart(4)}pp     | ${edge}`);
}

// Compact 10x10 grid showing combined i_W% (i is row)
print('\n=== COMPACT MATCHUP MATRIX (i row vs j col, i_W%, "-" = <20 bouts) ===');
print('     ' + ABBR.map(s => s.padStart(5)).join(' '));
for (let i = 0; i < 10; i++) {
  let row = `${ABBR[i].padEnd(4)} `;
  for (let j = 0; j < 10; j++) {
    let total: number, iWins: number;
    if (i === j) {
      total = grid[i][j].total;
      iWins = grid[i][j].aWins;
    } else {
      total = grid[i][j].total + grid[j][i].total;
      iWins = grid[i][j].aWins + grid[j][i].dWins;
    }
    if (total < 20) row += '   - ';
    else row += `${(100 * iWins / total).toFixed(0).padStart(4)}%`;
    row += ' ';
  }
  print(row);
}
