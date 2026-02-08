import { authClient } from "./auth-client";

export async function getSession() {
	try {
		const session = await authClient.getSession();
		return session.data;
	} catch {
		return null;
	}
}

export async function getSessionSSR(request?: Request) {
	try {
		// For server-side usage, we can use the auth handler directly
		const session = request
			? await authClient.getSession({
					fetchOptions: {
						headers: Object.fromEntries(request.headers.entries()),
					},
				})
			: await authClient.getSession();
		return session.data;
	} catch {
		return null;
	}
}

export async function requireAuth() {
	const session = await getSession();

	if (!session?.user) {
		return {
			authenticated: false,
			user: null,
		};
	}

	return {
		authenticated: true,
		user: session.user,
	};
}

export async function requireRole(
	requiredRoles: ("admin" | "data" | "user")[],
) {
	const session = await getSession();

	if (!session?.user) {
		return {
			authenticated: false,
			user: null,
		};
	}

	const user = session.user as { role?: string };
	const userRole = (user.role as "admin" | "data" | "user") ?? "user";
	const hasRequiredRole = requiredRoles.includes(userRole);

	if (!hasRequiredRole) {
		return {
			authenticated: true,
			user: session.user,
			authorized: false,
		};
	}

	return {
		authenticated: true,
		user: session.user,
		authorized: true,
	};
}
