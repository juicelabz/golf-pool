import { eq } from "drizzle-orm";
import { db } from "../src/lib/db";
import { parseTournamentsCSV } from "../src/lib/import-utils";
import { scoring, tournaments } from "../src/lib/schema";
import { calculatePoints } from "../src/lib/scoring";

async function main() {
	const schedule = parseTournamentsCSV();

	if (schedule.length === 0) {
		throw new Error(
			"No tournaments parsed from SCHEDULE_OF_EVENTS.md. Check parsing logic/format.",
		);
	}

	// Upsert tournaments by primary key.
	for (const t of schedule) {
		await db
			.insert(tournaments)
			.values({
				id: t.id,
				name: t.name,
				type: t.type,
				segment: t.segment,
				startDate: t.startDate,
				endDate: t.endDate,
				isActive: t.isActive,
				createdAt: new Date(),
			})
			.onConflictDoUpdate({
				target: tournaments.id,
				set: {
					name: t.name,
					type: t.type,
					segment: t.segment,
					startDate: t.startDate,
					endDate: t.endDate,
				},
			});
	}

	// Recompute scoring points from tournament type to keep seed/sample data consistent.
	const allTournaments = await db
		.select({ id: tournaments.id, type: tournaments.type })
		.from(tournaments);
	const typeByTournamentId = new Map(allTournaments.map((t) => [t.id, t.type]));

	const allScores = await db.select().from(scoring);
	let updatedScores = 0;

	for (const s of allScores) {
		const tType = typeByTournamentId.get(s.tournamentId);
		if (!tType) continue;
		const nextPoints = calculatePoints(s.rank, tType);
		if (s.points === nextPoints) continue;

		await db.update(scoring).set({ points: nextPoints }).where(eq(scoring.id, s.id));
		updatedScores++;
	}

	const finalTournamentCount = (await db.select().from(tournaments)).length;

	console.log(
		JSON.stringify(
			{
				parsedTournaments: schedule.length,
				finalTournamentCount,
				scoringRows: allScores.length,
				updatedScores,
			},
			null,
			2,
		),
	);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});

