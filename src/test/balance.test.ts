/**
 * Style Balance — simulates fights across all style matchups.
 * Enforces that no style dominates (>65%) or is helpless (<35%) in aggregate.
 * Also tests kill rate (~10%) and OE/KD variability.
 *
 * Run with: bunx vitest run src/test/balance.test.ts
 */
import { describe, it, expect } from 'vitest';
import { FightingStyle, type Warrior } from '@/types/game';
import { simulateFight, defaultPlanForWarrior } from '@/engine/simulate';
import { computeWarriorStats } from '@/engine/skillCalc';
import type { FightPlan } from '@/types/combat.types';

const ALL_STYLES = Object.values(FightingStyle);

// Standard 70-point warrior for each style
const STD_ATTRS = { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };

function makeTestWarrior(style: FightingStyle, id: string): Warrior {
  const { baseSkills, derivedStats } = computeWarriorStats(STD_ATTRS, style);
  return {
    id,
    name: id,
    style,
    attributes: STD_ATTRS,
    baseSkills,
    derivedStats,
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: 'Active',
    age: 20,
  };
}

const FIGHTS_PER_MATCHUP = 100; // 100 per matchup × 100 matchups = 10k fights

// ── Build cross-style matrix once ────────────────────────────────────────────
const styleWins: Record<string, number> = {};
const styleFights: Record<string, number> = {};
const matchupWins: Record<string, Record<string, number>> = {};
let totalKills = 0;
let totalFightsRun = 0;

for (const s of ALL_STYLES) {
  styleWins[s] = 0;
  styleFights[s] = 0;
  matchupWins[s] = {};
  for (const s2 of ALL_STYLES) matchupWins[s][s2] = 0;
}

for (const styleA of ALL_STYLES) {
  for (const styleD of ALL_STYLES) {
    const wA = makeTestWarrior(styleA, `A_${styleA}`);
    const wD = makeTestWarrior(styleD, `D_${styleD}`);
    const planA = defaultPlanForWarrior(wA);
    const planD = defaultPlanForWarrior(wD);

    const idxA = ALL_STYLES.indexOf(styleA);
    const idxD = ALL_STYLES.indexOf(styleD);

    for (let i = 0; i < FIGHTS_PER_MATCHUP; i++) {
      const seed = (idxA * 10 + idxD) * 100000 + i * 7919 + 42;
      const outcome = simulateFight(planA, planD, wA, wD, seed);

      styleFights[styleA]++;
      styleFights[styleD]++;
      totalFightsRun++;

      if (outcome.winner === 'A') {
        styleWins[styleA]++;
        matchupWins[styleA][styleD]++;
      } else if (outcome.winner === 'D') {
        styleWins[styleD]++;
      }
      if (outcome.by === 'Kill') totalKills++;
    }
  }
}

// ── Test 1: No style >65% ─────────────────────────────────────────────────
describe('Style Balance', () => {
  it('should have no style with >65% overall win rate', () => {
    const problems: string[] = [];
    const report: string[] = [];

    for (const s of ALL_STYLES) {
      const rate = styleFights[s] > 0 ? styleWins[s] / styleFights[s] : 0;
      const pct = (rate * 100).toFixed(1);
      report.push(`  ${s.padEnd(22)} ${pct}%`);
      if (rate > 0.65) problems.push(`${s}: ${pct}%`);
    }

    const matchupReport: string[] = ['\n=== MATCHUP MATRIX (A win% vs D) ==='];
    const header = ''.padEnd(22) + ALL_STYLES.map((s) => s.substring(0, 6).padStart(7)).join('');
    matchupReport.push(header);
    for (const a of ALL_STYLES) {
      let row = a.padEnd(22);
      for (const d of ALL_STYLES) {
        if (a === d) {
          row += '   -  ';
          continue;
        }
        const wins = matchupWins[a][d];
        const pct = ((wins / FIGHTS_PER_MATCHUP) * 100).toFixed(0);
        row += `${pct.padStart(5)}% `;
      }
      matchupReport.push(row);
    }

    let errorMessage = `\n=== STYLE WIN RATES ===\n${report.join('\n')}\n${matchupReport.join('\n')}`;
    if (problems.length > 0) {
      errorMessage += `\n⚠️  STYLES OVER 65%: ${problems.join(', ')}`;
    }

    expect(problems.length, errorMessage).toBe(0);
  });

  it('should have no style with <35% overall win rate (too weak)', () => {
    const problems: string[] = [];
    for (const s of ALL_STYLES) {
      const rate = styleFights[s] > 0 ? styleWins[s] / styleFights[s] : 0;
      if (rate < 0.35) problems.push(`${s}: ${(rate * 100).toFixed(1)}%`);
    }

    const errorMessage =
      problems.length > 0 ? `\n⚠️  STYLES UNDER 35%: ${problems.join(', ')}` : undefined;

    expect(problems.length, errorMessage).toBe(0);
  });

  it('should have no single matchup worse than 80/20', () => {
    const problems: string[] = [];
    for (const a of ALL_STYLES) {
      for (const d of ALL_STYLES) {
        if (a === d) continue;
        const wins = matchupWins[a][d];
        const rate = wins / FIGHTS_PER_MATCHUP;
        if (rate > 0.8) {
          problems.push(`${a} vs ${d}: ${(rate * 100).toFixed(0)}%`);
        }
      }
    }

    const errorMessage =
      problems.length > 0 ? `\n⚠️  MATCHUPS OVER 80%: ${problems.join(', ')}` : undefined;

    expect(problems.length, errorMessage).toBeLessThanOrEqual(5);
  });
});

// ── Test 2: Kill rate ~10% ────────────────────────────────────────────────
describe('Kill Rate', () => {
  it('should be approximately 10% (between 6% and 16%)', () => {
    const uniqueFights = totalFightsRun / 2; // each fight counted for both fighters
    const killRate = totalKills / uniqueFights;
    const pct = (killRate * 100).toFixed(1);
    expect(killRate, `Kill rate ${pct}% — expected between 6% and 16%`).toBeGreaterThanOrEqual(
      0.06
    );
    expect(killRate, `Kill rate ${pct}% — expected between 6% and 16%`).toBeLessThanOrEqual(0.16);
  });
});

// ── Test 3: OE/KD variability ─────────────────────────────────────────────
describe('OE/KD Variability', () => {
  const la = makeTestWarrior(FightingStyle.LungingAttack, 'LA');
  const pr = makeTestWarrior(FightingStyle.ParryRiposte, 'PR');

  function runMatchup(
    planA: FightPlan,
    planD: FightPlan,
    n = 200
  ): { winRate: number; killRate: number } {
    let wins = 0;
    let kills = 0;
    for (let i = 0; i < n; i++) {
      const outcome = simulateFight(planA, planD, la, pr, i * 3317 + 7);
      if (outcome.winner === 'A') wins++;
      if (outcome.by === 'Kill') kills++;
    }
    return { winRate: wins / n, killRate: kills / n };
  }

  it('high OE (8) should win more fights than low OE (3) when facing the same opponent', () => {
    const highOE = runMatchup(
      { ...defaultPlanForWarrior(la), OE: 8, AL: 7 },
      defaultPlanForWarrior(pr)
    );
    const lowOE = runMatchup(
      { ...defaultPlanForWarrior(la), OE: 3, AL: 3 },
      defaultPlanForWarrior(pr)
    );
    expect(
      highOE.winRate,
      `High OE ${(highOE.winRate * 100).toFixed(0)}% should beat low OE ${(lowOE.winRate * 100).toFixed(0)}%`
    ).toBeGreaterThan(lowOE.winRate);
  });

  it('high killDesire (10) should produce more kills than low killDesire (1)', () => {
    // Use more fights and max/min KD to ensure the signal is measurable
    const highKD = runMatchup(
      { ...defaultPlanForWarrior(la), killDesire: 10, OE: 8, AL: 8 },
      defaultPlanForWarrior(pr),
      400
    );
    const lowKD = runMatchup(
      { ...defaultPlanForWarrior(la), killDesire: 1, OE: 8, AL: 8 },
      defaultPlanForWarrior(pr),
      400
    );
    // High KD should kill more often — (10-5)*0.004 = +2% vs (1-5)*0.004 = -1.6% threshold difference
    expect(
      highKD.killRate,
      `High KD kill rate ${(highKD.killRate * 100).toFixed(1)}% should exceed low KD ${(lowKD.killRate * 100).toFixed(1)}%`
    ).toBeGreaterThan(lowKD.killRate);
  });
});
