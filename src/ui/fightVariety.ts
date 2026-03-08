/**
 * Generates flavorful recap lines for fight outcomes.
 */
export function recapLine(
  winner: string,
  loser: string,
  minutes: number
): string {
  const choices = [
    `${winner} dismantled ${loser} in a brisk ${minutes}-minute clash.`,
    `${loser} could not weather ${winner}'s onslaught—done in ${minutes}.`,
    `${winner} outfoxed ${loser} and sealed it in ${minutes}.`,
    `${winner} turned the tide and toppled ${loser} after ${minutes} minutes.`,
    `${winner} took center stage, leaving ${loser} reeling in ${minutes}.`,
  ];
  return choices[Math.floor(Math.random() * choices.length)];
}
