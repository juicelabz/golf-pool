import { vi } from "vitest";

export const mockUser = {
	id: "user-1",
	email: "test@example.com",
	name: "Test User",
	role: "user" as const,
	createdAt: new Date(),
	updatedAt: new Date(),
	emailVerified: true,
	banned: false,
};

export const mockAdminUser = {
	id: "admin-1",
	email: "admin@example.com",
	name: "Admin User",
	role: "admin" as const,
	createdAt: new Date(),
	updatedAt: new Date(),
	emailVerified: true,
	banned: false,
};

export const mockDataUser = {
	id: "data-1",
	email: "data@example.com",
	name: "Data User",
	role: "data" as const,
	createdAt: new Date(),
	updatedAt: new Date(),
	emailVerified: true,
	banned: false,
};

export const mockSession = {
	user: mockUser,
	session: {
		id: "session-1",
		expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
		userId: mockUser.id,
		token: "mock-token",
		createdAt: new Date(),
		updatedAt: new Date(),
	},
};

export const mockAdminSession = {
	user: mockAdminUser,
	session: {
		id: "session-admin-1",
		expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
		userId: mockAdminUser.id,
		token: "mock-admin-token",
		createdAt: new Date(),
		updatedAt: new Date(),
	},
};

export const mockDataSession = {
	user: mockDataUser,
	session: {
		id: "session-data-1",
		expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
		userId: mockDataUser.id,
		token: "mock-data-token",
		createdAt: new Date(),
		updatedAt: new Date(),
	},
};

export const mockWhitelist = [
	{ email: "test@example.com" },
	{ email: "admin@example.com" },
	{ email: "data@example.com" },
	{ email: "WHITELISTED@EXAMPLE.COM" }, // Test case handling
	{ email: "  spaced@example.com  " }, // Test trim handling
];

export function mockAuthClient(session: typeof mockSession | null) {
	return {
		getSession: vi.fn().mockResolvedValue({ data: session }),
		signIn: {
			email: vi.fn().mockResolvedValue({ data: null, error: null }),
		},
		signOut: vi.fn().mockResolvedValue({ data: null, error: null }),
		signUp: {
			email: vi.fn().mockResolvedValue({ data: null, error: null }),
		},
	};
}

export function mockRequireAuth(session: typeof mockSession | null) {
	return vi.fn().mockResolvedValue(
		session
			? {
					authenticated: true,
					user: session.user,
				}
			: {
					authenticated: false,
					user: null,
				},
	);
}

export function mockRequireRole(
	session: typeof mockSession | null,
	requiredRoles: ("admin" | "data" | "user")[],
) {
	if (!session) {
		return vi.fn().mockResolvedValue({
			authenticated: false,
			user: null,
		});
	}

	const userRole = (session.user.role as "admin" | "data" | "user") ?? "user";
	const hasRequiredRole = requiredRoles.includes(userRole);

	return vi.fn().mockResolvedValue({
		authenticated: true,
		user: session.user,
		authorized: hasRequiredRole,
	});
}

export function createMockHeaders(session: typeof mockSession | null) {
	const headers = new Headers();
	if (session) {
		headers.set("cookie", `better-auth.session_token=${session.session.token}`);
	}
	return headers;
}
