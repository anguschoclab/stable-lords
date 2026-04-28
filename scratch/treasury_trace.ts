import { createFreshState } from "../src/engine/factories";
import { advanceWeek } from "../src/engine/pipeline/services/weekPipelineService";
console.log = () => {};

let state = createFreshState("treasury-trace");
state.roster = [];

const origLog = (process as any).stdout.write.bind(process.stdout);
const print = (s: string) => origLog(s + '\n');

// Run a few weeks to seed roster, then observe in detail
for (let w = 1; w <= 30; w++) {
  state = advanceWeek(state);
  if (state.arenaHistory.length > 50) state.arenaHistory = state.arenaHistory.slice(-50);
  state.newsletter = [];
  state.gazettes = [];
  state.ledger = [];
}

print(`After 30 weeks, rivals: ${state.rivals.length}`);
state.rivals.forEach(r => {
  print(`  ${r.id.slice(0, 8)} | roster=${r.roster.length} | treasury=${r.treasury} | fame=${r.owner.fame} | tier=${r.tier}`);
});

print(`\n=== TICK 31 DETAIL ===`);
const before = state.rivals.map(r => ({ id: r.id, treasury: r.treasury, roster: r.roster.length }));
print(`Before: ${before.map(b => `${b.id.slice(0,8)}=${b.treasury}g r=${b.roster}`).join(' | ')}`);

state = advanceWeek(state);

print(`\nFights this week: ${state.arenaHistory.filter(f => f.week === state.week - 1).length}`);
state.arenaHistory.filter(f => f.week === state.week - 1).slice(0, 10).forEach(f => {
  print(`  ${f.styleA} (${f.stableIdA?.slice(0,8) ?? '?'}) vs ${f.styleD} (${f.stableIdD?.slice(0,8) ?? '?'}) → winner=${f.winner} by=${f.by}`);
});

const after = state.rivals.map(r => ({ id: r.id, treasury: r.treasury, roster: r.roster.length }));
print(`\nAfter: ${after.map(b => `${b.id.slice(0,8)}=${b.treasury}g r=${b.roster}`).join(' | ')}`);
print(`Delta: ${state.rivals.map((r, i) => `${r.id.slice(0,8)}=${r.treasury - before[i]!.treasury}`).join(' | ')}`);
