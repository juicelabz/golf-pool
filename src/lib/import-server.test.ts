import { describe, expect, it } from "vitest";
import {
	parseTournamentCSVWithDiagnostics,
	validateResults,
} from "./csv-parser";

describe("CSV Import Tests", () => {
	describe("parseTournamentCSVWithDiagnostics", () => {
		it("should parse valid CSV with headers", () => {
			const csv = [
				"TournamentID,GolferName,Rank",
				"sony-open,Tommy Fleetwood,1",
				"american-express,Rory McIlroy,2",
			].join("\n");

			const result = parseTournamentCSVWithDiagnostics(csv);

			expect(result.rows).toHaveLength(2);
			expect(result.rows[0]).toEqual({
				tournamentId: "sony-open",
				golferName: "Tommy Fleetwood",
				rank: 1,
			});
			expect(result.issues).toHaveLength(0);
		});

		it("should handle CSV without headers", () => {
			const csv = [
				"sony-open,Tommy Fleetwood,1",
				"american-express,Rory McIlroy,2",
			].join("\n");

			const result = parseTournamentCSVWithDiagnostics(csv);

			expect(result.rows).toHaveLength(2);
			expect(result.header).toBeUndefined();
		});

		it("should report parsing errors", () => {
			const csv = [
				"TournamentID,GolferName,Rank",
				"sony-open,Tommy Fleetwood,invalid",
				"american-express,,2",
			].join("\n");

			const result = parseTournamentCSVWithDiagnostics(csv);

			expect(result.rows).toHaveLength(0);
			expect(result.issues).toHaveLength(2);
			expect(result.issues.some((i) => i.code === "INVALID_RANK")).toBe(true);
			expect(
				result.issues.some((i) => i.code === "MISSING_REQUIRED_VALUE"),
			).toBe(true);
		});

		it("should handle malformed rows", () => {
			const csv = [
				"TournamentID,GolferName,Rank",
				"sony-open,Tommy Fleetwood",
				"american-express,Rory McIlroy,2,extra",
			].join("\n");

			const result = parseTournamentCSVWithDiagnostics(csv);

			expect(result.issues.some((i) => i.code === "MALFORMED_ROW")).toBe(true);
		});

		it("should handle quoted fields", () => {
			const csv = [
				"TournamentID,GolferName,Rank",
				'"sony-open","Tommy, Fleetwood",1',
				'"american-express","Rory ""The King"" McIlroy",2',
			].join("\n");

			const result = parseTournamentCSVWithDiagnostics(csv);

			expect(result.rows).toHaveLength(2);
			expect(result.rows[0].golferName).toBe("Tommy, Fleetwood");
			expect(result.rows[1].golferName).toBe('Rory "The King" McIlroy');
		});

		it("should handle empty files", () => {
			const result = parseTournamentCSVWithDiagnostics("\n\n");

			expect(result.rows).toHaveLength(0);
			expect(result.issues).toHaveLength(0);
		});
	});

	describe("validateResults", () => {
		it("should validate correct results", () => {
			const results = [
				{ tournamentId: "sony-open", golferName: "Tommy Fleetwood", rank: 1 },
				{
					tournamentId: "american-express",
					golferName: "Rory McIlroy",
					rank: 2,
				},
			];

			const validation = validateResults(results);

			expect(validation.valid).toBe(true);
			expect(validation.errors).toHaveLength(0);
			expect(validation.warnings).toHaveLength(0);
		});

		it("should detect missing required fields", () => {
			const results = [
				{ tournamentId: "", golferName: "Tommy Fleetwood", rank: 1 },
				{ tournamentId: "american-express", golferName: "", rank: 2 },
				{ tournamentId: "sony-open", golferName: "Max Homa", rank: 0 },
			] as any;

			const validation = validateResults(results);

			expect(validation.valid).toBe(false);
			expect(validation.errors).toHaveLength(1);
			expect(validation.errors[0]).toContain(
				"2 rows have missing required fields",
			);
		});

		it("should warn about ranks outside 1-10 range", () => {
			const results = [
				{ tournamentId: "sony-open", golferName: "Tommy Fleetwood", rank: 11 },
				{
					tournamentId: "american-express",
					golferName: "Rory McIlroy",
					rank: 0,
				},
			];

			const validation = validateResults(results);

			expect(validation.valid).toBe(true);
			expect(validation.errors).toHaveLength(0);
			expect(validation.warnings).toHaveLength(1);
			expect(validation.warnings[0]).toContain(
				"2 results have ranks outside 1-10 range",
			);
		});
	});

	describe("Import Integration Tests", () => {
		it("should handle complete import workflow", () => {
			// Test with realistic tournament data
			const csv = `TournamentID,GolferName,Rank
sony-open,Tommy Fleetwood,1
sony-open,Rory McIlroy,2
sony-open,Russell Henley,3
american-express,Justin Thomas,1
american-express,Sepp Straka,2
pebble-beach,Max Homa,1
pebble-beach,Tommy Fleetwood,11`;

			const parseResult = parseTournamentCSVWithDiagnostics(csv);
			const validation = validateResults(parseResult.rows);

			// Should parse all rows
			expect(parseResult.rows).toHaveLength(7);

			// Should have one warning for rank 11
			expect(
				parseResult.issues.filter((i) => i.severity === "warning"),
			).toHaveLength(1);
			expect(
				parseResult.issues.filter((i) => i.code === "RANK_OUT_OF_RANGE"),
			).toHaveLength(1);

			// Validation should pass but warn about out-of-range ranks
			expect(validation.valid).toBe(true);
			expect(validation.warnings).toHaveLength(1);
			expect(validation.warnings[0]).toContain(
				"1 results have ranks outside 1-10 range",
			);
		});

		it("should reject completely invalid data", () => {
			const csv = `TournamentID,GolferName,Rank
invalid,row,here
another,broken,row`;

			const parseResult = parseTournamentCSVWithDiagnostics(csv);
			const validation = validateResults(parseResult.rows);

			// Should have parsing errors but no valid rows to validate
			expect(
				parseResult.issues.filter((i) => i.severity === "error"),
			).toHaveLength(2);
			expect(parseResult.rows).toHaveLength(0);

			// With no valid rows, validation should pass
			const emptyValidation = validateResults(parseResult.rows);
			expect(emptyValidation.valid).toBe(true);
			expect(emptyValidation.errors).toHaveLength(0);
		});
	});
});
