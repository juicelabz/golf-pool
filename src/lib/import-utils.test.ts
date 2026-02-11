import { describe, expect, it } from "vitest";
import { parseTournamentsCSV } from "./import-utils";

describe("parseTournamentsCSV (schedule)", () => {
	it("parses all tournaments from SCHEDULE_OF_EVENTS.md", () => {
		const tournaments = parseTournamentsCSV();

		// SCHEDULE_OF_EVENTS.md currently lists 33 events across 5 segments.
		expect(tournaments).toHaveLength(33);

		const byId = new Map(tournaments.map((t) => [t.id, t]));

		expect(byId.get("sony-open")).toMatchObject({
			type: "Standard",
			segment: 1,
			startDate: "2026-01-15",
			endDate: "2026-01-18",
		});

		expect(byId.get("pebble-beach")).toMatchObject({
			type: "Double",
			segment: 1,
			startDate: "2026-02-12",
			endDate: "2026-02-15",
		});

		expect(byId.get("genesis-championship")).toMatchObject({
			type: "Double",
			segment: 1,
			startDate: "2026-02-19",
			endDate: "2026-02-22",
		});

		expect(byId.get("cognizant-classic")).toMatchObject({
			type: "Standard",
			segment: 1,
			startDate: "2026-02-26",
			endDate: "2026-03-01",
		});
	});
});
