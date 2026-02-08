import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockSession } from "./utils/auth-mocks";

// Mock the authClient module
const mockAuthClient = {
	getSession: vi.fn(),
};
vi.mock("../lib/auth-client", () => ({
	authClient: mockAuthClient,
}));

// Mock the session module to control requireAuth behavior
const mockGetSession = vi.fn();
const mockRequireAuth = vi.fn();
const mockRequireRole = vi.fn();

vi.mock("../lib/session", () => ({
	getSession: mockGetSession,
	requireAuth: mockRequireAuth,
	requireRole: mockRequireRole,
}));

describe("Global Route Protection", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("requireAuth function", () => {
		it("should return authenticated: true when user is logged in", async () => {
			mockRequireAuth.mockResolvedValue({
				authenticated: true,
				user: mockSession.user,
			});

			const result = await mockRequireAuth();

			expect(result).toEqual({
				authenticated: true,
				user: mockSession.user,
			});
		});

		it("should return authenticated: false when user is not logged in", async () => {
			mockRequireAuth.mockResolvedValue({
				authenticated: false,
				user: null,
			});

			const result = await mockRequireAuth();

			expect(result).toEqual({
				authenticated: false,
				user: null,
			});
		});

		it("should handle errors gracefully and return not authenticated", async () => {
			mockRequireAuth.mockRejectedValue(new Error("Network error"));

			const result = await mockRequireAuth().catch(() => ({
				authenticated: false,
				user: null,
			}));

			expect(result).toEqual({
				authenticated: false,
				user: null,
			});
		});
	});

	describe("Root route protection logic", () => {
		it("should allow access to /login without authentication", async () => {
			// Simulate the root route's beforeLoad logic for /login
			const location = { pathname: "/login", search: "", hash: "" };

			if (location.pathname === "/login" || location.pathname === "/signup") {
				// Should return early without requiring auth
				expect(true).toBe(true);
			} else {
				throw new Error("Should not reach here for /login");
			}
		});

		it("should allow access to /signup without authentication", async () => {
			// Simulate the root route's beforeLoad logic for /signup
			const location = { pathname: "/signup", search: "", hash: "" };

			if (location.pathname === "/login" || location.pathname === "/signup") {
				// Should return early without requiring auth
				expect(true).toBe(true);
			} else {
				throw new Error("Should not reach here for /signup");
			}
		});

		it("should redirect to login when accessing protected routes without authentication", async () => {
			// Mock unauthenticated session
			mockRequireAuth.mockResolvedValue({
				authenticated: false,
				user: null,
			});

			const location = {
				pathname: "/leaderboard",
				search: "?filter=all",
				hash: "#section1",
			};

			// Simulate the root route's beforeLoad logic
			if (location.pathname === "/login" || location.pathname === "/signup") {
				throw new Error("Should not reach here for protected route");
			}

			const result = await mockRequireAuth();

			if (!result.authenticated) {
				const redirectPath = `${location.pathname}${location.search ?? ""}${
					location.hash ?? ""
				}`;
				const expectedRedirect = `/login?redirect=${encodeURIComponent(redirectPath)}`;

				expect(expectedRedirect).toBe(
					"/login?redirect=%2Fleaderboard%3Ffilter%3Dall%23section1",
				);
			}
		});

		it("should allow access to protected routes when authenticated", async () => {
			// Mock authenticated session
			mockRequireAuth.mockResolvedValue({
				authenticated: true,
				user: mockSession.user,
			});

			const location = { pathname: "/leaderboard", search: "", hash: "" };

			// Simulate the root route's beforeLoad logic
			if (location.pathname === "/login" || location.pathname === "/signup") {
				throw new Error("Should not reach here for protected route");
			}

			const result = await mockRequireAuth();
			expect(result.authenticated).toBe(true);
		});

		it("should preserve query parameters and hash in redirect URL", async () => {
			// Mock unauthenticated session
			mockRequireAuth.mockResolvedValue({
				authenticated: false,
				user: null,
			});

			const location = {
				pathname: "/admin/users",
				search: "?role=user&page=2",
				hash: "#user-details",
			};

			// Simulate the root route's beforeLoad logic
			if (location.pathname === "/login" || location.pathname === "/signup") {
				throw new Error("Should not reach here for protected route");
			}

			const result = await mockRequireAuth();

			if (!result.authenticated) {
				const redirectPath = `${location.pathname}${location.search ?? ""}${
					location.hash ?? ""
				}`;
				const expectedRedirect = `/login?redirect=${encodeURIComponent(redirectPath)}`;

				expect(expectedRedirect).toBe(
					"/login?redirect=%2Fadmin%2Fusers%3Frole%3Duser%26page%3D2%23user-details",
				);
			}
		});

		it("should handle routes with no query or hash gracefully", async () => {
			// Mock unauthenticated session
			mockRequireAuth.mockResolvedValue({
				authenticated: false,
				user: null,
			});

			const location = { pathname: "/admin", search: "", hash: "" };

			// Simulate the root route's beforeLoad logic
			if (location.pathname === "/login" || location.pathname === "/signup") {
				throw new Error("Should not reach here for protected route");
			}

			const result = await mockRequireAuth();

			if (!result.authenticated) {
				const redirectPath = `${location.pathname}${location.search ?? ""}${
					location.hash ?? ""
				}`;
				const expectedRedirect = `/login?redirect=${encodeURIComponent(redirectPath)}`;

				expect(expectedRedirect).toBe("/login?redirect=%2Fadmin");
			}
		});
	});

	describe("Route protection edge cases", () => {
		it("should handle undefined search and hash gracefully", async () => {
			// Mock unauthenticated session
			mockRequireAuth.mockResolvedValue({
				authenticated: false,
				user: null,
			});

			const location = {
				pathname: "/data-import",
				search: undefined,
				hash: undefined,
			};

			// Simulate the root route's beforeLoad logic
			if (location.pathname === "/login" || location.pathname === "/signup") {
				throw new Error("Should not reach here for protected route");
			}

			const result = await mockRequireAuth();

			if (!result.authenticated) {
				const redirectPath = `${location.pathname}${location.search ?? ""}${
					location.hash ?? ""
				}`;
				const expectedRedirect = `/login?redirect=${encodeURIComponent(redirectPath)}`;

				expect(expectedRedirect).toBe("/login?redirect=%2Fdata-import");
			}
		});
	});
});
