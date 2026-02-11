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

export interface TeamRosterEntry {
	memberName: string;
	golfersByCategory: Record<number, string>;
}

/** Read CSV preserving empty cells so column indices stay stable. */
function parseCSVRaw(filePath: string): string[][] {
	const content = fs.readFileSync(filePath, "utf-8");
	return content
		.split("\n")
		.map((line) => line.split(",").map((cell) => cell.trim()));
}

/**
 * Parse team-rosters.csv to extract member → 10 golfers mapping.
 * Format: Member name row, "Golfer,1,,2,..." header, then Segment 1 row.
 * Golfer names are in columns 1,3,5,7,9,11,13,15,17,19 (categories 1–10).
 */
export function parseTeamRostersCSV(filePath: string): TeamRosterEntry[] {
	const rows = parseCSVRaw(filePath);
	const result: TeamRosterEntry[] = [];
	const GOLFER_COL_INDICES = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19];

	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];
		const firstCell = (row[0] ?? "").trim();
		if (
			!firstCell ||
			firstCell === "Total" ||
			firstCell === "Golfer" ||
			firstCell.includes("Segment")
		) {
			continue;
		}
		const headerRow = rows[i + 1];
		if (!headerRow?.[0]?.includes("Golfer")) {
			continue;
		}
		// Segment 1 row has the roster
		const segment1Row = rows[i + 2];
		if (!segment1Row?.[0]?.startsWith("Segment 1")) {
			continue;
		}
		const golfersByCategory: Record<number, string> = {};
		for (let c = 0; c < 10; c++) {
			const name = (segment1Row[GOLFER_COL_INDICES[c]] ?? "").trim();
			if (name) {
				golfersByCategory[c + 1] = name;
			}
		}
		if (Object.keys(golfersByCategory).length === 10) {
			result.push({ memberName: firstCell, golfersByCategory });
		}
	}

	return result;
}

/** Replace common non-ASCII chars that NFD does not decompose. */
const DIACRITIC_REPLACEMENTS: [RegExp, string][] = [
	[/ø/gi, "o"],
	[/æ/gi, "ae"],
	[/ö/gi, "o"],
	[/ü/gi, "u"],
	[/ä/gi, "a"],
];

/**
 * Normalize golfer name for matching (handles Å→A, ø→o, ö→o, etc.).
 * Preserves canonical display names in DB; use this only for lookup.
 */
export function normalizeGolferNameForMatch(name: string): string {
	let s = name
		.normalize("NFD")
		.replace(/\p{M}/gu, "")
		.replace(/\s+/g, " ")
		.trim()
		.toLowerCase();
	for (const [re, replacement] of DIACRITIC_REPLACEMENTS) {
		s = s.replace(re, replacement);
	}
	return s;
}

/** Alias map for CSV name variants → normalized canonical. */
const GOLFER_NAME_ALIASES: Record<string, string> = {
	"cam young": "cameron young",
	"rasmus højgaard": "rasmus hojgaard",
	"stephen jäger": "stephan jaeger",
	"stephen jaeger": "stephan jaeger",
	"stephan jäger": "stephan jaeger",
	"stephan jager": "stephan jaeger",
};

/**
 * Resolve golfer name to a normalized key for lookup.
 * Handles UTF-8 mojibake (e.g. Ã…→Å→a), diacritics, and aliases.
 */
export function resolveGolferNameForLookup(name: string): string {
	let s = normalizeGolferNameForMatch(name);
	// Fix common mojibake (UTF-8 read as Latin-1: Ã…=Å, Ã¤=ä, Ã¶=ö, Ã¸=ø)
	s = s
		.replace(/\u00c3\u00a5/gi, "a")
		.replace(/\u00c3\u00a4/gi, "a")
		.replace(/\u00c3\u00b6/gi, "o")
		.replace(/\u00c3\u00b8/gi, "o")
		.replace(/\u00c3\u00bc/gi, "u")
		.replace(/Ã…/gi, "a")
		.replace(/Ã¤/gi, "a")
		.replace(/Ã¶/gi, "o")
		.replace(/Ã¸/gi, "o")
		.replace(/Ã¼/gi, "u");
	return GOLFER_NAME_ALIASES[s] ?? s;
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
	const legacyIdsBySlug = new Map<string, string>([
		["sony-open-in-hawaii", "sony-open"],
		["the-american-express", "american-express"],
		["farmers-insurance-open", "farmers-insurance"],
		["wm-phoenix-open", "waste-management"],
		["at-and-t-pebble-beach-pro-am", "pebble-beach"],
		["genesis-invitational", "genesis-championship"],
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

		const slugifiedId = slugifyTournamentId(name);
		const id = legacyIdsBySlug.get(slugifiedId) ?? slugifiedId;

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
