/**
 * Rich-warrior 1v1 matchup harness — measures the *combined* effect of:
 *   • style passives + matchup matrix (the "clean" lens)
 *   • style classic weapon (+1 ATT when matching)
 *   • discovered favorite weapon (+1 ATT)
 *   • discovered favorite rhythm (+2 INI when default plan's OE/AL matches)
 *   • mastery tier (scales passives by m.bonus / m.mult)
 *
 * Compared against the clean harness, this answers the user's question:
 * "How do interactions of passives, traits, favorite weapons, favorite OE/AL
 *  affect these comparisons?"
 *
 * Key finding shape: clean harness measures the floor; rich harness measures
 * the ceiling. The delta tells you how much variance the ancillary systems
 * inject and which styles benefit/suffer most.
 */
import { simulateFight, defaultPlanForWarrior } from '../src/engine/simulate';
import { makeWarrior } from '../src/engine/factories/warriorFactory';
import { FightingStyle, type WarriorId } from '../src/types/shared.types';
import { SeededRNGService } from '../src/engine/core/rng/SeededRNGService';
import { STYLE_CLASSIC_WEAPONS, DEFAULT_LOADOUT } from '../src/data/equipment';
import type { Warrior } from '../src/types/warrior.types';

const STYLES = [
  FightingStyle.AimedBlow,
  FightingStyle.BashingAttack,
  FightingStyle.LungingAttack,
  FightingStyle.ParryLunge,
  FightingStyle.ParryRiposte,
  FightingStyle.ParryStrike,
  FightingStyle.SlashingAttack,
  FightingStyle.StrikingAttack,
  FightingStyle.TotalParry,
  FightingStyle.WallOfSteel,
];
const ABBR = ['AB', 'BA', 'LU', 'PL', 'PR', 'PS', 'SL', 'ST', 'TP', 'WS'];

const N_PER_PAIR = parseInt(process.argv[2] || '200');
const MODE = (process.argv[3] || 'rich') as 'clean' | 'rich' | 'classic_only' | 'fav_only' | 'mastery_only';

// Style-appropriate attribute pools — same total budget across styles, but
// distributed to satisfy each style's classic-weapon requirements (e.g. PR's
// epee needs WT≥15 + DF≥15). Without this, "classic_only" mode penalizes
// styles whose canonical weapon has high stat reqs.
const STYLE_ATTRS: Record<FightingStyle, { primary: ('ST'|'CN'|'SZ'|'WT'|'WL'|'SP'|'DF')[]; }> = {
  [FightingStyle.AimedBlow]:      { primary: ['DF', 'WT', 'SP'] },
  [FightingStyle.BashingAttack]:  { primary: ['ST', 'SZ', 'CN'] },
  [FightingStyle.LungingAttack]:  { primary: ['SP', 'WT', 'ST'] },
  [FightingStyle.ParryLunge]:     { primary: ['DF', 'WT', 'SP'] },
  [FightingStyle.ParryRiposte]:   { primary: ['DF', 'WT', 'SP'] },
  [FightingStyle.ParryStrike]:    { primary: ['DF', 'WT', 'SP'] },
  [FightingStyle.SlashingAttack]: { primary: ['SP', 'ST', 'WT'] },
  [FightingStyle.StrikingAttack]: { primary: ['ST', 'SP', 'WT'] },
  [FightingStyle.TotalParry]:     { primary: ['DF', 'CN', 'WT'] },
  [FightingStyle.WallOfSteel]:    { primary: ['ST', 'CN', 'WT'] },
};

function buildWarrior(style: FightingStyle, name: string, seed: number, mode: typeof MODE): Warrior {
  const rng = new SeededRNGService(seed);
  // Same total budget across styles (~91 points), allocated so primary stats
  // hit 16 (clears 15-stat reqs) and secondaries sit around 10-12.
  const primary = new Set(STYLE_ATTRS[style].primary);
  const roll = (low: number, high: number) => low + Math.floor(rng.next() * (high - low + 1));
  const attrs = {
    ST: primary.has('ST') ? roll(15, 17) : roll(10, 12),
    CN: primary.has('CN') ? roll(15, 17) : roll(10, 12),
    SZ: primary.has('SZ') ? roll(15, 17) : roll(10, 12),
    WT: primary.has('WT') ? roll(15, 17) : roll(10, 12),
    WL: primary.has('WL') ? roll(15, 17) : roll(11, 13),
    SP: primary.has('SP') ? roll(15, 17) : roll(10, 12),
    DF: primary.has('DF') ? roll(15, 17) : roll(10, 12),
  };
  const w = makeWarrior(undefined as unknown as WarriorId, name, style, attrs, undefined, rng);

  // ── equip style classic weapon (so every style gets the +1 classic bonus)
  if (mode === 'rich' || mode === 'classic_only') {
    const classicWeapon = STYLE_CLASSIC_WEAPONS[style];
    w.equipment = { ...DEFAULT_LOADOUT, weapon: classicWeapon ?? DEFAULT_LOADOUT.weapon };
  }

  // ── pre-discover favorites; align rhythm with default plan when possible so
  // it actually fires
  if (mode === 'rich' || mode === 'fav_only') {
    if (w.favorites) {
      w.favorites.discovered.weapon = true;
      w.favorites.discovered.rhythm = true;
      // Force favorite weapon to match equipped (so the +1 ATT actually fires)
      if (mode === 'rich') {
        w.favorites.weaponId = w.equipment?.weapon ?? 'broadsword';
      } else {
        // fav_only mode: ensure equipped weapon = favorite (so we measure favorite's ceiling)
        w.equipment = { ...DEFAULT_LOADOUT, weapon: w.favorites.weaponId };
      }
      // Force favorite rhythm to match the default plan's OE/AL so the +2 INI fires
      const plan = defaultPlanForWarrior(w);
      w.favorites.rhythm = { oe: plan.OE, al: plan.AL };
    }
  }

  // ── mastery: totalFights ≥ 50 → Master tier (max scaling)
  if (mode === 'rich' || mode === 'mastery_only') {
    w.career = { wins: 30, losses: 20, kills: 5 };
  }

  return w;
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
      const seed = (i * 1000 + j * 100 + n) >>> 0;
      const wA = buildWarrior(STYLES[i]!, `A_${i}_${n}`, seed * 31 + 7, MODE);
      const wD = buildWarrior(STYLES[j]!, `D_${j}_${n}`, seed * 31 + 13, MODE);
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
}

const elapsed = ((Date.now() - start) / 1000).toFixed(1);
const print = (s: string) => process.stdout.write(s + '\n');

print(`\n=== HARNESS — ${MODE.toUpperCase()} MODE — ${N_PER_PAIR} bouts/cell, ${totalBouts} total (${elapsed}s) ===\n`);

print('=== AGGREGATE WIN RATES ===');
for (let i = 0; i < 10; i++) {
  let wins = 0, total = 0, kills = 0;
  for (let j = 0; j < 10; j++) {
    wins += grid[i]![j]!.aWins + grid[j]![i]!.dWins;
    total += grid[i]![j]!.aWins + grid[i]![j]!.dWins + grid[i]![j]!.draws;
    total += grid[j]![i]!.aWins + grid[j]![i]!.dWins + grid[j]![i]!.draws;
    kills += grid[i]![j]!.kills + grid[j]![i]!.kills;
  }
  total -= grid[i]![i]!.aWins + grid[i]![i]!.dWins + grid[i]![i]!.draws;
  wins -= grid[i]![i]!.aWins + grid[i]![i]!.dWins;
  total += grid[i]![i]!.aWins + grid[i]![i]!.dWins + grid[i]![i]!.draws;
  wins += grid[i]![i]!.aWins + grid[i]![i]!.dWins;
  kills -= grid[i]![i]!.kills;
  const wpct = total > 0 ? (100 * wins / total).toFixed(1) : '-';
  const kpct = total > 0 ? (100 * kills / total).toFixed(1) : '-';
  print(`${ABBR[i]!.padEnd(3)} | ${String(total).padStart(5)} | ${wpct.padStart(5)}% | kill ${kpct}%`);
}
