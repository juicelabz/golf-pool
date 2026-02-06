import { db } from "./db";
import {
	generateId,
	parseChalkCounterCSV,
	parseMembersCSV,
	parseTournamentsCSV,
} from "./import-utils";
import {
	golfers,
	members,
	type NewGolfer,
	type NewMember,
	type NewTournament,
	tournaments,
} from "./schema";

export async function seedDatabase() {
	console.log("🏌️ Starting database seeding...");

	try {
		// Seed golfers
		console.log("📊 Importing golfers...");
		const golferData = parseChalkCounterCSV("./data/chalk-counter.csv");

		for (const golfer of golferData) {
			const newGolfer: NewGolfer = {
				id: generateId(),
				name: golfer.name,
				category: golfer.category,
				isEligible: golfer.isEligible,
				createdAt: new Date(),
			};
			await db.insert(golfers).values(newGolfer);
		}
		console.log(`✅ Imported ${golferData.length} golfers`);

		// Seed members
		console.log("👥 Importing members...");
		const memberData = parseMembersCSV("./data/team-rosters.csv");

		for (const member of memberData) {
			const newMember: NewMember = {
				id: generateId(),
				name: member.name,
				userId: null, // Will be linked when users register
				totalPoints: 0,
				segment1Points: 0,
				segment2Points: 0,
				segment3Points: 0,
				segment4Points: 0,
				segment5Points: 0,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			await db.insert(members).values(newMember);
		}
		console.log(`✅ Imported ${memberData.length} members`);

		// Seed tournaments
		console.log("🏆 Importing tournaments...");
		const tournamentData = parseTournamentsCSV();

		for (const tournament of tournamentData) {
			const newTournament: NewTournament = {
				id: tournament.id,
				name: tournament.name,
				type: tournament.type,
				segment: tournament.segment,
				startDate: tournament.startDate,
				endDate: tournament.endDate,
				isActive: tournament.isActive,
				createdAt: new Date(),
			};
			await db.insert(tournaments).values(newTournament);
		}
		console.log(`✅ Imported ${tournamentData.length} tournaments`);

		console.log("🎉 Database seeding completed successfully!");
	} catch (error) {
		console.error("❌ Error seeding database:", error);
		throw error;
	}
}

// Scoring calculation helper
export const POINTS_MAP = {
	Standard: [15, 10, 8, 7, 6, 5, 4, 3, 2, 1],
	Double: [30, 20, 16, 14, 12, 10, 8, 6, 4, 2],
	Triple: [45, 30, 24, 21, 18, 15, 12, 9, 6, 3],
};

export function calculatePoints(
	rank: number,
	type: "Standard" | "Double" | "Triple",
): number {
	if (rank > 10) return 0;
	return POINTS_MAP[type][rank - 1];
}

// Run seeding if this file is executed directly
if (import.meta.main) {
	seedDatabase()
		.then(() => {
			console.log("✨ Seeding complete!");
			process.exit(0);
		})
		.catch((error) => {
			console.error("💥 Seeding failed:", error);
			process.exit(1);
		});
}
