import fs from "node:fs";
import { createId } from "@paralleldrive/cuid2";

export interface GolferData {
	name: string;
	category: number;
	isEligible: boolean;
}

export interface TournamentData {
	id: string;
	name: string;
	type: "Standard" | "Double" | "Triple";
	segment: number;
	startDate: string;
	endDate: string;
	isActive: boolean;
}

export interface MemberData {
	name: string;
	roster?: { [key: number]: string };
}

export function parseCSV(filePath: string): string[][] {
	const content = fs.readFileSync(filePath, "utf-8");
	return content
		.split("\n")
		.map((line) =>
			line
				.split(",")
				.map((cell) => cell.trim())
				.filter((cell) => cell),
		)
		.filter((row) => row.length > 0);
}

export function generateId(): string {
	return createId();
}

export function parseChalkCounterCSV(filePath: string): GolferData[] {
	const data = parseCSV(filePath);
	const golfers: GolferData[] = [];
	let currentCategory = 0;

	for (let i = 0; i < data.length; i++) {
		const row = data[i];

		// Category headers
		if (row[0]?.includes("Category")) {
			const match = row[0].match(/Category (\d+)/);
			if (match) {
				currentCategory = parseInt(match[1], 10);
			}
			continue;
		}

		// Golfer data
		if (
			row[0] &&
			!row[0]?.includes("Golfer") &&
			!row[0]?.includes("Category")
		) {
			const name = row[0]?.trim();
			if (name && currentCategory > 0) {
				golfers.push({
					name,
					category: currentCategory,
					isEligible: name !== "Scottie Scheffler", // Only Scottie is ineligible
				});
			}
		}
	}

	return golfers;
}

export function parseMembersCSV(filePath: string): MemberData[] {
	const data = parseCSV(filePath);
	const members: MemberData[] = [];
	const seenNames = new Set<string>();

	// Skip header rows and look for member names
	for (let i = 0; i < data.length; i++) {
		const row = data[i];
		const memberName = row[0]?.trim();

		// Valid member names are:
		// - Not empty
		// - Not "Total"
		// - Not "Golfer" (header)
		// - Not containing "Segment" (header row)
		// - Not already seen (avoid duplicates)
		if (
			memberName &&
			memberName !== "Total" &&
			memberName !== "Golfer" &&
			!memberName.includes("Segment") &&
			!seenNames.has(memberName)
		) {
			members.push({ name: memberName });
			seenNames.add(memberName);
		}
	}

	return members;
}

export function parseTournamentsCSV(): TournamentData[] {
	// Tournament data mapping (from the SCHEDULE_OF_EVENTS.md)
	const schedule = [
		{
			id: "sony-open",
			name: "Sony Open in Hawaii",
			type: "Standard" as const,
			segment: 1,
			startDate: "2026-01-09",
			endDate: "2026-01-12",
			isActive: false,
		},
		{
			id: "american-express",
			name: "The American Express",
			type: "Standard" as const,
			segment: 1,
			startDate: "2026-01-16",
			endDate: "2026-01-19",
			isActive: false,
		},
		{
			id: "farmers-insurance",
			name: "Farmers Insurance Open",
			type: "Standard" as const,
			segment: 1,
			startDate: "2026-01-23",
			endDate: "2026-01-26",
			isActive: false,
		},
		{
			id: "waste-management",
			name: "Waste Management Phoenix Open",
			type: "Standard" as const,
			segment: 1,
			startDate: "2026-01-30",
			endDate: "2026-02-02",
			isActive: false,
		},
		{
			id: "pebble-beach",
			name: "AT&T Pebble Beach Pro-Am",
			type: "Standard" as const,
			segment: 1,
			startDate: "2026-02-06",
			endDate: "2026-02-09",
			isActive: false,
		},
		{
			id: "genesis-championship",
			name: "Genesis Championship",
			type: "Standard" as const,
			segment: 1,
			startDate: "2026-02-13",
			endDate: "2026-02-16",
			isActive: false,
		},
		// Add more tournaments as needed...
	];

	return schedule;
}
