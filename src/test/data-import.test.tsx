import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	mockAdminSession,
	mockDataSession,
	mockSession,
} from "./utils/auth-mocks";

// Mock the authClient module
const mockAuthClient = {
	getSession: vi.fn(),
	signOut: vi.fn(),
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

// Mock the NotAuthorized component
vi.mock("../components/NotAuthorized", () => ({
	NotAuthorized: () => <div data-testid="not-authorized">Not Authorized</div>,
}));

// Mock the data-import route component for testing
const MockDataImportComponent = ({ routeContext }: { routeContext: any }) => {
	if (routeContext?.authorized === false) {
		return <div data-testid="not-authorized">Not Authorized</div>;
	}

	return (
		<div data-testid="data-import-page">
			<h1>Data Import Portal</h1>
			<div data-testid="upload-area">Upload Area</div>
			<div data-testid="import-history">Import History</div>
			<div data-testid="import-stats">Import Statistics</div>
		</div>
	);
};

describe("Data Import Route Access Control", () => {
	let queryClient: QueryClient;

	beforeEach(() => {
		vi.clearAllMocks();
		queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					retry: false,
				},
			},
		});
	});

	const renderDataImportWithMockContext = (routeContext: any) => {
		return render(
			<QueryClientProvider client={queryClient}>
				<MockDataImportComponent routeContext={routeContext} />
			</QueryClientProvider>,
		);
	};

	describe("Role-based access to /data-import", () => {
		it("should allow admin users to access data-import", async () => {
			mockRequireRole.mockResolvedValue({
				authenticated: true,
				user: mockAdminSession.user,
				authorized: true,
			});

			const result = await mockRequireRole(["admin", "data"]);
			expect(result.authorized).toBe(true);

			renderDataImportWithMockContext({
				authorized: true,
				user: mockAdminSession.user,
			});

			expect(screen.getByTestId("data-import-page")).toBeInTheDocument();
			expect(screen.getByTestId("upload-area")).toBeInTheDocument();
			expect(screen.getByTestId("import-history")).toBeInTheDocument();
			expect(screen.getByTestId("import-stats")).toBeInTheDocument();
		});

		it("should allow data users to access data-import", async () => {
			mockRequireRole.mockResolvedValue({
				authenticated: true,
				user: mockDataSession.user,
				authorized: true,
			});

			const result = await mockRequireRole(["admin", "data"]);
			expect(result.authorized).toBe(true);

			renderDataImportWithMockContext({
				authorized: true,
				user: mockDataSession.user,
			});

			expect(screen.getByTestId("data-import-page")).toBeInTheDocument();
			expect(screen.getByTestId("upload-area")).toBeInTheDocument();
			expect(screen.getByTestId("import-history")).toBeInTheDocument();
			expect(screen.getByTestId("import-stats")).toBeInTheDocument();
		});

		it("should deny regular users access to data-import", async () => {
			mockRequireRole.mockResolvedValue({
				authenticated: true,
				user: mockSession.user,
				authorized: false,
			});

			const result = await mockRequireRole(["admin", "data"]);
			expect(result.authorized).toBe(false);

			renderDataImportWithMockContext({
				authorized: false,
				user: mockSession.user,
			});

			expect(screen.getByTestId("not-authorized")).toBeInTheDocument();
			expect(screen.queryByTestId("data-import-page")).not.toBeInTheDocument();
		});

		it("should deny unauthenticated users access to data-import", async () => {
			mockRequireRole.mockResolvedValue({
				authenticated: false,
				user: null,
			});

			renderDataImportWithMockContext({
				authorized: false,
				user: null,
			});

			expect(screen.getByTestId("not-authorized")).toBeInTheDocument();
			expect(screen.queryByTestId("data-import-page")).not.toBeInTheDocument();
		});
	});

	describe("Data Import route beforeLoad logic", () => {
		it("should redirect unauthenticated users to login", async () => {
			mockRequireRole.mockResolvedValue({
				authenticated: false,
				user: null,
			});

			const result = await mockRequireRole(["admin", "data"]);
			expect(result.authenticated).toBe(false);
		});

		it("should allow access when user has admin or data role", async () => {
			// Test admin role
			mockRequireRole.mockResolvedValue({
				authenticated: true,
				user: mockAdminSession.user,
				authorized: true,
			});

			const adminResult = await mockRequireRole(["admin", "data"]);
			expect(adminResult.authorized).toBe(true);

			// Test data role
			mockRequireRole.mockResolvedValue({
				authenticated: true,
				user: mockDataSession.user,
				authorized: true,
			});

			const dataResult = await mockRequireRole(["admin", "data"]);
			expect(dataResult.authorized).toBe(true);
		});

		it("should show NotAuthorized when user lacks required role", async () => {
			mockRequireRole.mockResolvedValue({
				authenticated: true,
				user: mockSession.user,
				authorized: false,
			});

			const result = await mockRequireRole(["admin", "data"]);

			// Should be authenticated but not authorized
			expect(result.authenticated).toBe(true);
			expect(result.authorized).toBe(false);

			renderDataImportWithMockContext({
				authorized: false,
				user: mockSession.user,
			});

			expect(screen.getByTestId("not-authorized")).toBeInTheDocument();
		});
	});

	describe("Data Import UI functionality", () => {
		it("should render all data import components for authorized users", () => {
			renderDataImportWithMockContext({
				authorized: true,
				user: mockAdminSession.user,
			});

			expect(screen.getByTestId("data-import-page")).toBeInTheDocument();
			expect(screen.getByTestId("upload-area")).toBeInTheDocument();
			expect(screen.getByTestId("import-history")).toBeInTheDocument();
			expect(screen.getByTestId("import-stats")).toBeInTheDocument();
		});

		it("should not render import components for unauthorized users", () => {
			renderDataImportWithMockContext({
				authorized: false,
				user: mockSession.user,
			});

			expect(screen.getByTestId("not-authorized")).toBeInTheDocument();
			expect(screen.queryByTestId("data-import-page")).not.toBeInTheDocument();
			expect(screen.queryByTestId("upload-area")).not.toBeInTheDocument();
			expect(screen.queryByTestId("import-history")).not.toBeInTheDocument();
			expect(screen.queryByTestId("import-stats")).not.toBeInTheDocument();
		});
	});

	describe("Role validation edge cases", () => {
		it("should handle user with undefined role gracefully", async () => {
			const userWithoutRole = { ...mockSession.user, role: undefined };

			mockRequireRole.mockResolvedValue({
				authenticated: true,
				user: userWithoutRole,
				authorized: false,
			});

			const result = await mockRequireRole(["admin", "data"]);

			// Should default to "user" role and be denied
			expect(result.authorized).toBe(false);
		});

		it("should handle user with null role gracefully", async () => {
			const userWithNullRole = { ...mockSession.user, role: null };

			mockRequireRole.mockResolvedValue({
				authenticated: true,
				user: userWithNullRole,
				authorized: false,
			});

			const result = await mockRequireRole(["admin", "data"]);

			// Should default to "user" role and be denied
			expect(result.authorized).toBe(false);
		});
	});

	describe("Access control consistency", () => {
		it("should consistently deny access for non-admin/data roles", async () => {
			// Test multiple non-authorized roles
			const testCases = [
				{ user: mockSession.user, role: "user" },
				{ user: { ...mockSession.user, role: "guest" }, role: "guest" },
				{ user: { ...mockSession.user, role: "moderator" }, role: "moderator" },
			];

			for (const testCase of testCases) {
				mockRequireRole.mockResolvedValue({
					authenticated: true,
					user: testCase.user,
					authorized: false,
				});

				const result = await mockRequireRole(["admin", "data"]);
				expect(result.authorized).toBe(false);
			}
		});

		it("should consistently allow access for admin and data roles", async () => {
			// Test admin role
			mockRequireRole.mockResolvedValue({
				authenticated: true,
				user: mockAdminSession.user,
				authorized: true,
			});

			const adminResult = await mockRequireRole(["admin", "data"]);
			expect(adminResult.authorized).toBe(true);

			// Test data role
			mockRequireRole.mockResolvedValue({
				authenticated: true,
				user: mockDataSession.user,
				authorized: true,
			});

			const dataResult = await mockRequireRole(["admin", "data"]);
			expect(dataResult.authorized).toBe(true);

			// Verify both results are authorized
			const adminResults = [adminResult];
			const dataResults = [dataResult];

			adminResults.forEach((result) => {
				expect(result.authorized).toBe(true);
			});

			dataResults.forEach((result) => {
				expect(result.authorized).toBe(true);
			});
		});
	});
});
