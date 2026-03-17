import fs from "fs";
import { createFreshState, makeWarrior, advanceWeek } from "@/state/gameStore";
import { runAutosim, type WeekSummary, type AutosimResult } from "@/engine/autosim";
import { generateBalanceReport } from "@/engine/balanceReport";
import { generateRivalStables } from "@/engine/rivals";
import { generateRecruitPool } from "@/engine/recruitment";
import { processWeekBouts } from "@/engine/boutProcessor";
import { FightingStyle } from "@/types/game";

async function main() {
  console.log("Initializing fresh game state...");
  const initialState = createFreshState();
  const maxWeeks = 100;

  // Disable tournaments and scouting temporarily so simulation doesn't stop
  // on 'tournament_week' early
  initialState.settings.featureFlags.tournaments = false;
  initialState.settings.featureFlags.scouting = false;

  // We need to initialize some AI rivals and recruit pool so there are pairings.
  // Using recruitment logic from the engine to populate the world.
  // Rivals logic returns `RivalStable` format, we need to map to `RivalStableData` for GameState
  const rivalStables = generateRivalStables(5, Date.now());
  initialState.rivals = rivalStables.map(rs => ({
    owner: {
      id: rs.id,
      name: rs.ownerName,
      stableName: rs.name,
      fame: rs.fame,
      renown: rs.fame, // stub
      titles: rs.titles,
      personality: rs.personality,
      metaAdaptation: rs.metaAdaptation,
      favoredStyles: rs.favoredStyles
    },
    roster: rs.roster,
    motto: rs.motto,
    origin: rs.origin,
    philosophy: rs.philosophy,
    tier: rs.tier
  }));
  initialState.recruitPool = generateRecruitPool(20, initialState.week, new Set());

  // We should also populate the player roster with some warriors so they can fight.
  for(let i=0; i<3; i++) {
    initialState.roster.push(makeWarrior(
      `player_w_${i}`,
      `Player Warrior ${i}`,
      Object.values(FightingStyle)[Math.floor(Math.random() * Object.values(FightingStyle).length)],
      { ST: 12, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 12 }
    ));
  }

  console.log(`Running headless simulation for up to ${maxWeeks} weeks...`);

  // Instead of using `runAutosim` which intentionally stops on any player injury or death
  // for UI purposes, we will bypass the stop conditions and just loop `advanceWeek`
  // and `processWeekBouts` to gather aggregate stats over the full 100 weeks.
  let currentState = initialState;
  const weekSummaries: WeekSummary[] = [];

  for (let i = 0; i < maxWeeks; i++) {
    const processed = processWeekBouts(currentState);
    currentState = advanceWeek(processed.state);

    const weekSummary: WeekSummary = {
      week: processed.state.week,
      bouts: processed.summary.bouts,
      deaths: processed.summary.deaths,
      injuries: processed.summary.injuries,
      deathNames: processed.summary.deathNames,
      injuryNames: processed.summary.injuryNames,
    };
    weekSummaries.push(weekSummary);

    if ((i + 1) % 10 === 0) {
      console.log(`[Week ${i + 1}/${maxWeeks}] ${weekSummary.bouts} bouts | ${weekSummary.deaths} deaths | ${weekSummary.injuries} injuries`);
    }
  }

  const result: AutosimResult = {
    finalState: currentState,
    weeksSimmed: maxWeeks,
    stopReason: "max_weeks",
    stopDetail: `Completed ${maxWeeks} weeks.`,
    weekSummaries,
  };

  console.log("\nSimulation stopped:");
  console.log(`- Reason: ${result.stopReason}`);
  console.log(`- Detail: ${result.stopDetail}`);
  console.log(`- Final Week: ${result.weeksSimmed}`);

  console.log("\nGenerating Balance Report...");
  const reportContent = generateBalanceReport(result);

  fs.writeFileSync("Daily_Balance_Report.md", reportContent);
  console.log("\nSuccessfully wrote to Daily_Balance_Report.md");
}

main().catch(err => {
  console.error("Error running balance report:", err);
  process.exit(1);
});
