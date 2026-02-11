export interface TournamentResult {
	tournamentId: string;
	golferName: string;
	rank: number;
}

export type CSVRowIssueSeverity = "error" | "warning";
export type CSVRowIssueKind = "parse" | "validation";

export interface CSVRowIssue {
	// 1-based row number in the provided CSV content (including headers).
	rowNumber: number;
	kind: CSVRowIssueKind;
	severity: CSVRowIssueSeverity;
	code: string;
	message: string;
	rawRow?: string;
	cells?: string[];
}

export type TournamentValidationIssue = CSVRowIssue & {
	kind: "validation";
	tournamentId?: string;
	golferName?: string;
};

export type ImportPreview = {
	validRows: TournamentResult[];
	issues: Array<CSVRowIssue | TournamentValidationIssue>;
	canCommit: boolean;
	summary: {
		totalRows: number;
		validRows: number;
		errors: number;
		warnings: number;
		unknownTournaments: string[];
		unknownGolfers: string[];
	};
};

export type ParseTournamentCSVResult = {
	rows: TournamentResult[];
	parsedRows: Array<
		TournamentResult & { rowNumber: number; rawRow?: string; cells?: string[] }
	>;
	issues: CSVRowIssue[];
	header?: string[];
};

function normalizeHeaderCell(value: string): string {
	return value.toLowerCase().replace(/\s+/g, "");
}

function parseRankValue(rankStr: string): number | null {
	const trimmed = rankStr.trim();

	// Support golf tie notation like "T2" and "2T" in addition to plain "2".
	const tieMatch = trimmed.match(/^(?:[Tt]\s*)?(\d+)(?:\s*[Tt])?$/);
	if (!tieMatch) {
		return null;
	}

	const rank = Number.parseInt(tieMatch[1] ?? "", 10);
	return Number.isNaN(rank) ? null : rank;
}

// Minimal RFC4180-style parser (quotes + escaped double quotes). Good enough for our expected inputs,
// and provides deterministic row/cell handling for diagnostics.
function splitCSVLine(line: string): string[] {
	const out: string[] = [];
	let cell = "";
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const ch = line[i];

		if (ch === '"') {
			// Escaped quote inside a quoted field.
			if (inQuotes && line[i + 1] === '"') {
				cell += '"';
				i++;
				continue;
			}
			inQuotes = !inQuotes;
			continue;
		}

		if (ch === "," && !inQuotes) {
			out.push(cell.trim());
			cell = "";
			continue;
		}

		cell += ch;
	}

	out.push(cell.trim());
	return out;
}

export function parseTournamentCSVWithDiagnostics(
	csvContent: string,
): ParseTournamentCSVResult {
	const rawLines = csvContent.split(/\r?\n/);
	const nonEmptyLines = rawLines
		.map((rawRow, i) => ({ rawRow, rowNumber: i + 1 }))
		.filter((l) => l.rawRow.trim().length > 0);

	if (nonEmptyLines.length === 0) {
		return { rows: [], parsedRows: [], issues: [] };
	}

	const issues: CSVRowIssue[] = [];
	const rows: TournamentResult[] = [];
	const parsedRows: Array<
		TournamentResult & { rowNumber: number; rawRow?: string; cells?: string[] }
	> = [];

	const requiredHeaders = ["tournamentid", "golfername", "rank"] as const;

	const first = nonEmptyLines[0];
	const firstCells = splitCSVLine(first.rawRow);
	const normalizedFirstCells = firstCells.map(normalizeHeaderCell);

	const looksLikeHeader = normalizedFirstCells.some((cell) =>
		requiredHeaders.includes(cell as (typeof requiredHeaders)[number]),
	);

	let header: string[] | undefined;
	let indices = { tournamentId: 0, golferName: 1, rank: 2 };
	let startAt = 0;

	if (looksLikeHeader) {
		header = firstCells;
		startAt = 1;

		const headerIndex = new Map<string, number>();
		for (let i = 0; i < firstCells.length; i++) {
			headerIndex.set(normalizeHeaderCell(firstCells[i] ?? ""), i);
		}

		const missing = requiredHeaders.filter((h) => !headerIndex.has(h));
		if (missing.length > 0) {
			issues.push({
				rowNumber: first.rowNumber,
				kind: "parse",
				severity: "error",
				code: "MISSING_REQUIRED_COLUMNS",
				message: `Missing required column(s): ${missing.join(", ")}.`,
				rawRow: first.rawRow,
				cells: firstCells,
			});
			// Fall back to positional parsing to still provide row-level diagnostics.
		} else {
			indices = {
				tournamentId: headerIndex.get("tournamentid") ?? 0,
				golferName: headerIndex.get("golfername") ?? 1,
				rank: headerIndex.get("rank") ?? 2,
			};
		}
	}

	const expectedMinColumns =
		Math.max(indices.tournamentId, indices.golferName, indices.rank) + 1;

	for (let i = startAt; i < nonEmptyLines.length; i++) {
		const { rawRow, rowNumber } = nonEmptyLines[i];
		const cells = splitCSVLine(rawRow);

		if (cells.length < expectedMinColumns) {
			issues.push({
				rowNumber,
				kind: "parse",
				severity: "error",
				code: "MALFORMED_ROW",
				message: `Malformed row: expected at least ${expectedMinColumns} columns.`,
				rawRow,
				cells,
			});
			continue;
		}

		const tournamentId = (cells[indices.tournamentId] ?? "").trim();
		const golferName = (cells[indices.golferName] ?? "").trim();
		const rankStr = (cells[indices.rank] ?? "").trim();

		const missingFields: string[] = [];
		if (!tournamentId) missingFields.push("TournamentID");
		if (!golferName) missingFields.push("GolferName");
		if (!rankStr) missingFields.push("Rank");

		if (missingFields.length > 0) {
			issues.push({
				rowNumber,
				kind: "parse",
				severity: "error",
				code: "MISSING_REQUIRED_VALUE",
				message: `Missing required value(s): ${missingFields.join(", ")}.`,
				rawRow,
				cells,
			});
			continue;
		}

		const rank = parseRankValue(rankStr);
		if (rank === null) {
			issues.push({
				rowNumber,
				kind: "parse",
				severity: "error",
				code: "INVALID_RANK",
				message: `Invalid Rank value: "${rankStr}".`,
				rawRow,
				cells,
			});
			continue;
		}

		const parsedRow = {
			tournamentId,
			golferName,
			rank,
			rowNumber,
			rawRow,
			cells,
		};
		parsedRows.push(parsedRow);
		rows.push({ tournamentId, golferName, rank });

		// Domain validation warnings/errors are separate from parse errors.
		if (rank < 1 || rank > 10) {
			issues.push({
				rowNumber,
				kind: "validation",
				severity: "warning",
				code: "RANK_OUT_OF_RANGE",
				message: "Rank is outside the expected 1-10 range.",
				rawRow,
				cells,
			});
		}
	}

	return { rows, parsedRows, issues, header };
}

export function parseTournamentCSV(csvContent: string): TournamentResult[] {
	return parseTournamentCSVWithDiagnostics(csvContent).rows;
}

export function validateResults(results: TournamentResult[]): {
	valid: boolean;
	errors: string[];
	warnings: string[];
} {
	const errors: string[] = [];
	const warnings: string[] = [];

	// Check for required fields
	const requiredFields = results.filter(
		(r) => !r.tournamentId || !r.golferName || r.rank === undefined,
	);

	if (requiredFields.length > 0) {
		errors.push(`${requiredFields.length} rows have missing required fields`);
	}

	// Validate ranks
	const invalidRanks = results.filter((r) => r.rank < 1 || r.rank > 10);
	if (invalidRanks.length > 0) {
		warnings.push(
			`${invalidRanks.length} results have ranks outside 1-10 range`,
		);
	}

	return {
		valid: errors.length === 0,
		errors,
		warnings,
	};
}

export function getCSVTemplate(): string {
	return `TournamentID,GolferName,Rank
sony-open,Tommy Fleetwood,1
sony-open,Rory McIlroy,2
sony-open,Russell Henley,3
american-express,Justin Thomas,1
american-express,Sepp Straka,2
...`;
}
