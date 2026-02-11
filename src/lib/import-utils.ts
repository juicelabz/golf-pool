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

function decodeBasicHtmlEntities(input: string): string {
	// Keep this minimal; the schedule markdown only uses a couple entities today.
	return input.replaceAll("&amp;", "&").replaceAll("&nbsp;", " ");
}

function normalizeScheduleLine(input: string): string {
	return (
		decodeBasicHtmlEntities(input)
			// Normalize dash variants to hyphen-minus for simpler parsing
			.replaceAll("\u2013", "-") // en dash
			.replaceAll("\u2014", "-") // em dash
			.replaceAll("–", "-")
			.replaceAll("—", "-")
			.replace(/\s+/g, " ")
			.trim()
	);
}

function slugifyTournamentId(name: string): string {
	return name
		.normalize("NFKD")
		.replace(/[’'"]/g, "")
		.replaceAll("&", " and ")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}

function parseScheduleDateRange({
	startMonth,
	startDay,
	endMonth,
	endDay,
	year,
}: {
	startMonth: string;
	startDay: string;
	endMonth: string;
	endDay: string;
	year: number;
}): { startDate: string; endDate: string } {
	const startDate = `${year}-${startMonth}-${startDay}`;
	const endDate = `${year}-${endMonth}-${endDay}`;
	return { startDate, endDate };
}

export function parseTournamentsCSV(): TournamentData[] {
	// Tournament data mapping is sourced from SCHEDULE_OF_EVENTS.md
	const schedulePath = "./SCHEDULE_OF_EVENTS.md";
	const raw = fs.readFileSync(schedulePath, "utf-8");
	const lines = raw.split("\n").map((l) => normalizeScheduleLine(l));

	const year = 2026;
	let currentSegment: number | null = null;

	// Preserve existing IDs so we don't break existing scoring rows.
	const legacyIdsByName = new Map<string, string>([
		["sony open in hawaii", "sony-open"],
		["the american express", "american-express"],
		["farmers insurance open", "farmers-insurance"],
		["wm phoenix open", "waste-management"],
		["at&t pebble beach pro-am", "pebble-beach"],
		["genesis invitational", "genesis-championship"],
	]);

	const tournaments: TournamentData[] = [];

	for (const line of lines) {
		if (!line) continue;

		const segMatch = line.match(/^##\s*Scoring Segment\s*(\d+)\b/i);
		if (segMatch) {
			currentSegment = Number.parseInt(segMatch[1] ?? "", 10);
			continue;
		}

		// Example: "(02/12 - 02/15) - AT&T Pebble Beach Pro-Am - Double (Signature)"
		const dateMatch = line.match(
			/^\((\d{2})\/(\d{2})\s*-\s*(\d{2})\/(\d{2})\)\s*-\s*(.+)$/i,
		);
		if (!dateMatch) continue;
		if (!currentSegment) continue;

		const startMonth = dateMatch[1] ?? "";
		const startDay = dateMatch[2] ?? "";
		const endMonth = dateMatch[3] ?? "";
		const endDay = dateMatch[4] ?? "";
		const remainder = (dateMatch[5] ?? "").trim();

		const typeMatches = Array.from(
			remainder.matchAll(/\b(Standard|Double|Triple)\b/gi),
		);
		const lastType = typeMatches.at(-1);
		if (!lastType || lastType.index === undefined) continue;

		const typeRaw = (lastType[1] ?? "").toLowerCase();
		const type =
			typeRaw === "standard"
				? ("Standard" as const)
				: typeRaw === "double"
					? ("Double" as const)
					: ("Triple" as const);

		const name = remainder
			.slice(0, lastType.index)
			.replace(/[-\s]+$/g, "")
			.trim();

		const normalizedName = name.toLowerCase();
		const legacyId = legacyIdsByName.get(normalizedName);
		const id = legacyId ?? slugifyTournamentId(name);

		const { startDate, endDate } = parseScheduleDateRange({
			startMonth,
			startDay,
			endMonth,
			endDay,
			year,
		});

		tournaments.push({
			id,
			name,
			type,
			segment: currentSegment,
			startDate,
			endDate,
			isActive: false,
		});
	}

	return tournaments;
}
