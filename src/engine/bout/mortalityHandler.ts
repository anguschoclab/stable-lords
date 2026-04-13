import type { GameState, RivalStableData, NewsletterItem } from "@/types/state.types";
import type { Warrior } from "@/types/warrior.types";
import type { FightOutcome, FightSummary } from "@/types/combat.types";
import { generateId } from "@/utils/idUtils";
import { generateFightNarrative } from "@/engine/gazetteNarrative";
import { engineEventBus } from "@/engine/core/EventBus";
import type { IRNGService } from "@/engine/core/rng/IRNGService";
import { StateImpact } from "@/engine/impacts";

export function handleDeath(
  s: GameState, 
  wA: Warrior, 
  wD: Warrior, 
  outcome: FightOutcome, 
  week: number, 
  tags: string[], 
  rivalStableId?: string,
  rng?: IRNGService
) {
  if (outcome.by !== "Kill") return { impact: {}, death: false, playerDeath: false, deathNames: [] };
  
  const victim = outcome.winner === "A" ? wD : wA;
  const isPlayerVictim = (outcome.winner === "A" && !!rivalStableId) ? false : (outcome.winner !== "A");
  
  const boutId = rng.uuid();
  const narrative = generateFightNarrative({ 
    id: boutId, week, a: wA.name, d: wD.name, 
    warriorIdA: wA.id, warriorIdD: wD.id,
    winner: outcome.winner, by: outcome.by, 
    styleA: wA.style, styleD: wD.style, transcript: [], title: `${wA.name} vs ${wD.name}`, phase: "resolution",
    createdAt: "2026-01-01T00:00:00Z"
  } as FightSummary, s.crowdMood);
  
  const event = { boutId, killerId: outcome.winner === "A" ? wA.id : wD.id, deathSummary: narrative, memorialTags: tags };

  // Pure State Transformation for Death
  const graveyardEntry: Warrior = {
    ...victim,
    status: "Dead",
    deathWeek: week,
    isDead: true,
    killedBy: outcome.winner === "A" ? wA.name : wD.name,
    causeOfDeath: "Arena Combat",
    dateOfDeath: `Week ${week}, Season ${s.season}`,
    deathEvent: event
  };

  const rosterUpdates = new Map<string, Partial<Warrior>>();
  const rivalsUpdates = new Map<string, Partial<RivalStableData>>();
  const newsletterItems: NewsletterItem[] = [];
  
  // Remove victim from roster
  if (s.roster.some(w => w.id === victim.id)) {
    rosterUpdates.set(victim.id, { status: "Dead" });
  }
  
  if (isPlayerVictim) {
    newsletterItems.push({ id: rng!.uuid(), week, title: "Fame Gained", items: ["Your stable gained 5 fame from this death."] });
  }
  
  const deathSummary: FightSummary = { 
    id: boutId, week, winner: outcome.winner, by: outcome.by, a: wA.name, d: wD.name, 
    warriorIdA: wA.id, warriorIdD: wD.id,
    styleA: wA.style, styleD: wD.style, isDeathEvent: true, deathEventData: event, createdAt: "2026-01-01T00:00:00Z",
    title: `DEATH: ${victim.name} in the Arena`, phase: "resolution"
  };
  
  newsletterItems.push({ id: rng!.uuid(), week, title: "Arena Obituary", items: [narrative] });
  
  // Decoupled notification
  engineEventBus.emit({ 
    type: 'WARRIOR_DEATH', 
    payload: { warriorId: victim.id, name: victim.name } 
  });

  if (rivalStableId && outcome.winner === "A") { // Player killed a rival
    const rival = (s.rivals || []).find((r: RivalStableData) => r.owner.id === rivalStableId);
    if (rival) {
      const updatedRoster = rival.roster.filter((w: Warrior) => w.id !== wD.id);
      rivalsUpdates.set(rivalStableId, { roster: updatedRoster });
    }
  }

  const impact: StateImpact = {
    graveyard: [graveyardEntry],
    unacknowledgedDeaths: [victim.id],
    rosterUpdates,
    rivalsUpdates,
    newsletterItems,
    fameDelta: isPlayerVictim ? 5 : 0
  };

  return { impact, death: true, playerDeath: isPlayerVictim, deathNames: [victim.name] };
}
