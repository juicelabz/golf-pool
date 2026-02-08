import { db } from "./db";
import { golfers, members, rosters, } from "./schema";

async function populateMemberRosters() {
	console.log("📊 Populating member rosters from CSV data...");

	// Get all members and golfers
	const allMembers = await db.select().from(members);
	const allGolfers = await db.select().from(golfers);

	console.log(
		`Found ${allMembers.length} members and ${allGolfers.length} golfers`,
	);

	// For each member, create rosters by assigning 10 random golfers
	// In production, this would be populated from actual user selections from CSV data
	for (const member of allMembers) {
		// Assign 10 golfers to each member for demo purposes
		const selectedGolfers = allGolfers
			.sort(() => Math.random() - 0.5)
			.slice(0, 10)
			.map((golfer, index) => ({
				id: `roster-${member.id}-${index}`,
				memberId: member.id,
				golferId: golfer.id,
				category: (index + 1) as number, // Categories 1-10
				createdAt: new Date(),
			}));

		// Insert rosters
		if (selectedGolfers.length > 0) {
			await db.insert(rosters).values(selectedGolfers);
		}
	}

	console.log(`✅ Created rosters for ${allMembers.length} members`);
}

if (import.meta.main) {
	populateMemberRosters()
		.then(() => {
			console.log("✨ Member rosters populated successfully!");
			process.exit(0);
		})
		.catch((error) => {
			console.error("💥 Failed to populate rosters:", error);
			process.exit(1);
		});
}
