import { describe, expect, it } from "vitest";
import { resolvePostLoginRedirect } from "./auth-redirect";

describe("resolvePostLoginRedirect", () => {
	it("returns leaderboard by default", () => {
		expect(resolvePostLoginRedirect(undefined)).toBe("/leaderboard");
	});

	it("allows local redirects", () => {
		expect(resolvePostLoginRedirect("/admin")).toBe("/admin");
		expect(resolvePostLoginRedirect("/leaderboard?page=2#weekly")).toBe(
			"/leaderboard?page=2#weekly",
		);
	});

	it("blocks protocol-relative redirects", () => {
		expect(resolvePostLoginRedirect("//example.com")).toBe("/leaderboard");
	});

	it("blocks non-local redirects", () => {
		expect(resolvePostLoginRedirect("https://example.com")).toBe(
			"/leaderboard",
		);
		expect(resolvePostLoginRedirect("leaderboard")).toBe("/leaderboard");
	});
});
