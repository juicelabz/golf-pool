import auth from "../lib/auth";

export async function checkAuth() {
	const session = await auth.api.getSession();

	if (!session) {
		throw new Error("Not authenticated");
	}

	return session.user;
}

export async function checkRole(requiredRole: "admin" | "data" | "user") {
	const user = await checkAuth();

	// Define role hierarchy
	const roleHierarchy = {
		admin: 3,
		data: 2,
		user: 1,
	};

	const userRole = (user.role as string) || "user";
	const requiredLevel = roleHierarchy[requiredRole] || 1;
	const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 1;

	if (userLevel < requiredLevel) {
		throw new Error(`Insufficient permissions. Required: ${requiredRole}`);
	}

	return user;
}
