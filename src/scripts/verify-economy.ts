import { computeWeeklyBreakdown } from '../engine/economy';
import { createFreshState } from '../engine/factories';
import { WARRIOR_UPKEEP_BASE } from '../data/economyConstants';

// Create a state with one high-fame warrior
const state = createFreshState('test');
state.roster = [
  {
    id: 'w1',
    name: 'MAXIMUS',
    fame: 50,
    status: 'Active',
    career: { wins: 10, losses: 0, kills: 0 },
    attributes: { ST: 15, WT: 15, SP: 15, DF: 15 },
    baseSkills: { ATT: 15, DEF: 15 },
  } as any,
];

const result = computeWeeklyBreakdown(state);
console.log('Weekly Breakdown for 50 Fame Warrior:');
console.log('Income:', JSON.stringify(result.income, null, 2));
console.log('Expenses:', JSON.stringify(result.expenses, null, 2));
console.log('Net:', result.net);

// Expected Patronage: (50 - 40) / 10 * 25 = 25
// Expected Upkeep: WARRIOR_UPKEEP_BASE (60) + (50 / 10) * 15 (75) = 135
// Net (no fights): 25 - 135 = -110

const patronage = result.income.find((i) => i.label === 'Noble Patronage Contribution')?.amount;
const upkeep = result.expenses.find((e) => e.label === 'Warrior upkeep (1)')?.amount;

if (patronage === 25 && upkeep === 135) {
  console.log('✅ Patronage & Maintenance logic verified successfully.');
} else {
  console.log('❌ Logic mismatch!');
  process.exit(1);
}
