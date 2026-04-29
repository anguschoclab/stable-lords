
import { createFreshState } from './src/engine/factories/gameStateFactory';
import { advanceWeek } from './src/engine/pipeline/services/weekPipelineService';
import { FightingStyle } from './src/types/shared.types';

async function runKillerAudit(years = 10) {
    console.log(`🗡️ STARTING BLOOD & GLORY AUDIT (${years} YEARS)`);
    let state = createFreshState("killer-seed");
    
    // Convert player to AI
    const playerAsRival = {
        id: state.player.id,
        fame: 100,
        treasury: 1000,
        owner: { ...state.player, personality: 'Pragmatic', age: 40, generation: 0 },
        roster: [],
        ledger: []
    } as any;
    state.rivals.push(playerAsRival);
    state.roster = [];

    const stats = {
        killsByStyle: {} as Record<string, number>,
        tournamentWinsByStyle: {} as Record<string, number>,
        rosterSizes: [] as number[],
        totalBouts: 0
    };

    for (let y = 1; y <= years; y++) {
        for (let w = 1; w <= 52; w++) {
            state = advanceWeek(state);
            
            // Auto-assign training
            state.rivals.forEach(r => {
                r.roster.forEach(warrior => {
                    if (!warrior.plan) warrior.plan = { type: 'Balanced' };
                });
            });

            // Track EVERYTHING in history that hasn't been counted yet
            const history = state.arenaHistory || [];
            history.forEach(f => {
                if ((f as any).counted) return;
                
                stats.totalBouts++;
                if (f.by === 'Kill') {
                    const killerStyle = f.winner === 'A' ? f.styleA : f.styleD;
                    stats.killsByStyle[killerStyle] = (stats.killsByStyle[killerStyle] || 0) + 1;
                }
                
                // If it's a tournament bout, track the winner's style
                if (f.isTournament) {
                    const winnerStyle = f.winner === 'A' ? f.styleA : f.styleD;
                    stats.tournamentWinsByStyle[winnerStyle] = (stats.tournamentWinsByStyle[winnerStyle] || 0) + 1;
                }

                (f as any).counted = true;
            });

            // Track Tournament Winners
            if (state.tournaments) {
                state.tournaments.forEach(t => {
                    if (t.completed && !t.audited) {
                        // Find the champion's style
                        const allWarriors = [...state.rivals.flatMap(r => r.roster), ...state.retired, ...state.graveyard];
                        const champ = allWarriors.find(war => war.name === t.champion);
                        if (champ) {
                            stats.tournamentWinsByStyle[champ.style] = (stats.tournamentWinsByStyle[champ.style] || 0) + 1;
                        }
                        (t as any).audited = true;
                    }
                });
            }
        }

        const avgRoster = state.rivals.flatMap(r => r.roster).length / state.rivals.length;
        stats.rosterSizes.push(avgRoster);
        
        console.log(`\n📅 YEAR ${y} REPORT`);
        console.log(`-------------------`);
        console.log(`Avg Roster: ${avgRoster.toFixed(1)}`);
        console.log(`Total Bouts: ${stats.totalBouts}`);
        console.log(`Kills so far:`, stats.killsByStyle);
        console.log(`Tournament Champs so far:`, stats.tournamentWinsByStyle);
    }

    console.log("\n🏆 FINAL AUDIT RESULTS");
    console.log("======================");
    console.log("Top Lethality Classes:", Object.entries(stats.killsByStyle).sort((a,b) => b[1] - a[1]));
    console.log("Top Tournament Classes:", Object.entries(stats.tournamentWinsByStyle).sort((a,b) => b[1] - a[1]));
    console.log("Avg Roster Size (Longitudinal):", (stats.rosterSizes.reduce((a,b) => a+b, 0) / years).toFixed(2));
}

runKillerAudit(10);
