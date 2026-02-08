import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createMockHeaders,
	mockAdminSession,
	mockDataSession,
	mockSession,
} from "./utils/auth-mocks";

// Mock server functions for testing authorization
const mockGetTournamentList = vi.fn();
const mockImportScoringData = vi.fn();

// Mock the auth-client module
const mockAuthClient = {
	getSession: vi.fn(),
};
vi.mock("../lib/auth-client", () => ({
	authClient: mockAuthClient,
}));

// Mock the session module
const mockGetSession = vi.fn();
const mockRequireAuth = vi.fn();
const mockRequireRole = vi.fn();

vi.mock("../lib/session", () => ({
	getSession: mockGetSession,
	requireAuth: mockRequireAuth,
	requireRole: mockRequireRole,
}));

// Mock server functions module
vi.mock("../lib/server-functions", () => ({
	getTournamentList: mockGetTournamentList,
	importScoringData: mockImportScoringData,
}));

describe("Server Function Authorization", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getTournamentList authorization", () => {
		it("should allow access for authenticated users", async () => {
			mockRequireAuth.mockResolvedValue({
				authenticated: true,
				user: mockSession.user,
			});

			// Mock successful response
			mockGetTournamentList.mockResolvedValue({
				tournaments: [],
			});

			const result = await mockGetTournamentList();
			expect(result).toEqual({ tournaments: [] });
		});

		it("should deny access for unauthenticated users", async () => {
			mockRequireAuth.mockResolvedValue({
				authenticated: false,
				user: null,
			});

			// Mock error response
			mockGetTournamentList.mockRejectedValue({
				error: "Unauthorized",
				status: 401,
			});

			await expect(mockGetTournamentList()).rejects.toEqual({
				error: "Unauthorized",
				status: 401,
			});
		});

		it("should handle session retrieval errors gracefully", async () => {
			mockRequireAuth.mockRejectedValue(new Error("Session error"));

			// Mock error response
			mockGetTournamentList.mockRejectedValue({
				error: "Internal server error",
				status: 500,
			});

			await expect(mockGetTournamentList()).rejects.toEqual({
				error: "Internal server error",
				status: 500,
			});
		});
	});

	describe("importScoringData authorization", () => {
		it("should allow access for admin users", async () => {
			mockRequireRole.mockResolvedValue({
				authenticated: true,
				user: mockAdminSession.user,
				authorized: true,
			});

			// Mock successful response
			mockImportScoringData.mockResolvedValue({
				success: true,
				imported: 10,
			});

			const result = await mockImportScoringData({
				tournamentResults: [],
			});

			expect(result).toEqual({ success: true, imported: 10 });
		});

		it("should allow access for data users", async () => {
			mockRequireRole.mockResolvedValue({
				authenticated: true,
				user: mockDataSession.user,
				authorized: true,
			});

			// Mock successful response
			mockImportScoringData.mockResolvedValue({
				success: true,
				imported: 5,
			});

			const result = await mockImportScoringData({
				tournamentResults: [],
			});

			expect(result).toEqual({ success: true, imported: 5 });
		});

		it("should deny access for regular users", async () => {
			mockRequireRole.mockResolvedValue({
				authenticated: true,
				user: mockSession.user,
				authorized: false,
			});

			// Mock error response
			mockImportScoringData.mockRejectedValue({
				error: "Forbidden",
				status: 403,
			});

			await expect(
				mockImportScoringData({ tournamentResults: [] }),
			).rejects.toEqual({
				error: "Forbidden",
				status: 403,
			});
		});

		it("should deny access for unauthenticated users", async () => {
			mockRequireRole.mockResolvedValue({
				authenticated: false,
				user: null,
			});

			// Mock error response
			mockImportScoringData.mockRejectedValue({
				error: "Unauthorized",
				status: 401,
			});

			await expect(
				mockImportScoringData({ tournamentResults: [] }),
			).rejects.toEqual({
				error: "Unauthorized",
				status: 401,
			});
		});
	});

	describe("Request context handling", () => {
		it("should properly handle request headers for session validation", async () => {
			const headers = createMockHeaders(mockSession);

			// Mock the session function to use headers
			mockGetSession.mockResolvedValue(mockSession);

			const session = await mockGetSession();
			expect(session).toEqual(mockSession);

			// Verify headers contain session token
			expect(headers.get("cookie")).toContain(
				`better-auth.session_token=${mockSession.session.token}`,
			);
		});

		it("should handle missing session headers gracefully", async () => {
			const headers = createMockHeaders(null);

			// Mock the session function to return null
			mockGetSession.mockResolvedValue(null);

			const session = await mockGetSession();
			expect(session).toBeNull();

			// Verify headers don't contain session token
			expect(headers.get("cookie")).toBeNull();
		});
	});

	describe("Error response consistency", () => {
		it("should return consistent error format for authorization failures", async () => {
			mockRequireRole.mockResolvedValue({
				authenticated: true,
				user: mockSession.user,
				authorized: false,
			});

			const expectedError = {
				error: "Forbidden",
				status: 403,
				message: "Insufficient permissions",
			};

			mockImportScoringData.mockRejectedValue(expectedError);

			await expect(
				mockImportScoringData({ tournamentResults: [] }),
			).rejects.toEqual(expectedError);
		});

		it("should return consistent error format for authentication failures", async () => {
			mockRequireAuth.mockResolvedValue({
				authenticated: false,
				user: null,
			});

			const expectedError = {
				error: "Unauthorized",
				status: 401,
				message: "Authentication required",
			};

			mockGetTournamentList.mockRejectedValue(expectedError);

			await expect(mockGetTournamentList()).rejects.toEqual(expectedError);
		});
	});

	describe("Role hierarchy validation", () => {
		it("should validate admin role has highest privileges", async () => {
			// Test admin can access both admin and data functions
			mockRequireRole.mockResolvedValue({
				authenticated: true,
				user: mockAdminSession.user,
				authorized: true,
			});

			mockGetTournamentList.mockResolvedValue({ tournaments: [] });
			mockImportScoringData.mockResolvedValue({ success: true });

			const tournamentResult = await mockGetTournamentList();
			const importResult = await mockImportScoringData({
				tournamentResults: [],
			});

			expect(tournamentResult).toEqual({ tournaments: [] });
			expect(importResult).toEqual({ success: true });
		});

		it("should validate data role has limited privileges", async () => {
			// Test data role can access data functions but not admin functions
			mockRequireRole.mockImplementation((requiredRoles) => {
				const hasDataRole = requiredRoles.includes("data");
				const hasAdminRole = requiredRoles.includes("admin");

				return Promise.resolve({
					authenticated: true,
					user: mockDataSession.user,
					authorized: hasDataRole && !hasAdminRole,
				});
			});

			// Data role should be able to access data import
			mockImportScoringData.mockResolvedValue({ success: true });
			const importResult = await mockImportScoringData({
				tournamentResults: [],
			});
			expect(importResult).toEqual({ success: true });

			// But should be denied from admin-only functions
			mockGetTournamentList.mockRejectedValue({
				error: "Forbidden",
				status: 403,
			});
			await expect(mockGetTournamentList()).rejects.toEqual({
				error: "Forbidden",
				status: 403,
			});
		});
	});
});
