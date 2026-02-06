import { createAuthClient } from "better-auth/client";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
	baseUrl: typeof window !== "undefined" ? window.location.origin : "",
	fetchOptions: {
		credentials: "include",
	},
	plugins: [adminClient()],
});
