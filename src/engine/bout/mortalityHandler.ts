import { GameState, Warrior, FightOutcome, FightSummary } from "@/types/game";
import { generateId } from "@/utils/idUtils";
import { generateFightNarrative } from "@/engine/gazetteNarrative";
import { killWarrior } from "@/state/gameStore";
import { engineEventBus } from "@/engine/core/EventBus";

export function handleDeath(s: GameState, wA: Warrior, wD: Warrior, outcome: FightOutcome, week: number, tags: string[], rivalStableId?: string) {
  if (outcome.by !== "Kill") return { s, death: false, playerDeath: false, deathNames: [] };
  
  const victim = outcome.winner === "A" ? wD : wA;
  const isPlayerVictim = (outcome.winner === "A" && !!rivalStableId) ? false : (outcome.winner !== "A");
  // Refined isPlayerVictim logic: if winner is A and there is a rivalStableId, then player killed rival. 
  // If winner is D, then player lost (assuming player is always A in this context, which is how resolveBout is called).
  
  const boutId = generateId();
  const narrative = generateFightNarrative({ 
    id: boutId, week, a: wA.name, d: wD.name, winner: outcome.winner, by: outcome.by, 
    styleA: wA.style, styleD: wD.style, transcript: [], title: `${wA.name} vs ${wD.name}`, phase: "resolution" 
  } as any, s.crowdMood);
  
  const event = { boutId, killerId: outcome.winner === "A" ? wA.id : wD.id, deathSummary: narrative, memorialTags: tags };

  const nextS = killWarrior(s, victim.id, outcome.winner === "A" ? wA.name : wD.name, "Arena Combat", event);
  
  if (isPlayerVictim) {
    nextS.fame = Math.max(0, (nextS.fame || 0) + 5);
    if (nextS.player) nextS.player.fame = Math.max(0, (nextS.player.fame || 0) + 5);
  }
  
  const deathSummary: FightSummary = { 
    id: boutId, week, winner: outcome.winner, by: outcome.by, a: wA.name, d: wD.name, 
    styleA: wA.style, styleD: wD.style, isDeathEvent: true, deathEventData: event, createdAt: new Date().toISOString() 
  } as any;
  
  nextS.arenaHistory = [...nextS.arenaHistory, deathSummary];
  nextS.newsletter = [...(nextS.newsletter || []), { week, title: "Arena Obituary", items: [narrative] }];
  
  // Decoupled notification
  engineEventBus.emit({ 
    type: 'WARRIOR_KILLED', 
    payload: { warriorId: victim.id, killerName: outcome.winner === "A" ? wA.name : wD.name, narrative } 
  });

  if (rivalStableId && outcome.winner === "A") { // Player killed a rival
    nextS.rivals = (nextS.rivals || []).map(r => r.owner.id === rivalStableId 
      ? { ...r, roster: r.roster.filter(w => w.id !== wD.id) }
      : r);
  }

  return { s: nextS, death: true, playerDeath: isPlayerVictim, deathNames: [victim.name] };
}
