import { describe, expect, it } from "vitest";
import { parseTournamentCSVWithDiagnostics } from "./csv-parser";

describe("parseTournamentCSVWithDiagnostics", () => {
	it("parses rows with a header and reports row-level issues", () => {
		const csv = [
			"TournamentID,GolferName,Rank",
			"sony-open,Tommy Fleetwood,1",
			"american-express,,2",
			"pebble-beach,Rory McIlroy,abc",
			"farmers-insurance,Max Homa,11",
		].join("\n");

		const result = parseTournamentCSVWithDiagnostics(csv);

		expect(result.rows).toEqual([
			{ tournamentId: "sony-open", golferName: "Tommy Fleetwood", rank: 1 },
			{ tournamentId: "farmers-insurance", golferName: "Max Homa", rank: 11 },
		]);

		expect(result.issues).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					rowNumber: 3,
					kind: "parse",
					severity: "error",
					code: "MISSING_REQUIRED_VALUE",
				}),
				expect.objectContaining({
					rowNumber: 4,
					kind: "parse",
					severity: "error",
					code: "INVALID_RANK",
				}),
				expect.objectContaining({
					rowNumber: 5,
					kind: "validation",
					severity: "warning",
					code: "RANK_OUT_OF_RANGE",
				}),
			]),
		);
	});

	it("falls back to positional parsing if a header is missing required columns", () => {
		const csv = [
			"TournamentID,Golfer,Rank",
			"sony-open,Tommy Fleetwood,1",
		].join("\n");

		const result = parseTournamentCSVWithDiagnostics(csv);

		expect(result.rows).toEqual([
			{ tournamentId: "sony-open", golferName: "Tommy Fleetwood", rank: 1 },
		]);
		expect(result.issues).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					rowNumber: 1,
					kind: "parse",
					severity: "error",
					code: "MISSING_REQUIRED_COLUMNS",
				}),
			]),
		);
	});

	it("returns empty results for an empty file", () => {
		const result = parseTournamentCSVWithDiagnostics("\n\n");
		expect(result.rows).toEqual([]);
		expect(result.issues).toEqual([]);
	});
});
