/** @vitest-environment node */
import { describe, it, expect, vi } from "vitest";
import { resolveBout, generatePairings } from "@/engine/boutProcessor";
import { FightingStyle } from "@/types/game";

describe("boutProcessor - generatePairings", () => {
    it("should generate pairings for player and rival", () => {
        const state: any = {
            week: 1,
            player: { id: "p1", stableName: "Player" },
            roster: [{ id: "w1", status: "Active", stableId: "p1", style: FightingStyle.BashingAttack, attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 }, fame: 0 }],
            rivals: [
                { owner: { id: "r1", stableName: "Stab" }, roster: [{ id: "w2", name: "W2", status: "Active", stableId: "r1", style: FightingStyle.TotalParry, attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 }, fame: 0 }] }
            ],
            trainingAssignments: [],
            restStates: [],
            rivalries: [],
            matchHistory: [],
            arenaHistory: [],
            playerChallenges: [],
            playerAvoids: []
        };
        const pairings = generatePairings(state);
        expect(pairings.length).toBe(1);
        expect(pairings[0].a.id).toBe("w1");
        expect(pairings[0].d.id).toBe("w2");
    });
});

describe("boutProcessor - resolveBout", () => {
    const mockWarrior: any = { id: "w1", name: "W1", status: "Active", stableId: "p1", career: { wins: 0, losses: 0, kills: 0 }, fame: 0, popularity: 0, attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 }, style: FightingStyle.BashingAttack };
    const mockOpponent: any = { id: "w2", name: "W2", status: "Active", stableId: "r1", career: { wins: 0, losses: 0, kills: 0 }, fame: 0, popularity: 0, attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 }, style: FightingStyle.TotalParry };
    const mockState: any = {
        week: 1,
        roster: [mockWarrior],
        rivals: [{ owner: { id: "r1", stableName: "Stab" }, roster: [mockOpponent] }],
        arenaHistory: [],
        newsletter: [],
        trainers: [],
        player: { id: "p1" },
        crowdMood: "Calm",
        rivalries: [],
        matchHistory: [],
        graveyard: []
    };

    it("should update records after a bout", () => {
        const ctx: any = {
            warriorMap: new Map([["w1", mockWarrior], ["w2", mockOpponent]]),
            warrior: mockWarrior,
            opponent: mockOpponent,
            isRivalry: false,
            moodMods: { fameMultiplier: 1, popMultiplier: 1 },
            week: 1,
            playerId: "p1"
        };
        
        const { state, result } = resolveBout(mockState, ctx);
        
        expect(result.outcome.winner).toBeDefined();
        expect(state.arenaHistory.length).toBe(1);
    });
});
