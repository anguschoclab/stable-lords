
import { createFreshState } from './src/engine/factories/gameStateFactory';
import { advanceWeek } from './src/engine/pipeline/services/weekPipelineService';
import { computeMetaDrift } from './src/engine/metaDrift';
import { FightingStyle } from './src/types/shared.types';

async function runMetaAudit(years = 10) {
    console.log(`📊 STARTING META AUDIT (${years} YEARS)`);
    let state = createFreshState("audit-seed");
    
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
        metaHistory: [] as any[],
        rosterHistory: [] as number[],
        classBalance: {} as Record<string, number[]>
    };

    for (let y = 1; y <= years; y++) {
        for (let w = 1; w <= 52; w++) {
            state = advanceWeek(state);
            
            // Auto-assign training to keep them progressing
            state.rivals.forEach(r => {
                r.roster.forEach(w => {
                    if (!w.plan) w.plan = { type: 'Balanced' };
                });
            });
        }

        // Yearly Snapshot
        const meta = computeMetaDrift(state.arenaHistory, 100);
        const allWarriors = state.rivals.flatMap(r => r.roster);
        const avgRoster = allWarriors.length / state.rivals.length;
        
        console.log(`\n📅 YEAR ${y} SUMMARY`);
        console.log(`-------------------`);
        console.log(`Avg Roster Size: ${avgRoster.toFixed(1)}`);
        
        const currentBalance: Record<string, number> = {};
        Object.values(FightingStyle).forEach(s => {
            const count = allWarriors.filter(w => w.style === s).length;
            currentBalance[s] = count;
            if (!stats.classBalance[s]) stats.classBalance[s] = [];
            stats.classBalance[s].push(count);
        });

        console.log(`Class Balance:`, currentBalance);
        console.log(`Meta Drift:`, meta);
        
        stats.rosterHistory.push(avgRoster);
    }

    console.log("\n✅ AUDIT COMPLETE");
}

runMetaAudit(10);
