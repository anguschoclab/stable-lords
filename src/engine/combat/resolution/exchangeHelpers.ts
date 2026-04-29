import {
  FightingStyle,
  type Attributes,
  type BaseSkills,
  type DerivedStats,
  type OffensiveTactic,
  type DefensiveTactic,
} from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { CombatEvent } from '@/types/combat.types';
import type { Trainer } from '@/types/state.types';
import { skillCheck } from '../mechanics/combatMath';
import {
  computeHitDamage,
  rollHitLocation,
  applyProtectMod,
  calculateKillWindow,
  applyArmorTypeMod,
  applyShieldZoneMod,
} from '../mechanics/combatDamage';
import { SHIELD_COVERAGE } from '@/data/equipment';
import { enduranceCost } from '../mechanics/combatFatigue';
import { getDynamicTraitMods } from '../../traits';
import { PSYCH_STATE_MODS } from '../mechanics/conditionEngine';
import {
  getStylePassive,
  getKillMechanic,
  getStyleAntiSynergy,
  getEnduranceMult,
  Phase as StylePhase,
} from '../../stylePassives';
import {
  GLOBAL_ATT_BONUS,
  GLOBAL_PAR_PENALTY,
  INITIATIVE_PRESS_BONUS,
  DEFENDER_ENDURANCE_DISCOUNT,
  CRIT_DAMAGE_MULT,
} from '../mechanics/combatConstants';
import {
  oeAttMod,
  oeDefMod,
  getOffensiveTacticMods,
  getDefensiveTacticMods,
} from '../mechanics/tacticResolution';
import { type FighterState, type ResolutionContext, resolveEffectiveTactics } from './resolution';

export function performAttackCheck(
  rng: () => number,
  att: FighterState,
  curAttOE: number,
  matchup: number,
  fat: number,
  curOffMods: ReturnType<typeof getOffensiveTacticMods>,
  curPass: ReturnType<typeof getStylePassive>,
  curAntiSyn: ReturnType<typeof getStyleAntiSynergy>,
  curBiasAtt: number,
  overAtt: number,
  curAttWepReq: { attPenalty: number },
  extraBonus: number = 0 // psych + momentum bonus passed from resolveExchange
) {
  // Commit mode: attacker throws caution aside — +10 ATT bonus but defender gets compensating bonus in defense
  const commitBonus = att.committed ? 10 : 0;
  return skillCheck(
    rng,
    att.skills.ATT,
    oeAttMod(curAttOE, att.style) +
      matchup +
      fat +
      curOffMods.attBonus +
      curPass.attBonus +
      Math.round((curAntiSyn.offMult - 1) * 5) +
      INITIATIVE_PRESS_BONUS +
      GLOBAL_ATT_BONUS +
      curBiasAtt -
      overAtt -
      att.armHits +
      curAttWepReq.attPenalty +
      extraBonus +
      commitBonus
  );
}

export function performRiposteCheck(
  rng: () => number,
  def: FighterState,
  matchup: number,
  fat: number,
  penaltyOrBonus: number,
  curPass: ReturnType<typeof getStylePassive>,
  curAntiSynDef?: ReturnType<typeof getStyleAntiSynergy>
) {
  const antiSyn = curAntiSynDef ? Math.round((curAntiSynDef.defMult - 1) * 3) : 0;
  return skillCheck(
    rng,
    def.skills.RIP,
    matchup + fat + penaltyOrBonus + curPass.ripBonus + antiSyn
  );
}

export function performDefenseCheck(
  rng: () => number,
  def: FighterState,
  curDefOE: number,
  matchup: number,
  fat: number,
  curDefMods: ReturnType<typeof getDefensiveTacticMods>,
  curPassD: ReturnType<typeof getStylePassive>,
  curBiasDef: number,
  overDef: number,
  isDodge: boolean,
  curAntiSynDef: ReturnType<typeof getStyleAntiSynergy>,
  curOffMods: ReturnType<typeof getOffensiveTacticMods>,
  ctx?: { weatherEffect?: { riposteMod: number } },
  attacker?: FighterState,
  extraDefPenalty: number = 0
) {
  // Committed attacker is fully open — defender gets +15 on defense
  const commitPenalty = attacker?.committed ? 15 : 0;
  if (isDodge) {
    const success = skillCheck(
      rng,
      def.skills.DEF,
      oeDefMod(curDefOE) +
        matchup +
        fat +
        curDefMods.defBonus +
        curPassD.defBonus +
        curBiasDef -
        overDef -
        def.legHits +
        commitPenalty -
        extraDefPenalty
    );
    return { success, type: 'DODGE' as const };
  } else {
    const riposteMod = ctx?.weatherEffect?.riposteMod ?? 0;
    const success = skillCheck(
      rng,
      def.skills.PAR,
      oeDefMod(curDefOE) +
        matchup +
        fat +
        curDefMods.parBonus +
        curPassD.parBonus +
        Math.round((curAntiSynDef.defMult - 1) * 3) -
        curOffMods.defPenalty -
        curOffMods.parryBypass +
        GLOBAL_PAR_PENALTY +
        curBiasDef -
        overDef -
        def.armHits +
        commitPenalty +
        riposteMod -
        extraDefPenalty
    );
    return { success, type: 'PARRY' as const };
  }
}

export function executeRiposte(
  events: CombatEvent[],
  rng: () => number,
  attacker: FighterState,
  defender: FighterState,
  defTactics: ReturnType<typeof resolveEffectiveTactics>,
  defPassive: ReturnType<typeof getStylePassive>,
  attLabel: 'A' | 'D',
  defLabel: 'A' | 'D',
  specialtyRiposteMult: number = 1.0
) {
  const ripLoc = rollHitLocation(rng, defTactics.target, attacker.activePlan.protect);
  let ripDmgRaw = computeHitDamage(rng, defender.derived.damage + defPassive.dmgBonus, ripLoc);
  ripDmgRaw = applyArmorTypeMod(ripDmgRaw, defender.weaponId, attacker.armorId);
  ripDmgRaw = Math.round(ripDmgRaw * specialtyRiposteMult);
  const ripDmg = applyProtectMod(ripDmgRaw, ripLoc, attacker.activePlan.protect);

  events.push({ type: 'DEFENSE', actor: defLabel, result: 'RIPOSTE' });
  events.push({ type: 'HIT', actor: defLabel, target: attLabel, location: ripLoc, value: ripDmg });

  attacker.hp -= ripDmg;
  attacker.hitsTaken++;
  defender.hitsLanded++;
  defender.ripostes++;
  defender.consecutiveHits++;
  attacker.consecutiveHits = 0;

  // Riposte swings momentum decisively
  const prevDefMom = defender.momentum;
  const prevAttMom = attacker.momentum;
  defender.momentum = Math.min(3, defender.momentum + 1);
  attacker.momentum = Math.max(-3, attacker.momentum - 1);
  if (defender.momentum !== prevDefMom || attacker.momentum !== prevAttMom) {
    events.push({
      type: 'MOMENTUM_SHIFT',
      actor: defLabel,
      target: attLabel,
      value: defender.momentum,
      metadata: { prev: prevDefMom, oppPrev: prevAttMom, oppNew: attacker.momentum },
    });
  }
}

export function executeHit(
  events: CombatEvent[],
  rng: () => number,
  attacker: FighterState,
  defender: FighterState,
  attTactics: ReturnType<typeof resolveEffectiveTactics>,
  attOffMods: ReturnType<typeof getOffensiveTacticMods>,
  attPassive: ReturnType<typeof getStylePassive>,
  attLabel: 'A' | 'D',
  defLabel: 'A' | 'D',
  stylePhase: StylePhase,
  phase: string,
  attKD: number,
  attOE: number,
  attAL: number,
  attMatchup: number,
  ctx?: ResolutionContext
) {
  // ── Survival Strike: defender has earned a free counter — skip this attack ──
  if (defender.survivalStrike) {
    defender.survivalStrike = false;
    // Defender fires back as a free riposte — re-use executeRiposte logic inline
    const freeRipLoc = rollHitLocation(rng, attTactics.target, attacker.activePlan.protect);
    let freeRipDmg = computeHitDamage(
      rng,
      defender.derived.damage + attPassive.dmgBonus,
      freeRipLoc
    );
    freeRipDmg = applyArmorTypeMod(freeRipDmg, defender.weaponId, attacker.armorId);
    freeRipDmg = applyProtectMod(freeRipDmg, freeRipLoc, attacker.activePlan.protect);
    events.push({ type: 'DEFENSE', actor: defLabel, result: 'RIPOSTE' });
    events.push({
      type: 'HIT',
      actor: defLabel,
      target: attLabel,
      location: freeRipLoc,
      value: freeRipDmg,
    });
    attacker.hp -= freeRipDmg;
    attacker.hitsTaken++;
    defender.hitsLanded++;
    if (attacker.hp <= 0) {
      events.push({
        type: 'BOUT_END',
        actor: defLabel,
        result: 'KO',
        metadata: { location: freeRipLoc, cause: 'SURVIVAL_STRIKE' },
      });
    }
    return;
  }

  // ── Commit mechanic: attacker at low HP with high kill desire commits ──
  const kdForCommit = attacker.activePlan.killDesire ?? attKD;
  const isAtLowHp = attacker.hp / attacker.maxHp < 0.35;
  if (!attacker.committed && isAtLowHp && kdForCommit >= 7) {
    attacker.committed = true;
    events.push({ type: 'STATE_CHANGE', actor: attLabel, result: 'COMMIT' });
  }

  const hitLoc = rollHitLocation(rng, attTactics.target, defender.activePlan.protect);
  let rawDamage = computeHitDamage(
    rng,
    attacker.derived.damage + attOffMods.dmgBonus + attPassive.dmgBonus,
    hitLoc
  );
  rawDamage = applyArmorTypeMod(rawDamage, attacker.weaponId, defender.armorId);

  // Apply weather damage multiplier
  const weatherDamageMult = ctx?.weatherEffect?.damageMult ?? 1.0;
  rawDamage = Math.round(rawDamage * weatherDamageMult);

  // Commit: +20% damage
  if (attacker.committed) {
    rawDamage = Math.round(rawDamage * 1.2);
  }

  // Apply specialty damage received reduction on the defender
  const defSpecDamageMult = ctx
    ? defender.label === 'A'
      ? (ctx.trainerModsA.damageReceivedMult ?? 1.0)
      : (ctx.trainerModsD.damageReceivedMult ?? 1.0)
    : 1.0;
  rawDamage = Math.round(rawDamage * defSpecDamageMult);

  if (attPassive.critChance > 0 && rng() < attPassive.critChance) {
    rawDamage = Math.round(rawDamage * CRIT_DAMAGE_MULT);
    events.push({
      type: 'HIT',
      actor: attLabel,
      target: defLabel,
      location: hitLoc,
      value: rawDamage,
      metadata: { crit: true },
    });
  } else {
    events.push({
      type: 'HIT',
      actor: attLabel,
      target: defLabel,
      location: hitLoc,
      value: rawDamage,
    });
  }

  // Shield-zone mitigation: a defender whose shield covers this location eats a flat
  // damage reduction on top of armor/protect. Coverage lookup tolerates weapon-slot
  // shields (Total-Parry carries a shield as the weapon) and offhand shield ids.
  const defShieldCov =
    SHIELD_COVERAGE[defender.shieldId ?? ''] ?? SHIELD_COVERAGE[defender.weaponId ?? ''];
  const postShieldDamage = applyShieldZoneMod(rawDamage, hitLoc, defShieldCov);
  const damage = applyProtectMod(postShieldDamage, hitLoc, defender.activePlan.protect);
  defender.hp -= damage;
  defender.hitsTaken++;
  attacker.hitsLanded++;
  attacker.consecutiveHits++;
  defender.consecutiveHits = 0;
  if (hitLoc.includes('arm')) defender.armHits++;
  if (hitLoc.includes('leg')) defender.legHits++;

  // ── Momentum: hit shifts momentum toward attacker ──
  const prevAttMom = attacker.momentum;
  const prevDefMom = defender.momentum;
  attacker.momentum = Math.min(3, attacker.momentum + 1);
  defender.momentum = Math.max(-3, defender.momentum - 1);
  if (attacker.momentum !== prevAttMom || defender.momentum !== prevDefMom) {
    events.push({
      type: 'MOMENTUM_SHIFT',
      actor: attLabel,
      target: defLabel,
      value: attacker.momentum,
      metadata: { prev: prevAttMom, oppPrev: prevDefMom, oppNew: defender.momentum },
    });
  }

  // ── Survival Strike: committed attacker who doesn't kill enables defender counter ──
  if (attacker.committed && defender.hp > 0) {
    defender.survivalStrike = true;
    events.push({ type: 'STATE_CHANGE', actor: defLabel, result: 'SURVIVAL_STRIKE' });
  }

  if (damage > 0 && rng() < 0.2) {
    const attrs = ['ST', 'SP', 'DF', 'WL'];
    events.push({
      type: 'INSIGHT',
      actor: attLabel,
      metadata: { attribute: attrs[Math.floor(rng() * attrs.length)] },
    });
  }

  const killMech = getKillMechanic(attacker.style, {
    phase: stylePhase,
    hitsLanded: attacker.hitsLanded,
    consecutiveHits: attacker.consecutiveHits,
    targetedLocation: attTactics.target,
    hitLocation: hitLoc,
  });

  let didKill = false;
  // Default bucket for a Kill outcome is EXECUTION (kill-window success).
  // Sub-causes refine it: CRITICAL_CHAIN, ARMOR_FAILURE override when their conditions
  // hold at the moment of the fatal blow. FATIGUE_COLLAPSE and RIVALRY_FINISH are
  // assigned later (applyEnduranceCosts / mortalityHandler respectively).
  let causeBucket: string = 'EXECUTION';

  if (defender.hp <= defender.maxHp * killMech.killWindowHpMult) {
    const killPos = phase === 'LATE' ? 2 : phase === 'MID' ? 1 : 0;
    const effectiveDec = attacker.skills.DEC + killMech.decBonus;
    const specKillBonus = ctx
      ? attacker.label === 'A'
        ? (ctx.trainerModsA.killWindowBonus ?? 0)
        : (ctx.trainerModsD.killWindowBonus ?? 0)
      : 0;
    // Trait killWindowBonus (e.g. Bloodthirsty +0.005) — folded onto specBonus.
    const attackerTraitKill = attacker.traits
      ? getDynamicTraitMods({ traits: attacker.traits } as unknown as Warrior, {
          phase: phase as 'OPENING' | 'MID' | 'LATE',
          hpRatio: attacker.hp / attacker.maxHp,
          endRatio: attacker.endurance / attacker.maxEndurance,
          consecutiveHits: attacker.consecutiveHits,
        }).killWindowBonus
      : 0;
    const crowdKillBonus = ctx?.crowdKillBonus ?? 0;
    const killThreshold = calculateKillWindow(
      defender.hp / defender.maxHp,
      defender.endurance / defender.maxEndurance,
      hitLoc,
      attKD + killMech.killBonus,
      killPos,
      attOE,
      attAL,
      attMatchup,
      effectiveDec,
      attacker.momentum,
      specKillBonus + attackerTraitKill,
      crowdKillBonus
    );
    if (rng() < killThreshold) {
      defender.hp = 0;
      didKill = true;
      // Refine bucket by context. Precedence: CRITICAL_CHAIN > ARMOR_FAILURE > EXECUTION.
      if (attacker.consecutiveHits >= 3) {
        causeBucket = 'CRITICAL_CHAIN';
      } else {
        const wasCovered = !!defender.activePlan.protect && defender.activePlan.protect !== 'Any';
        if (wasCovered && rawDamage >= 20) causeBucket = 'ARMOR_FAILURE';
      }
    }
  }

  if (defender.hp <= 0) {
    if (didKill) {
      events.push({
        type: 'BOUT_END',
        actor: attLabel,
        result: 'Kill',
        metadata: { location: hitLoc, cause: causeBucket },
      });
    } else {
      events.push({
        type: 'BOUT_END',
        actor: attLabel,
        result: 'KO',
        metadata: { location: hitLoc, cause: 'FATAL_DAMAGE' },
      });
    }
  }
}

export function applyEnduranceCosts(
  events: CombatEvent[],
  ctx: ResolutionContext,
  fA: FighterState,
  fD: FighterState,
  aGoesFirst: boolean,
  curAttOE: number,
  curAttAL: number,
  curAttWepReq: { endurancePenalty: number },
  curDefWepReq: { endurancePenalty: number },
  OE_D: number,
  AL_D: number,
  OE_A: number,
  AL_A: number
) {
  const att = aGoesFirst ? fA : fD;
  const def = aGoesFirst ? fD : fA;

  const arenaEndMult = ctx.surfaceMod?.enduranceMult ?? 1;
  // Psych-state endurance mult (Cruising 0.9, FatiguePanic 1.1) was previously
  // declared in PSYCH_STATE_MODS but never read here — wired in 2026-04 so the
  // modifiers actually do something.
  const psychEndMultA = PSYCH_STATE_MODS[fA.psychState]?.enduranceCostMult ?? 1;
  const psychEndMultD = PSYCH_STATE_MODS[fD.psychState]?.enduranceCostMult ?? 1;
  // Static trait endurance mult (Iron Lung 0.92) baked into traitEnduranceMult on FighterState.
  const traitEndMultAtt = att.staticEnduranceMult ?? 1;
  const traitEndMultDef = def.staticEnduranceMult ?? 1;
  att.endurance -= Math.round(
    enduranceCost(curAttOE, curAttAL, ctx.weather) *
      getEnduranceMult(att.style) *
      curAttWepReq.endurancePenalty *
      (att.encumbrancePenalty?.enduranceMult ?? 1) *
      arenaEndMult *
      (aGoesFirst ? psychEndMultA : psychEndMultD) *
      traitEndMultAtt
  );
  def.endurance -= Math.max(
    1,
    Math.round(
      enduranceCost(aGoesFirst ? OE_D : OE_A, aGoesFirst ? AL_D : AL_A, ctx.weather) *
        DEFENDER_ENDURANCE_DISCOUNT *
        getEnduranceMult(def.style) *
        curDefWepReq.endurancePenalty *
        (def.encumbrancePenalty?.enduranceMult ?? 1) *
        arenaEndMult *
        (aGoesFirst ? psychEndMultD : psychEndMultA) *
        traitEndMultDef
    )
  );

  if (
    (fA.endurance <= 0 || fD.endurance <= 0) &&
    !events.some((e) => e.result === 'Kill' || e.result === 'KO')
  ) {
    if (fA.endurance <= 0 && fD.endurance <= 0) {
      events.push({
        type: 'BOUT_END',
        actor: 'A',
        result: 'Exhaustion',
        metadata: { cause: 'FATIGUE_COLLAPSE' },
      });
    } else {
      const collapsed = fA.endurance <= 0 ? fA : fD;
      // FATIGUE_COLLAPSE bucket annotates stoppages where the collapsed fighter was also critically wounded.
      const cause = collapsed.hp < collapsed.maxHp * 0.15 ? 'FATIGUE_COLLAPSE' : undefined;
      events.push({
        type: 'BOUT_END',
        actor: fA.endurance <= 0 ? 'A' : 'D',
        result: 'Stoppage',
        metadata: cause ? { cause } : undefined,
      });
    }
  }
}
