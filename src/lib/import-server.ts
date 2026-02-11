import { createServerFn } from "@tanstack/react-start";
import type {
	ImportPreview,
	TournamentResult,
	TournamentValidationIssue,
} from "./csv-parser";
import { parseTournamentCSVWithDiagnostics } from "./csv-parser";
import { db } from "./db";
import { golfers, scoring, tournaments } from "./schema";
import { calculatePoints } from "./scoring";
import { requireServerRole } from "./server-functions";

async function previewImportData({
	data,
}: {
	data: {
		csvContent: string;
	};
}): Promise<ImportPreview> {
	const csvContent = data?.csvContent;
	if (typeof csvContent !== "string") {
		return {
			validRows: [],
			issues: [
				{
					rowNumber: 0,
					kind: "parse",
					severity: "error",
					code: "INVALID_PAYLOAD",
					message: "Invalid import payload. Expected CSV text content.",
				},
			],
			canCommit: false,
			summary: {
				totalRows: 0,
				validRows: 0,
				errors: 1,
				warnings: 0,
				unknownTournaments: [],
				unknownGolfers: [],
			},
		};
	}

	// First parse the CSV with diagnostics
	const parseResult = parseTournamentCSVWithDiagnostics(csvContent);

	// If there are parse errors, return early
	if (parseResult.issues.some((issue) => issue.severity === "error")) {
		return {
			validRows: [],
			issues: parseResult.issues,
			canCommit: false,
			summary: {
				totalRows:
					parseResult.rows.length +
					parseResult.issues.filter((i) => i.severity === "error").length,
				validRows: 0,
				errors: parseResult.issues.filter((i) => i.severity === "error").length,
				warnings: parseResult.issues.filter((i) => i.severity === "warning")
					.length,
				unknownTournaments: [],
				unknownGolfers: [],
			},
		} as ImportPreview;
	}

	// Get all tournaments and golfers for validation
	const allTournaments = await db.select().from(tournaments);
	const allGolfers = await db.select().from(golfers);

	const tournamentMap = new Map(
		allTournaments.map((t) => [t.id.toLowerCase(), t]),
	);
	const golferMap = new Map(allGolfers.map((g) => [g.name.toLowerCase(), g]));

	const validationIssues: TournamentValidationIssue[] = [];
	const unknownTournaments = new Set<string>();
	const unknownGolfers = new Set<string>();
	const validRows: TournamentResult[] = [];

	// Validate each row
	for (const row of parseResult.parsedRows) {
		const tournamentId = row.tournamentId.toLowerCase().trim();
		const golferName = row.golferName.toLowerCase().trim();

		// Check tournament exists
		if (!tournamentMap.has(tournamentId)) {
			unknownTournaments.add(row.tournamentId);
			validationIssues.push({
				rowNumber: row.rowNumber,
				kind: "validation",
				severity: "error",
				code: "UNKNOWN_TOURNAMENT",
				message: `Tournament "${row.tournamentId}" not found in database`,
				tournamentId: row.tournamentId,
			});
			continue;
		}

		// Check golfer exists
		if (!golferMap.has(golferName)) {
			unknownGolfers.add(row.golferName);
			validationIssues.push({
				rowNumber: row.rowNumber,
				kind: "validation",
				severity: "error",
				code: "UNKNOWN_GOLFER",
				message: `Golfer "${row.golferName}" not found in database`,
				golferName: row.golferName,
			});
			continue;
		}

		// Row is valid
		validRows.push({
			tournamentId: row.tournamentId,
			golferName: row.golferName,
			rank: row.rank,
		});
	}

	// Count errors and warnings
	const errors =
		parseResult.issues.filter((i) => i.severity === "error").length +
		validationIssues.filter((i) => i.severity === "error").length;
	const warnings =
		parseResult.issues.filter((i) => i.severity === "warning").length +
		validationIssues.filter((i) => i.severity === "warning").length;

	const preview: ImportPreview = {
		validRows,
		issues: [...parseResult.issues, ...validationIssues],
		canCommit: errors === 0,
		summary: {
			totalRows: parseResult.rows.length,
			validRows: validRows.length,
			errors,
			warnings,
			unknownTournaments: Array.from(unknownTournaments),
			unknownGolfers: Array.from(unknownGolfers),
		},
	};

	return preview;
}

export const previewImport = createServerFn({ method: "POST" }).handler(
	previewImportData,
);

async function commitImportData({
	data,
}: {
	data: {
		results: TournamentResult[];
	};
}): Promise<{ success: boolean; message: string; count: number }> {
	const results = data?.results;
	if (!Array.isArray(results)) {
		return {
			success: false,
			message: "Invalid import payload. Expected an array of results.",
			count: 0,
		};
	}

	// Check authorization first
	const authResult = await requireServerRole(["admin", "data"]);
	if (!authResult.success) {
		throw new Error("Unauthorized");
	}

	// Get all tournaments and golfers for mapping
	const allTournaments = await db.select().from(tournaments);
	const allGolfers = await db.select().from(golfers);

	const tournamentMap = new Map(
		allTournaments.map((t) => [t.id.toLowerCase(), t]),
	);
	const golferMap = new Map(allGolfers.map((g) => [g.name.toLowerCase(), g]));

	const processedResults = [];
	const errors: string[] = [];

	for (const result of results) {
		const tournamentId = result.tournamentId.toLowerCase().trim();
		const golferName = result.golferName.toLowerCase().trim();

		const tournament = tournamentMap.get(tournamentId);
		const golfer = golferMap.get(golferName);

		if (!tournament) {
			errors.push(`Tournament "${result.tournamentId}" not found`);
			continue;
		}

		if (!golfer) {
			errors.push(`Golfer "${result.golferName}" not found`);
			continue;
		}

		processedResults.push({
			...result,
			tournamentId: tournament.id,
			golferId: golfer.id,
			tournamentType: tournament.type,
		});
	}

	if (errors.length > 0) {
		return {
			success: false,
			message: `Validation failed: ${errors.join("; ")}`,
			count: 0,
		};
	}

	// Upsert scoring rows so re-imports update existing results for the same
	// tournament+golfer pair.
	for (const processed of processedResults) {
		const points = calculatePoints(processed.rank, processed.tournamentType);

		await db
			.insert(scoring)
			.values({
				id: `scoring-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				tournamentId: processed.tournamentId,
				golferId: processed.golferId,
				rank: processed.rank,
				points,
				createdAt: new Date(),
			})
			.onConflictDoUpdate({
				target: [scoring.tournamentId, scoring.golferId],
				set: {
					rank: processed.rank,
					points,
				},
			});
	}

	return {
		success: true,
		message: `Successfully imported ${processedResults.length} scoring records`,
		count: processedResults.length,
	};
}

export const commitImport = createServerFn({ method: "POST" }).handler(
	commitImportData,
);
