import { describe, it, expect } from "vitest";
import { FightingStyle, type Warrior, type GameState, type RivalStableData } from "@/types/game";
import { scoreMatchup, getRecommendedChallenges, getMatchupsToAvoid } from "@/engine/schedulingAssistant";

describe("Scheduling Assistant Engine", () => {

    // Helper to generate minimal mock warrior
    const mockWarrior = (id: string, style: FightingStyle, fame = 0, wins = 0, losses = 0): Warrior => ({
        id,
        name: `Warrior ${id}`,
        style,
        attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
        fame,
        popularity: 0,
        titles: [],
        injuries: [],
        flair: [],
        career: { wins, losses, kills: 0 },
        champion: false,
        status: "Active",
        age: 20
    });

    // Helper to generate minimal state
    const mockState = (rivalWarriors: Warrior[]): GameState => {
        const rivalData: RivalStableData[] = [{
            owner: { id: "rival1", name: "Rival Owner", stableName: "Rival Stable", fame: 0, renown: 0, titles: 0 },
            roster: rivalWarriors
        }];

        return {
            meta: { gameName: "test", version: "1", createdAt: "now" },
            ftueComplete: true,
            coachDismissed: [],
            player: { id: "p1", name: "Player", stableName: "Player Stable", fame: 0, renown: 0, titles: 0 },
            fame: 0,
            popularity: 0,
            gold: 0,
            ledger: [],
            week: 1,
            season: "Spring",
            roster: [],
            graveyard: [],
            retired: [],
            arenaHistory: [],
            newsletter: [],
            hallOfFame: [],
            crowdMood: "Calm",
            tournaments: [],
            trainers: [],
            hiringPool: [],
            trainingAssignments: [],
            seasonalGrowth: [],
            rivals: rivalData,
            scoutReports: [],
            restStates: [],
            rivalries: [],
            matchHistory: [],
            recruitPool: [],
            rosterBonus: 0,
            ownerGrudges: [],
            insightTokens: [],
            moodHistory: [],
            settings: { featureFlags: { tournaments: true, scouting: true } }
        };
    };

    it("should correctly score a favorable style matchup (e.g. TP vs AB)", () => {
        const tp = mockWarrior("tp1", FightingStyle.TotalParry);
        const ab = mockWarrior("ab1", FightingStyle.AimedBlow);

        const state = { player: { id: 'p' }, rivalries: [] } as any;
        const score = scoreMatchup(tp, ab, state);
        // TP vs AB is +2 advantage for TP. 2 * 25 = 50. Base 100. Total = 150.
        expect(score).toBe(150);
    });

    it("should correctly score an unfavorable style matchup (e.g. AB vs PR)", () => {
        const ab = mockWarrior("ab1", FightingStyle.AimedBlow);
        const pr = mockWarrior("pr1", FightingStyle.ParryRiposte);

        const state = { player: { id: 'p' }, rivalries: [] } as any;
        const score = scoreMatchup(ab, pr, state);
        // AB vs PR = -2 advantage. -2 * 25 = -50. Base 100. Total = 50.
        expect(score).toBe(50);
    });

    it("should return a sorted list of top challenges for a warrior", () => {
        const p1 = mockWarrior("p1", FightingStyle.TotalParry, 10);

        const r1 = mockWarrior("r1", FightingStyle.AimedBlow, 10); // Advantage +2 -> 150
        const r2 = mockWarrior("r2", FightingStyle.TotalParry, 10); // Advantage 0 -> 100
        const r3 = mockWarrior("r3", FightingStyle.WallOfSteel, 10); // Advantage -1 -> 75

        const state = mockState([r1, r2, r3]);

        const challenges = getRecommendedChallenges(state, p1, 3);

        expect(challenges.length).toBe(3);
        expect(challenges[0].rivalWarrior.id).toBe("r1");
        expect(challenges[1].rivalWarrior.id).toBe("r2");
        expect(challenges[2].rivalWarrior.id).toBe("r3");
    });

    it("should penalize matchups where fame difference is too high", () => {
        const p1 = mockWarrior("p1", FightingStyle.TotalParry, 10);

        const r1 = mockWarrior("r1", FightingStyle.TotalParry, 10); // Diff 0. Penalty 0. Base 100
        const r2 = mockWarrior("r2", FightingStyle.TotalParry, 50); // Diff -40. +10 bump. But abs(diff) = 40. 40 - 20 = 20 penalty. Total penalty = -10. Score = 90

        const state = { player: { id: 'p' }, rivalries: [] } as any;
        const score1 = scoreMatchup(p1, r1, state);
        const score2 = scoreMatchup(p1, r2, state);

        expect(score1).toBeGreaterThan(score2);
    });

    it("should return a sorted list of matchups to avoid", () => {
        const p1 = mockWarrior("p1", FightingStyle.AimedBlow, 10);

        // AB vs PR = -2
        // AB vs PS = -2
        // AB vs BA = +1
        const r1 = mockWarrior("r1", FightingStyle.ParryRiposte, 10);
        const r2 = mockWarrior("r2", FightingStyle.ParryStrike, 10);
        const r3 = mockWarrior("r3", FightingStyle.BashingAttack, 10);

        const state = mockState([r1, r2, r3]);

        const avoid = getMatchupsToAvoid(state, p1, 2);

        expect(avoid.length).toBe(2);
        expect(["r1", "r2"]).toContain(avoid[0].rivalWarrior.id);
        expect(["r1", "r2"]).toContain(avoid[1].rivalWarrior.id);
    });

});
