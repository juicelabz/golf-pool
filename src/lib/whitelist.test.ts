import { describe, expect, it } from "vitest";
import { buildWhitelistSet, normalizeEmail } from "./whitelist";

describe("normalizeEmail", () => {
	it("trims and lowercases email values", () => {
		expect(normalizeEmail("  User@Example.COM  ")).toBe("user@example.com");
	});

	it("returns empty string for nullish values", () => {
		expect(normalizeEmail(undefined)).toBe("");
		expect(normalizeEmail(null)).toBe("");
	});
});

describe("buildWhitelistSet", () => {
	it("normalizes entries and supports exact match checks", () => {
		const whitelist = buildWhitelistSet([
			{ email: "  Allowed@Example.COM " },
			{ email: "" },
			{},
		]);

		expect(whitelist.has("allowed@example.com")).toBe(true);
		expect(whitelist.has(" allowed@example.com")).toBe(false);
		expect(whitelist.has("allowed@example.com ")).toBe(false);
		expect(whitelist.has("ALLOWED@EXAMPLE.COM")).toBe(false);
	});
});
