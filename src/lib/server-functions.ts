import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { auth } from "./auth";
import { db } from "./db";
import { calculatePoints } from "./scoring";
import { golfers, members, rosters, scoring, tournaments } from "./schema";

type Role = "admin" | "data" | "user";

type ServerFnErrorCode =
	| "BAD_REQUEST"
	| "INTERNAL_ERROR"
	| "NOT_FOUND"
	| "UNAUTHENTICATED"
	| "UNAUTHORIZED";

type ServerFnError = {
	code: ServerFnErrorCode;
	message: string;
};

type ServerFnErrorResponse = {
	success: false;
	error: ServerFnError;
};

type ServerFnSuccess<T> = {
	success: true;
	data: T;
};

type ServerFnResponse<T> = ServerFnSuccess<T> | ServerFnErrorResponse;

const unauthenticatedResponse: ServerFnErrorResponse = {
	success: false,
	error: {
		code: "UNAUTHENTICATED",
		message: "You must be signed in to perform this action.",
	},
};

const unauthorizedResponse: ServerFnErrorResponse = {
	success: false,
	error: {
		code: "UNAUTHORIZED",
		message: "You do not have access to perform this action.",
	},
};

const internalErrorResponse = (message: string): ServerFnErrorResponse => ({
	success: false,
	error: {
		code: "INTERNAL_ERROR",
		message,
	},
});

async function requireServerRole(
	allowedRoles?: Role[],
): Promise<ServerFnErrorResponse | { success: true; role: Role }> {
	const headers = getRequestHeaders();
	const session = await auth.api.getSession({ headers });

	if (!session?.user) {
		return unauthenticatedResponse;
	}

	const userRole = (session.user.role as Role | undefined) ?? "user";
	if (allowedRoles && !allowedRoles.includes(userRole)) {
		return unauthorizedResponse;
	}

	return { success: true, role: userRole };
}

export const importScoringData = createServerFn({ method: "POST" }).handler(
	async ({
		tournamentResults,
	}: {
		tournamentResults: Array<{
			tournamentId: string;
			golferName: string;
			rank: number;
		}>;
	}): Promise<
		ServerFnResponse<{
			count: number;
			results: Array<{
				golfer: string;
				tournament: string;
				rank: number;
				points: number;
			}>;
		}>
	> => {
		const authResult = await requireServerRole(["admin", "data"]);
		if (!authResult.success) {
			return authResult;
		}

		try {
			if (!tournamentResults.length) {
				return {
					success: false,
					error: {
						code: "BAD_REQUEST",
						message: "No tournament results were provided.",
					},
				};
			}

			const results: Array<{
				golfer: string;
				tournament: string;
				rank: number;
				points: number;
			}> = [];

			for (const result of tournamentResults) {
				const tournament = await db
					.select()
					.from(tournaments)
					.where(eq(tournaments.id, result.tournamentId))
					.then((rows) => rows[0]);

				if (!tournament) {
					return {
						success: false,
						error: {
							code: "NOT_FOUND",
							message: `Tournament not found: ${result.tournamentId}`,
						},
					};
				}

				const golfer = await db
					.select()
					.from(golfers)
					.where(eq(golfers.name, result.golferName))
					.then((rows) => rows[0]);

				if (!golfer) {
					return {
						success: false,
						error: {
							code: "NOT_FOUND",
							message: `Golfer not found: ${result.golferName}`,
						},
					};
				}

				const points = calculatePoints(result.rank, tournament.type);

				await db.insert(scoring).values({
					id: `scoring-${Date.now()}-${Math.random()
						.toString(36)
						.substr(2, 9)}`,
					tournamentId: result.tournamentId,
					golferId: golfer.id,
					rank: result.rank,
					points,
					createdAt: new Date(),
				});

				results.push({
					golfer: golfer.name,
					tournament: tournament.name,
					rank: result.rank,
					points,
				});
			}

			return {
				success: true,
				data: {
					count: results.length,
					results,
				},
			};
		} catch (error) {
			return internalErrorResponse(
				error instanceof Error
					? error.message
					: "Unable to import scoring data.",
			);
		}
	},
);

export const getLeaderboardData = createServerFn({ method: "GET" }).handler(
	async ({
		page,
		pageSize,
	}: {
		page: number;
		pageSize: number;
	}) => {
		type Member = typeof members.$inferSelect;
		type Roster = typeof rosters.$inferSelect;
		type Score = typeof scoring.$inferSelect;
		type Tournament = typeof tournaments.$inferSelect;

		type MemberWithPoints = Member & {
			totalPoints: number;
			segment1Points: number;
			segment2Points: number;
			segment3Points: number;
			segment4Points: number;
			segment5Points: number;
		};

		const [allMembers, allScoring, allTournaments, allGolfers, allRosters] =
			await Promise.all([
				db.select().from(members),
				db.select().from(scoring),
				db.select().from(tournaments),
				db.select().from(golfers),
				db.select().from(rosters),
			]);

		const membersWithScores: MemberWithPoints[] = allMembers.map((member) => {
			const memberRoster: Roster[] = allRosters.filter(
				(r) => r.memberId === member.id,
			);
			const memberGolferIds = memberRoster.map((r) => r.golferId);

			const memberScoring: Score[] = allScoring.filter((s) =>
				memberGolferIds.includes(s.golferId),
			);

			const totalPoints = memberScoring.reduce((sum, score) => {
				const tournament: Tournament | undefined = allTournaments.find(
					(t) => t.id === score.tournamentId,
				);
				if (tournament) {
					return sum + calculatePoints(score.rank, tournament.type);
				}
				return sum;
			}, 0);

			const segmentPoints = {
				segment1Points: 0,
				segment2Points: 0,
				segment3Points: 0,
				segment4Points: 0,
				segment5Points: 0,
			};

			memberScoring.forEach((score) => {
				const tournament: Tournament | undefined = allTournaments.find(
					(t) => t.id === score.tournamentId,
				);
				if (tournament) {
					const points = calculatePoints(score.rank, tournament.type);
					const segmentKey =
						`segment${tournament.segment}Points` as keyof typeof segmentPoints;
					segmentPoints[segmentKey] += points;
				}
			});

			return {
				...member,
				totalPoints,
				...segmentPoints,
			};
		});

		const sortedMembers: MemberWithPoints[] = [...membersWithScores].sort(
			(a, b) => b.totalPoints - a.totalPoints,
		);

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
		};
	},
);

export const getTournamentList = createServerFn({ method: "GET" }).handler(
	async (): Promise<
		ServerFnResponse<{ tournaments: (typeof tournaments.$inferSelect)[] }>
	> => {
		try {
			const allTournaments = await db.select().from(tournaments);
			return {
				success: true,
				data: {
					tournaments: allTournaments,
				},
			};
		} catch (error) {
			return internalErrorResponse(
				error instanceof Error ? error.message : "Unable to load tournaments.",
			);
		}
	},
);
