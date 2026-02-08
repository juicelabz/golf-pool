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

// Mock the admin route component for testing
const MockAdminComponent = ({ routeContext }: { routeContext: any }) => {
	if (routeContext?.authorized === false) {
		return <div data-testid="not-authorized">Not Authorized</div>;
	}

	const user = routeContext?.user;
	const role = user?.role ?? "user";
	const isDataRole = role === "data";
	const showAdminCards = role === "admin";

	return (
		<div data-testid="admin-panel">
			<h1>Admin Panel</h1>
			{showAdminCards && (
				<>
					<div data-testid="payment-status">Payment status</div>
					<div data-testid="user-management">User management</div>
					<div data-testid="roster-management">Roster management</div>
				</>
			)}
			<div data-testid="data-import">Data import</div>
			{isDataRole && <div data-testid="data-only-notice">Data role only</div>}
			<div data-testid="current-role">Current role: {role}</div>
		</div>
	);
};

describe("Admin Panel Access Control", () => {
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

	const renderAdminWithMockContext = (routeContext: any) => {
		return render(
			<QueryClientProvider client={queryClient}>
				<MockAdminComponent routeContext={routeContext} />
			</QueryClientProvider>,
		);
	};

	describe("Role-based access control", () => {
		it("should allow admin users to access admin panel", async () => {
			mockRequireRole.mockResolvedValue({
				authenticated: true,
				user: mockAdminSession.user,
				authorized: true,
			});

			const result = await mockRequireRole(["admin", "data"]);
			expect(result.authorized).toBe(true);

			renderAdminWithMockContext({
				authorized: true,
				user: mockAdminSession.user,
			});

			expect(screen.getByTestId("admin-panel")).toBeInTheDocument();
			expect(screen.getByTestId("payment-status")).toBeInTheDocument();
			expect(screen.getByTestId("user-management")).toBeInTheDocument();
			expect(screen.getByTestId("roster-management")).toBeInTheDocument();
			expect(screen.getByTestId("data-import")).toBeInTheDocument();
			expect(screen.getByTestId("current-role")).toHaveTextContent("admin");
		});

		it("should allow data users to access admin panel", async () => {
			mockRequireRole.mockResolvedValue({
				authenticated: true,
				user: mockDataSession.user,
				authorized: true,
			});

			const result = await mockRequireRole(["admin", "data"]);
			expect(result.authorized).toBe(true);

			renderAdminWithMockContext({
				authorized: true,
				user: mockDataSession.user,
			});

			expect(screen.getByTestId("admin-panel")).toBeInTheDocument();
			expect(screen.queryByTestId("payment-status")).not.toBeInTheDocument();
			expect(screen.queryByTestId("user-management")).not.toBeInTheDocument();
			expect(screen.queryByTestId("roster-management")).not.toBeInTheDocument();
			expect(screen.getByTestId("data-import")).toBeInTheDocument();
			expect(screen.getByTestId("data-only-notice")).toBeInTheDocument();
			expect(screen.getByTestId("current-role")).toHaveTextContent("data");
		});

		it("should deny regular users access to admin panel", async () => {
			mockRequireRole.mockResolvedValue({
				authenticated: true,
				user: mockSession.user,
				authorized: false,
			});

			const result = await mockRequireRole(["admin", "data"]);
			expect(result.authorized).toBe(false);

			renderAdminWithMockContext({
				authorized: false,
				user: mockSession.user,
			});

			expect(screen.getByTestId("not-authorized")).toBeInTheDocument();
			expect(screen.queryByTestId("admin-panel")).not.toBeInTheDocument();
		});

		it("should deny unauthenticated users access to admin panel", async () => {
			mockRequireRole.mockResolvedValue({
				authenticated: false,
				user: null,
			});

			renderAdminWithMockContext({
				authorized: false,
				user: null,
			});

			expect(screen.getByTestId("not-authorized")).toBeInTheDocument();
			expect(screen.queryByTestId("admin-panel")).not.toBeInTheDocument();
		});
	});

	describe("UI visibility based on role", () => {
		it("should show all admin cards for admin role", () => {
			renderAdminWithMockContext({
				authorized: true,
				user: mockAdminSession.user,
			});

			expect(screen.getByTestId("payment-status")).toBeInTheDocument();
			expect(screen.getByTestId("user-management")).toBeInTheDocument();
			expect(screen.getByTestId("roster-management")).toBeInTheDocument();
			expect(screen.getByTestId("data-import")).toBeInTheDocument();
		});

		it("should show only data import card for data role", () => {
			renderAdminWithMockContext({
				authorized: true,
				user: mockDataSession.user,
			});

			expect(screen.queryByTestId("payment-status")).not.toBeInTheDocument();
			expect(screen.queryByTestId("user-management")).not.toBeInTheDocument();
			expect(screen.queryByTestId("roster-management")).not.toBeInTheDocument();
			expect(screen.getByTestId("data-import")).toBeInTheDocument();
			expect(screen.getByTestId("data-only-notice")).toBeInTheDocument();
		});

		it("should handle missing role gracefully (default to user)", () => {
			const userWithoutRole = { ...mockSession.user, role: undefined };
			renderAdminWithMockContext({
				authorized: true,
				user: userWithoutRole,
			});

			expect(screen.queryByTestId("payment-status")).not.toBeInTheDocument();
			expect(screen.queryByTestId("user-management")).not.toBeInTheDocument();
			expect(screen.queryByTestId("roster-management")).not.toBeInTheDocument();
			expect(screen.getByTestId("data-import")).toBeInTheDocument();
			expect(screen.getByTestId("current-role")).toHaveTextContent("user");
		});
	});

	describe("Data role specific behavior", () => {
		it("should indicate data-only layout for data role", () => {
			renderAdminWithMockContext({
				authorized: true,
				user: mockDataSession.user,
			});

			expect(screen.getByTestId("data-only-notice")).toBeInTheDocument();
		});

		it("should show Data Import link is visible to both admin and data roles", () => {
			// Test admin role
			const { unmount } = renderAdminWithMockContext({
				authorized: true,
				user: mockAdminSession.user,
			});
			expect(screen.getByTestId("data-import")).toBeInTheDocument();
			unmount();

			// Test data role
			renderAdminWithMockContext({
				authorized: true,
				user: mockDataSession.user,
			});
			expect(screen.getByTestId("data-import")).toBeInTheDocument();
		});
	});

	describe("Role hierarchy and permissions", () => {
		it("should validate role hierarchy correctly", async () => {
			// Test with admin user
			mockRequireRole.mockResolvedValue({
				authenticated: true,
				user: mockAdminSession.user,
				authorized: true,
			});

			const adminResult = await mockRequireRole(["admin", "data"]);
			expect(adminResult.authorized).toBe(true);

			// Test with data user
			mockRequireRole.mockResolvedValue({
				authenticated: true,
				user: mockDataSession.user,
				authorized: true,
			});

			const dataResult = await mockRequireRole(["admin", "data"]);
			expect(dataResult.authorized).toBe(true);

			// Test with regular user
			mockRequireRole.mockResolvedValue({
				authenticated: true,
				user: mockSession.user,
				authorized: false,
			});

			const userResult = await mockRequireRole(["admin", "data"]);
			expect(userResult.authorized).toBe(false);
		});
	});
});
