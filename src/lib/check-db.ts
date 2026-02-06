import { db } from "./db";
import { golfers, members, tournaments } from "./schema";

async function checkDatabase() {
	console.log("🔍 Checking database contents...");

	const golferCount = await db.select().from(golfers);
	console.log(`📊 Golfers: ${golferCount.length}`);

	const memberCount = await db.select().from(members);
	console.log(`👥 Members: ${memberCount.length}`);

	const tournamentCount = await db.select().from(tournaments);
	console.log(`🏆 Tournaments: ${tournamentCount.length}`);

	// Show some sample data
	console.log("\n📊 Sample golfers:");
	golferCount
		.slice(0, 5)
		.forEach((g) => console.log(`  - ${g.name} (Category ${g.category})`));

	console.log("\n👥 Sample members:");
	memberCount.slice(0, 5).forEach((m) => console.log(`  - ${m.name}`));

	console.log("\n🏆 Sample tournaments:");
	tournamentCount
		.slice(0, 3)
		.forEach((t) =>
			console.log(`  - ${t.name} (${t.type}, Segment ${t.segment})`),
		);
}

checkDatabase().catch(console.error);
