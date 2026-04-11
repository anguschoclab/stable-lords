import type { GameState, RivalStableData } from "@/types/state.types";
import type { Warrior } from "@/types/warrior.types";
import type { FightOutcome, FightSummary } from "@/types/combat.types";
import { generateId } from "@/utils/idUtils";
import { generateFightNarrative } from "@/engine/gazetteNarrative";
import { engineEventBus } from "@/engine/core/EventBus";
import type { IRNGService } from "@/engine/core/rng/IRNGService";

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
  if (outcome.by !== "Kill") return { s, death: false, playerDeath: false, deathNames: [] };
  
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

  const nextS: GameState = {
    ...s,
    roster: s.roster.filter(w => w.id !== victim.id),
    graveyard: [...(s.graveyard || []), graveyardEntry],
    unacknowledgedDeaths: [...(s.unacknowledgedDeaths || []), victim.id]
  };
  
  if (isPlayerVictim) {
    nextS.fame = Math.max(0, (nextS.fame || 0) + 5);
    if (nextS.player) nextS.player.fame = Math.max(0, (nextS.player.fame || 0) + 5);
  }
  
  const deathSummary: FightSummary = { 
    id: boutId, week, winner: outcome.winner, by: outcome.by, a: wA.name, d: wD.name, 
    warriorIdA: wA.id, warriorIdD: wD.id,
    styleA: wA.style, styleD: wD.style, isDeathEvent: true, deathEventData: event, createdAt: "2026-01-01T00:00:00Z",
    title: `DEATH: ${victim.name} in the Arena`, phase: "resolution"
  };
  
  nextS.newsletter = [...(nextS.newsletter || []), { id: rng!.uuid(), week, title: "Arena Obituary", items: [narrative] }];
  
  // Decoupled notification
  engineEventBus.emit({ 
    type: 'WARRIOR_DEATH', 
    payload: { warriorId: victim.id, name: victim.name } 
  });

  if (rivalStableId && outcome.winner === "A") { // Player killed a rival
    nextS.rivals = (nextS.rivals || []).map((r: RivalStableData) => r.owner.id === rivalStableId 
      ? { ...r, roster: r.roster.filter((w: Warrior) => w.id !== wD.id) }
      : r);
  }

  return { s: nextS, death: true, playerDeath: isPlayerVictim, deathNames: [victim.name] };
}
