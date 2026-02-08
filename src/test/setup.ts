import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import "@testing-library/jest-dom";

// Setup global mocks
vi.mock("@tanstack/react-router", async () => {
	const actual = await vi.importActual("@tanstack/react-router");
	return {
		...actual,
		createMemoryRouter: vi.fn(),
	};
});

vi.mock("../lib/auth-client", () => ({
	authClient: {
		getSession: vi.fn(),
		signIn: { email: vi.fn() },
		signOut: vi.fn(),
		signUp: { email: vi.fn() },
	},
}));

vi.mock("../lib/session", () => ({
	getSession: vi.fn(),
	requireAuth: vi.fn(),
	requireRole: vi.fn(),
}));

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});
