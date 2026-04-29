import { createFreshState } from "../src/engine/factories";
import { advanceWeek } from "../src/engine/pipeline/services/weekPipelineService";
import { FightingStyle } from "../src/types/shared.types";
console.log = () => {};

let state = createFreshState("combat-audit-seed");
state.roster = [];

const styleStats: Record<string, { wins: number; losses: number; kills: number; deaths: number; bouts: number }> = {};
function bump(style: string, k: keyof (typeof styleStats)[string]) {
  if (!styleStats[style]) styleStats[style] = { wins: 0, losses: 0, kills: 0, deaths: 0, bouts: 0 };
  styleStats[style][k]++;
}

const fightLengths: number[] = [];
let totalBouts = 0;
let totalKills = 0;
const totalRepeats = 0; // injuries that don't kill

const years = 8;
let processedFightIds = new Set<string>();

for (let w = 1; w <= years * 52; w++) {
  state = advanceWeek(state);

  // Walk arenaHistory for new fights
  for (const fight of state.arenaHistory || []) {
    if (processedFightIds.has(fight.id)) continue;
    processedFightIds.add(fight.id);
    totalBouts++;
    bump(fight.styleA, 'bouts');
    bump(fight.styleD, 'bouts');
    if (fight.winner === 'A') {
      bump(fight.styleA, 'wins');
      bump(fight.styleD, 'losses');
    } else if (fight.winner === 'D') {
      bump(fight.styleD, 'wins');
      bump(fight.styleA, 'losses');
    }
    if (fight.by === 'Kill') {
      totalKills++;
      const killerStyle = fight.winner === 'A' ? fight.styleA : fight.styleD;
      const victimStyle = fight.winner === 'A' ? fight.styleD : fight.styleA;
      bump(killerStyle, 'kills');
      bump(victimStyle, 'deaths');
    }
    if ((fight as any).exchanges != null) fightLengths.push((fight as any).exchanges);
    if ((fight as any).durationExchanges != null) fightLengths.push((fight as any).durationExchanges);
  }

  // Trim heavy state
  if (state.arenaHistory.length > 200) state.arenaHistory = state.arenaHistory.slice(-200);
  if (state.matchHistory.length > 50) state.matchHistory = state.matchHistory.slice(-50);
  state.newsletter = [];
  state.gazettes = [];
  state.ledger = state.ledger.slice(-100);
  state.moodHistory = [];
  state.scoutReports = [];

  if (processedFightIds.size > 5000) {
    // Roll the set so memory doesn't grow forever
    processedFightIds = new Set([...processedFightIds].slice(-1000));
  }
}

const origLog = (process as any).stdout.write.bind(process.stdout);
const print = (s: string) => origLog(s + '\n');

print(`\n=== ${years}-YEAR COMBAT AUDIT ===`);
print(`Total bouts: ${totalBouts}`);
print(`Total kills: ${totalKills}  (kill rate: ${(100 * totalKills / totalBouts).toFixed(1)}%)`);
print(`Active warriors at end: ${state.rivals.flatMap(r => r.roster).length}`);
print(`Total in graveyard at end: ${state.graveyard.length}`);
print(`Total retired at end: ${state.retired.length}`);
if (fightLengths.length > 0) {
  fightLengths.sort((a, b) => a - b);
  const med = fightLengths[Math.floor(fightLengths.length / 2)];
  const avg = fightLengths.reduce((a,b)=>a+b,0)/fightLengths.length;
  print(`Fight length: median=${med}, avg=${avg.toFixed(1)}, p10=${fightLengths[Math.floor(fightLengths.length*0.1)]}, p90=${fightLengths[Math.floor(fightLengths.length*0.9)]}`);
}

print('\nStyle | Bouts | Wins | W% | Kills | Deaths | K/D');
const sortedStyles = Object.entries(styleStats).sort((a,b)=>b[1].bouts-a[1].bouts);
for (const [style, s] of sortedStyles) {
  const wpct = s.bouts > 0 ? (100 * s.wins / (s.wins + s.losses)).toFixed(1) : '-';
  const kd = s.deaths > 0 ? (s.kills / s.deaths).toFixed(2) : (s.kills > 0 ? '∞' : '0');
  print(`${style.padEnd(16)} | ${String(s.bouts).padStart(5)} | ${String(s.wins).padStart(4)} | ${wpct.padStart(5)} | ${String(s.kills).padStart(5)} | ${String(s.deaths).padStart(6)} | ${kd}`);
}
