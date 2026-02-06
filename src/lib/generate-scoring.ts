import { db } from "./db";
import { generateId } from "./import-utils";
import { golfers, scoring, tournaments } from "./schema";

async function generateSampleScoring() {
	console.log("🏌️ Generating sample tournament results...");

	// Get tournaments and golfers
	const tournaments_data = await db.select().from(tournaments);
	const golfers_data = await db.select().from(golfers);

	console.log(
		`Found ${tournaments_data.length} tournaments and ${golfers_data.length} golfers`,
	);

	// Generate realistic scoring data for tournaments
	for (const tournament of tournaments_data) {
		// Select top 10 finishers randomly
		const winners = golfers_data.sort(() => Math.random() - 0.5).slice(0, 10);

		// Create scoring entries for this tournament
		const scoringEntries = winners.map((golfer, rank) => ({
			id: generateId(),
			tournamentId: tournament.id,
			golferId: golfer.id,
			rank: rank + 1, // 1-10
			points: 0, // Will be calculated later
			createdAt: new Date(),
		}));

		await db.insert(scoring).values(scoringEntries);
		console.log(
			`✅ Added ${scoringEntries.length} results for ${tournament.name}`,
		);
	}

	console.log("🎉 Sample scoring data generated successfully!");
}

if (import.meta.main) {
	generateSampleScoring()
		.then(() => {
			console.log("✨ Successfully generated sample data!");
			process.exit(0);
		})
		.catch((error) => {
			console.error("💥 Failed to generate scoring:", error);
			process.exit(1);
		});
}
