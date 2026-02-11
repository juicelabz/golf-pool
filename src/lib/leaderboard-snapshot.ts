import { createServerFn } from "@tanstack/react-start";
import { db } from "./db";
import {
	type Golfer,
	golfers,
	type Member,
	members,
	type Roster,
	rosters,
	type Scoring,
	scoring,
	type Tournament,
	tournaments,
} from "./schema";
import { calculatePoints } from "./scoring";

type SegmentPoints = {
	segment1Points: number;
	segment2Points: number;
	segment3Points: number;
	segment4Points: number;
	segment5Points: number;
};

export type LeaderboardMember = Member & {
	totalPoints: number;
} & SegmentPoints;

export type LeaderboardSnapshot = {
	members: LeaderboardMember[];
	tournaments: Tournament[];
	golfers: Golfer[];
	totalParticipants: number;
	totalGolfers: number;
	totalMembers: number;
	currentPage: number;
	pageSize: number;
	totalPages: number;
	lastUpdatedAt: string;
};

type BuildLeaderboardSnapshotInput = {
	allMembers: Member[];
	allScoring: Scoring[];
	allTournaments: Tournament[];
	allGolfers: Golfer[];
	allRosters: Roster[];
	page: number;
	pageSize: number;
	lastUpdatedAt: string;
};

const segmentKeysByNumber = {
	1: "segment1Points",
	2: "segment2Points",
	3: "segment3Points",
	4: "segment4Points",
	5: "segment5Points",
} as const;

export function buildLeaderboardSnapshot({
	allMembers,
	allScoring,
	allTournaments,
	allGolfers,
	allRosters,
	page,
	pageSize,
	lastUpdatedAt,
}: BuildLeaderboardSnapshotInput): LeaderboardSnapshot {
	const tournamentsById = new Map(
		allTournaments.map((tournament) => [tournament.id, tournament]),
	);
	const golferIdsByMemberId = new Map<string, Set<string>>();
	const scoresByGolferId = new Map<string, Scoring[]>();

	for (const roster of allRosters) {
		const golferIds = golferIdsByMemberId.get(roster.memberId);
		if (golferIds) {
			golferIds.add(roster.golferId);
			continue;
		}

		golferIdsByMemberId.set(roster.memberId, new Set([roster.golferId]));
	}

	for (const score of allScoring) {
		const golferScores = scoresByGolferId.get(score.golferId);
		if (golferScores) {
			golferScores.push(score);
			continue;
		}

		scoresByGolferId.set(score.golferId, [score]);
	}

	const membersWithScores = allMembers.map((member, originalIndex) => {
		const segmentPoints: SegmentPoints = {
			segment1Points: 0,
			segment2Points: 0,
			segment3Points: 0,
			segment4Points: 0,
			segment5Points: 0,
		};

		let totalPoints = 0;
		const golferIds = golferIdsByMemberId.get(member.id);

		if (golferIds) {
			for (const golferId of golferIds) {
				const golferScores = scoresByGolferId.get(golferId);
				if (!golferScores) continue;

				for (const score of golferScores) {
					const tournament = tournamentsById.get(score.tournamentId);
					if (!tournament) continue;

					const points = calculatePoints(score.rank, tournament.type);
					totalPoints += points;

					const segmentKey =
						segmentKeysByNumber[
							tournament.segment as keyof typeof segmentKeysByNumber
						];
					if (segmentKey) {
						segmentPoints[segmentKey] += points;
					}
				}
			}
		}

		return {
			...member,
			totalPoints,
			...segmentPoints,
			originalIndex,
		};
	});

	const sortedMembers = membersWithScores
		.sort(
			(a, b) =>
				b.totalPoints - a.totalPoints || a.originalIndex - b.originalIndex,
		)
		.map(({ originalIndex: _, ...member }) => member);

	const startIndex = (page - 1) * pageSize;
	const endIndex = startIndex + pageSize;
	const paginatedMembers = sortedMembers.slice(startIndex, endIndex);
	const totalPages = Math.ceil(sortedMembers.length / pageSize);

	return {
		members: paginatedMembers,
		tournaments: allTournaments,
		golfers: allGolfers,
		totalParticipants: allMembers.length,
		totalGolfers: allGolfers.length,
		totalMembers: sortedMembers.length,
		currentPage: page,
		pageSize,
		totalPages,
		lastUpdatedAt,
	};
}

export async function getLeaderboardSnapshotData({
	page,
	pageSize,
}: {
	page: number;
	pageSize: number;
}): Promise<LeaderboardSnapshot> {
	const [allMembers, allScoring, allTournaments, allGolfers, allRosters] =
		await Promise.all([
			db.select().from(members),
			db.select().from(scoring),
			db.select().from(tournaments),
			db.select().from(golfers),
			db.select().from(rosters),
		]);

	return buildLeaderboardSnapshot({
		allMembers,
		allScoring,
		allTournaments,
		allGolfers,
		allRosters,
		page,
		pageSize,
		lastUpdatedAt: new Date().toISOString(),
	});
}

export const getLeaderboardSnapshot = createServerFn({ method: "GET" })
	.inputValidator((data: { page: number; pageSize: number }) => data)
	.handler(async ({ data }) => {
		return await getLeaderboardSnapshotData(data);
	});
