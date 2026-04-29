import { GameState, RivalStableData } from '@/types/state.types';
import type { StableId, BoutOfferId } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { updateAIStrategy } from '@/engine/ai/intentEngine';
import { processAIStable } from '@/engine/ai/stableManager';
import { generateRivalStables } from '@/engine/rivals';
import { aiDraftFromPool } from '@/engine/draftService';
import { processAIRosterManagement } from '@/engine/ownerRoster';
import { TournamentSelectionService } from '@/engine/matchmaking/tournamentSelection';
import { processAllRivalsBoutOffers } from '@/engine/ai/workers/competitionWorker';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { StateImpact, mergeImpacts } from '@/engine/impacts';
import { hashStr } from '@/utils/random';
import { planWorldBouts } from '@/engine/matchmaking/worldMatchmaking';

/**
 * Stable Lords — Rival Strategy Pipeline Pass
 */
export function runRivalStrategyPass(
  state: GameState,
  nextWeek: number,
  rootRng?: IRNGService
): StateImpact {
  const rng = rootRng || new SeededRNGService(nextWeek * 7919 + 13);
  const impacts: StateImpact[] = [];
  const globalGazetteItems: string[] = [];

  // 1. Process Individual Rival Stables (Economy/Strategy)
  let currentRivals = (state.rivals || []).map((rival, index) => {
    const strategySeed = nextWeek * 31 + index * 997 + (rival.owner.id || '').length;
    const strategy = updateAIStrategy(rival, state, strategySeed);

    // 🎂 1.0 Hardening: Handle Aging & Succession
    const { updatedRival: rivalWithLifecycle, gazetteItems: lifecycleGazette } =
      handleOwnerLifecycle(
        { ...rival, strategy },
        state,
        nextWeek,
        new SeededRNGService(strategySeed + 123)
      );
    globalGazetteItems.push(...lifecycleGazette);

    const { updatedRival, isBankrupt, gazetteItems } = processAIStable(rivalWithLifecycle, state);
    globalGazetteItems.push(...gazetteItems);

    if (isBankrupt) {
      const retirementSeed = nextWeek + index * 1000;
      const generated = generateRivalStables(1, retirementSeed);
      const newStable = generated[0];
      if (newStable) {
        globalGazetteItems.push(
          `🆕 RECRUITMENT: ${newStable.owner.stableName} has debuted in the league under ${newStable.owner.name}!`
        );
        return newStable as RivalStableData;
      }
    }
    return updatedRival;
  });

  // 1.5. World Matchmaking: NPCs propose bouts to each other
  const worldBouts = planWorldBouts(state, rng);
  let boutOffersWithWorld: Record<BoutOfferId, (typeof state.boutOffers)[BoutOfferId]> = {
    ...(state.boutOffers || {}),
  };

  // 🧹 1.6 Hardening: Purge Expired Offers (Prevent state bloat)
  const activeOffers = Object.entries(boutOffersWithWorld).filter(([_, offer]) => {
    return !(offer && offer.expirationWeek < nextWeek);
  });
  boutOffersWithWorld = Object.fromEntries(activeOffers) as Record<
    BoutOfferId,
    (typeof boutOffersWithWorld)[BoutOfferId]
  >;

  if (worldBouts.length > 0) {
    worldBouts.forEach((o) => {
      boutOffersWithWorld[o.id] = o;
    });
  }
  impacts.push({ boutOffers: boutOffersWithWorld });

  // 2. Draft from Recruitment Pool
  const draft = aiDraftFromPool(state.recruitPool, currentRivals, nextWeek, state);
  globalGazetteItems.push(...draft.gazetteItems);
  currentRivals = draft.updatedRivals;
  impacts.push({ recruitPool: draft.updatedPool });

  // 3. AI Roster Management (Recruitment/Retirement)
  const rosterSeed = nextWeek * 13 + 7;
  const rosterRng = new SeededRNGService(rosterSeed);
  const { updatedRivals: finalizedRivals, gazetteItems: rosterGazette } = processAIRosterManagement(
    {
      ...state,
      week: nextWeek,
      rivals: currentRivals,
      recruitPool: draft.updatedPool,
      boutOffers: boutOffersWithWorld,
    },
    rosterRng
  );
  globalGazetteItems.push(...rosterGazette);

  // 4. Final Aggregation of Rival Updates
  const rivalsUpdates = new Map<StableId, Partial<RivalStableData>>();
  finalizedRivals.forEach((r) => {
    rivalsUpdates.set(r.id as StableId, r);
  });
  impacts.push({ rivalsUpdates });

  // 4.5. Contract Decision Phase: AI Stables accept/decline pending boutique offers
  const stateWithWorldBouts = { ...state, boutOffers: boutOffersWithWorld };
  const boutOffersImpact = processAllRivalsBoutOffers(stateWithWorldBouts, finalizedRivals);
  impacts.push(boutOffersImpact);

  // 5. Tournament Handling (Every 13 weeks)
  if (nextWeek > 0 && nextWeek % 13 === 0) {
    const tournamentImpact = handleSeasonalTournaments(state, nextWeek, rng);
    impacts.push(tournamentImpact);
  }

  if (globalGazetteItems.length > 0) {
    impacts.push({
      newsletterItems: [
        {
          id: rng.uuid(),
          week: nextWeek,
          title: 'Intelligence & Strategy Report',
          items: globalGazetteItems,
        },
      ],
    });
  }

  return mergeImpacts(impacts);
}

/**
 * 🎂 Owner Lifecycle: Handles annual aging and generational succession.
 */
function handleOwnerLifecycle(
  rival: RivalStableData,
  state: GameState,
  nextWeek: number,
  rng: SeededRNGService
): { updatedRival: RivalStableData; gazetteItems: string[] } {
  const updatedRival = { ...rival, owner: { ...rival.owner } };
  const gazetteItems: string[] = [];

  // 1. Annual Aging (Occurs on Week 1)
  if (nextWeek === 1) {
    updatedRival.owner.age = (updatedRival.owner.age || 40) + 1;
  }

  // 2. Succession Logic (Starts at age 65, becomes likely by 75)
  const age = updatedRival.owner.age || 40;
  const retirementChance = age < 65 ? 0 : age < 75 ? 0.05 : 0.2;

  if (rng.next() < retirementChance) {
    const generation = (updatedRival.owner.generation || 0) + 1;
    const oldName = updatedRival.owner.name;

    // 🏆 Successor Hunt: Look for a famous retired warrior from THIS stable
    const successorCandidate = (state.retired || []).find(
      (w) => w.stableId === updatedRival.id && (w.fame || 0) > 200
    );

    const newName = successorCandidate
      ? successorCandidate.name
      : `Lord ${updatedRival.owner.stableName.split(' ')[0]} ${'I'.repeat(generation + 1)}`;

    updatedRival.owner = {
      ...updatedRival.owner,
      name: newName,
      age: 25 + Math.floor(rng.next() * 15),
      generation,
      fame: Math.floor(updatedRival.owner.fame * 0.4), // Fame reset on new leadership
      backstoryId: undefined, // Fresh start
    };

    gazetteItems.push(
      `👑 SUCCESSION: ${oldName} has retired from ${updatedRival.owner.stableName}. ${newName} takes the mantle (Generation ${generation})!`
    );
  }

  return { updatedRival, gazetteItems };
}

function handleSeasonalTournaments(state: GameState, week: number, rng: IRNGService): StateImpact {
  const tournaments = TournamentSelectionService.generateSeasonalTiers(
    state,
    week,
    state.season,
    week * 881
  );
  const tournamentNews: string[] = [];

  // resolveCompleteTournament returns a fully-mutated GameState (not a delta), so we
  // run it against a working copy and then extract a clean delta as the impact.
  // Prior code pushed the whole returned GameState as an impact, which caused the
  // append-strategy fields (graveyard, arenaHistory, retired) to duplicate their
  // entire contents every tournament — graveyard exploded into the millions and
  // OOM'd long-running sims.
  const preGraveyardLen = (state.graveyard || []).length;
  const preRetiredLen = (state.retired || []).length;
  const preArenaLen = (state.arenaHistory || []).length;
  const preRosterIds = new Set((state.roster || []).map((w) => w.id));
  const preRivalRosters = new Map(
    (state.rivals || []).map((r) => [r.id, new Set(r.roster.map((w) => w.id))])
  );

  let workingState = { ...state, tournaments: [...(state.tournaments || []), ...tournaments] };
  tournaments.forEach((tour) => {
    workingState = TournamentSelectionService.resolveCompleteTournament(
      workingState,
      tour.id,
      week * 500 + hashStr(tour.id)
    );
    tournamentNews.push(`🏆 ${tour.name} finalized: Champion crowned.`);
  });

  const newGraveyard = (workingState.graveyard || []).slice(preGraveyardLen);
  const newRetired = (workingState.retired || []).slice(preRetiredLen);
  const newArena = (workingState.arenaHistory || []).slice(preArenaLen);

  const postRosterIds = new Set((workingState.roster || []).map((w) => w.id));
  const rosterRemovals = [...preRosterIds].filter((id) => !postRosterIds.has(id));

  // Build rivalsUpdates so the rival rosters reflect tournament casualties + status updates.
  const rivalsUpdates = new Map<StableId, Partial<RivalStableData>>();
  (workingState.rivals || []).forEach((r) => {
    const preIds = preRivalRosters.get(r.id);
    if (!preIds) return;
    const postIds = new Set(r.roster.map((w) => w.id));
    const removed = [...preIds].filter((id) => !postIds.has(id));
    const sizesDiffer = preIds.size !== postIds.size;
    if (removed.length > 0 || sizesDiffer) {
      rivalsUpdates.set(r.id as StableId, { roster: r.roster });
    }
  });

  return mergeImpacts([
    { tournaments: workingState.tournaments },
    {
      graveyard: newGraveyard,
      retired: newRetired,
      arenaHistory: newArena,
      rosterRemovals,
      rivalsUpdates,
      isTournamentWeek: true,
      activeTournamentId: tournaments[0]?.id,
      day: 0,
      newsletterItems: [
        {
          id: rng.uuid(),
          week: week,
          title: '🎖️ TOURNAMENT ARCHIVE',
          items: tournamentNews,
        },
      ],
    },
  ]);
}
