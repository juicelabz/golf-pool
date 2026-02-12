import { createId } from "@paralleldrive/cuid2";
import { db } from "./db";
import {
	parseTeamRostersCSV,
	resolveGolferNameForLookup,
} from "./import-utils";
import { golfers, members, rosters } from "./schema";

export type RosterImportResult = {
	success: boolean;
	insertedCount: number;
	memberCount: number;
	missingMembers: string[];
	missingGolfers: Array<{
		memberName: string;
		category: number;
		golferName: string;
	}>;
};

export async function importRostersFromCSV(
	csvPath: string = "./data/team-rosters.csv",
): Promise<RosterImportResult> {
	const [allMembers, allGolfers] = await Promise.all([
		db.select().from(members),
		db.select().from(golfers),
	]);

	const memberByName = new Map(
		allMembers.map((m) => [m.name.trim().toLowerCase(), m]),
	);
	// Map: normalized lookup key -> golfer. Use resolveGolferNameForLookup so CSV
	// variants (e.g. "Ludvig Aberg") match DB names (e.g. "Ludvig Åberg").
	const golferByNormalizedName = new Map<string, (typeof allGolfers)[0]>();
	for (const g of allGolfers) {
		const key = resolveGolferNameForLookup(g.name);
		if (!golferByNormalizedName.has(key)) {
			golferByNormalizedName.set(key, g);
		}
	}

	// Clear existing rosters
	await db.delete(rosters);

	const entries = parseTeamRostersCSV(csvPath);
	const missingMembers: string[] = [];
	const missingGolfers: Array<{
		memberName: string;
		category: number;
		golferName: string;
	}> = [];
	let insertedCount = 0;

	for (const entry of entries) {
		const member = memberByName.get(entry.memberName.trim().toLowerCase());
		if (!member) {
			missingMembers.push(entry.memberName);
			continue;
		}

		const rows: (typeof rosters.$inferInsert)[] = [];
		for (let cat = 1; cat <= 10; cat++) {
			const golferName = entry.golfersByCategory[cat];
			if (!golferName) continue;
			const lookupKey = resolveGolferNameForLookup(golferName);
			const golfer = golferByNormalizedName.get(lookupKey);
			if (!golfer) {
				missingGolfers.push({
					memberName: entry.memberName,
					category: cat,
					golferName,
				});
				continue;
			}
			rows.push({
				id: createId(),
				memberId: member.id,
				golferId: golfer.id,
				category: cat,
				createdAt: new Date(),
			});
		}

		if (rows.length === 10) {
			await db.insert(rosters).values(rows);
			insertedCount += rows.length;
		}
	}

	return {
		success: missingMembers.length === 0 && missingGolfers.length === 0,
		insertedCount,
		memberCount: entries.filter((e) => !missingMembers.includes(e.memberName))
			.length,
		missingMembers,
		missingGolfers,
	};
}

async function populateMemberRosters() {
	console.log("📊 Importing team rosters from CSV...");

	const result = await importRostersFromCSV();

	console.log(
		`✅ Inserted ${result.insertedCount} roster rows for ${result.memberCount} members`,
	);
	if (result.missingMembers.length > 0) {
		console.warn("⚠️ Missing members:", result.missingMembers.join(", "));
	}
	if (result.missingGolfers.length > 0) {
		console.warn(`⚠️ Missing golfer matches (${result.missingGolfers.length}):`);
		for (const m of result.missingGolfers.slice(0, 10)) {
			console.warn(`   ${m.memberName} cat ${m.category}: "${m.golferName}"`);
		}
		if (result.missingGolfers.length > 10) {
			console.warn(`   ... and ${result.missingGolfers.length - 10} more`);
		}
	}

	if (!result.success) {
		throw new Error(
			"Roster import had validation issues. Check missing members and golfers.",
		);
	}
}

if (import.meta.main) {
	populateMemberRosters()
		.then(() => {
			console.log("✨ Team rosters imported successfully!");
			process.exit(0);
		})
		.catch((error) => {
			console.error("💥 Failed to import rosters:", error);
			process.exit(1);
		});
}
