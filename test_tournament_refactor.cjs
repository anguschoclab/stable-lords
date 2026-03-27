const fs = require('fs');

const content = fs.readFileSync('src/pages/Tournaments.tsx', 'utf8');
if (content.includes('runNextRound = useCallback(() => {') && content.includes('processTournamentRound(state, currentTournament.id)')) {
  console.log('Tournaments.tsx refactored successfully.');
} else {
  console.log('Refactoring missing in Tournaments.tsx');
}

const proc = fs.readFileSync('src/engine/core/tournamentProcessor.ts', 'utf8');
if (proc.includes('export function processTournamentRound')) {
  console.log('tournamentProcessor.ts exists and exports the function.');
} else {
  console.log('tournamentProcessor.ts missing function.');
}
