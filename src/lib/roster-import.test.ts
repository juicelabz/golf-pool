import { describe, expect, it } from "vitest";
import {
	normalizeGolferNameForMatch,
	parseTeamRostersCSV,
	resolveGolferNameForLookup,
} from "./import-utils";

describe("parseTeamRostersCSV", () => {
	it("parses team-rosters.csv and returns entries for all members", () => {
		const entries = parseTeamRostersCSV("./data/team-rosters.csv");
		expect(entries.length).toBeGreaterThanOrEqual(100);
		expect(
			entries.every((e) => Object.keys(e.golfersByCategory).length === 10),
		).toBe(true);
	});

	it("Cody Kuykendall spot-check: exact roster match", () => {
		const entries = parseTeamRostersCSV("./data/team-rosters.csv");
		const cody = entries.find(
			(e) => e.memberName.toLowerCase() === "cody kuykendall",
		);
		expect(cody).toBeDefined();
		if (!cody) return;
		const expected = [
			"Rory McIlroy",
			"Keegan Bradley",
			"Ludvig Aberg",
			"Ben Griffin",
			"Ryan Fox",
			"Kurt Kitayama",
			"Nico Echavarria",
			"Brooks Koepka",
			"Michael Thorbjornsen",
			"Pierceson Coody",
		];
		for (let cat = 1; cat <= 10; cat++) {
			expect(cody.golfersByCategory[cat]).toBe(expected[cat - 1]);
		}
	});

	it("Josh Gelles spot-check: exact roster match", () => {
		const entries = parseTeamRostersCSV("./data/team-rosters.csv");
		const josh = entries.find(
			(e) => e.memberName.toLowerCase() === "josh gelles",
		);
		expect(josh).toBeDefined();
		if (!josh) return;
		const expected = [
			"Rory McIlroy",
			"Cameron Young",
			"Ludvig Aberg",
			"Chris Gotterup",
			"Matt Fitzpatrick",
			"Aldrich Potgieter",
			"Max McGreevy",
			"Brooks Koepka",
			"Michael Thorbjornsen",
			"Erik van Rooyen",
		];
		for (let cat = 1; cat <= 10; cat++) {
			expect(josh.golfersByCategory[cat]).toBe(expected[cat - 1]);
		}
	});

	it("CJ Maisenbacher spot-check: exact roster match", () => {
		const entries = parseTeamRostersCSV("./data/team-rosters.csv");
		const cj = entries.find(
			(e) => e.memberName.toLowerCase() === "cj maisenbacher",
		);
		expect(cj).toBeDefined();
		if (!cj) return;
		const expected = [
			"Tommy Fleetwood",
			"Cameron Young",
			"Sam Burns",
			"Ben Griffin",
			"Matt Fitzpatrick",
			"Jordan Spieth",
			"Rico Hoey",
			"Rasmus Hojgaard",
			"Michael Thorbjornsen",
			"Max Homa",
		];
		for (let cat = 1; cat <= 10; cat++) {
			expect(cj.golfersByCategory[cat]).toBe(expected[cat - 1]);
		}
	});
});

describe("normalizeGolferNameForMatch", () => {
	it("strips diacritics and lowercases", () => {
		expect(normalizeGolferNameForMatch("Ludvig Åberg")).toBe("ludvig aberg");
		expect(normalizeGolferNameForMatch("Rasmus Højgaard")).toBe(
			"rasmus hojgaard",
		);
	});

	it("collapses whitespace", () => {
		expect(normalizeGolferNameForMatch("  Rory   McIlroy  ")).toBe(
			"rory mcilroy",
		);
	});
});

describe("resolveGolferNameForLookup", () => {
	it("applies aliases for common variants", () => {
		expect(resolveGolferNameForLookup("Cam Young")).toBe("cameron young");
		expect(resolveGolferNameForLookup("Cameron Young")).toBe("cameron young");
	});

	it("normalizes special characters", () => {
		expect(resolveGolferNameForLookup("Ludvig Aberg")).toBe("ludvig aberg");
		expect(resolveGolferNameForLookup("Ludvig Åberg")).toBe("ludvig aberg");
	});
});
