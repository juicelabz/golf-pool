import { redirect } from "@tanstack/react-router";
import { createMiddleware, createStart } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "@/lib/auth";

export const authMiddleware = createMiddleware({ type: "function" }).server(
	async ({ next }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });

		if (!session) {
			throw redirect({ to: "/login" });
		}

		return await next();
	},
);

export const adminMiddleware = createMiddleware({ type: "function" }).server(
	async ({ next }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });

		if (!session) {
			throw redirect({ to: "/login" });
		}

		// Check if user has admin role
		const userRole = session.user.role;
		if (userRole !== "admin") {
			throw redirect({ to: "/leaderboard" });
		}

		return await next();
	},
);

export const dataMiddleware = createMiddleware({ type: "function" }).server(
	async ({ next }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });

		if (!session) {
			throw redirect({ to: "/login" });
		}

		// Check if user has data or admin role
		const userRole = session.user.role;
		if (userRole !== "data" && userRole !== "admin") {
			throw redirect({ to: "/leaderboard" });
		}

		return await next();
	},
);

export const createRoleMiddleware = (allowedRoles: string[]) =>
	createMiddleware().server(async ({ next }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });

		if (!session) {
			throw redirect({ to: "/login" });
		}

		const userRole = session.user.role;
		if (!userRole || !allowedRoles.includes(userRole)) {
			throw redirect({ to: "/leaderboard" });
		}

		return await next();
	});

export const startInstance = createStart(() => {
	return {
		// Global middleware applies to *all* server functions. Role checks should be
		// enforced per-route/per-function to avoid redirect loops.
		functionMiddleware: [authMiddleware],
	};
});
