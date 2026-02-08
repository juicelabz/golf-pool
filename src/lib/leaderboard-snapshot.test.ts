import { describe, expect, it } from "vitest";
import { buildLeaderboardSnapshot } from "./leaderboard-snapshot";
import type { Golfer, Member, Roster, Scoring, Tournament } from "./schema";

const date = new Date("2026-01-01T00:00:00.000Z");

function createMember(id: string, name: string): Member {
	return {
		id,
		name,
		userId: null,
		totalPoints: 0,
		segment1Points: 0,
		segment2Points: 0,
		segment3Points: 0,
		segment4Points: 0,
		segment5Points: 0,
		createdAt: date,
		updatedAt: date,
	};
}

function createGolfer(id: string, name: string): Golfer {
	return {
		id,
		name,
		category: 1,
		isEligible: true,
		createdAt: date,
	};
}

function createTournament(
	id: string,
	type: Tournament["type"],
	segment: number,
): Tournament {
	return {
		id,
		name: id,
		type,
		segment,
		startDate: "2026-01-01",
		endDate: "2026-01-04",
		isActive: true,
		createdAt: date,
	};
}

function createRoster(
	id: string,
	memberId: string,
	golferId: string,
	category: number,
): Roster {
	return {
		id,
		memberId,
		golferId,
		category,
		createdAt: date,
	};
}

function createScore(
	id: string,
	tournamentId: string,
	golferId: string,
	rank: number,
): Scoring {
	return {
		id,
		tournamentId,
		golferId,
		rank,
		points: 0,
		createdAt: date,
	};
}

describe("buildLeaderboardSnapshot", () => {
	it("keeps ranking, segment totals, and pagination behavior", () => {
		const allMembers = [
			createMember("m1", "Alice"),
			createMember("m2", "Bob"),
			createMember("m3", "Cara"),
		];
		const allGolfers = [
			createGolfer("g1", "G1"),
			createGolfer("g2", "G2"),
			createGolfer("g3", "G3"),
			createGolfer("g4", "G4"),
		];
		const allTournaments = [
			createTournament("t1", "Standard", 1),
			createTournament("t2", "Double", 2),
			createTournament("t3", "Triple", 5),
		];
		const allRosters = [
			createRoster("r1", "m1", "g1", 1),
			createRoster("r2", "m1", "g2", 2),
			createRoster("r3", "m2", "g3", 1),
			createRoster("r4", "m3", "g4", 1),
		];
		const allScoring = [
			createScore("s1", "t1", "g1", 1),
			createScore("s2", "t2", "g2", 2),
			createScore("s3", "t3", "g3", 3),
			createScore("s4", "t1", "g4", 11),
		];

		const snapshot = buildLeaderboardSnapshot({
			allMembers,
			allScoring,
			allTournaments,
			allGolfers,
			allRosters,
			page: 1,
			pageSize: 2,
			lastUpdatedAt: "2026-02-08T00:00:00.000Z",
		});

		expect(snapshot.members.map((member) => member.name)).toEqual([
			"Alice",
			"Bob",
		]);
		expect(snapshot.members[0]?.totalPoints).toBe(35);
		expect(snapshot.members[0]?.segment1Points).toBe(15);
		expect(snapshot.members[0]?.segment2Points).toBe(20);
		expect(snapshot.members[1]?.totalPoints).toBe(24);
		expect(snapshot.members[1]?.segment5Points).toBe(24);
		expect(snapshot.currentPage).toBe(1);
		expect(snapshot.pageSize).toBe(2);
		expect(snapshot.totalPages).toBe(2);
		expect(snapshot.totalMembers).toBe(3);
		expect(snapshot.lastUpdatedAt).toBe("2026-02-08T00:00:00.000Z");
	});

	it("preserves original member order when points are tied", () => {
		const allMembers = [createMember("m1", "Alice"), createMember("m2", "Bob")];
		const allGolfers = [createGolfer("g1", "G1"), createGolfer("g2", "G2")];
		const allTournaments = [createTournament("t1", "Standard", 1)];
		const allRosters = [
			createRoster("r1", "m1", "g1", 1),
			createRoster("r2", "m2", "g2", 1),
		];
		const allScoring = [
			createScore("s1", "t1", "g1", 1),
			createScore("s2", "t1", "g2", 1),
		];

		const snapshot = buildLeaderboardSnapshot({
			allMembers,
			allScoring,
			allTournaments,
			allGolfers,
			allRosters,
			page: 1,
			pageSize: 20,
			lastUpdatedAt: "2026-02-08T00:00:00.000Z",
		});

		expect(snapshot.members.map((member) => member.name)).toEqual([
			"Alice",
			"Bob",
		]);
	});
});
