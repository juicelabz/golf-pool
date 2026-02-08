import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { admin as adminPlugin } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "./db";
import { schema } from "./schema";
import { buildWhitelistSet, normalizeEmail } from "./whitelist";

// Load whitelist from JSON
let cachedWhitelist: Set<string> | null = null;

async function loadWhitelist(): Promise<Set<string>> {
	if (cachedWhitelist) return cachedWhitelist;

	try {
		const whitelistPath = `${process.cwd()}/whitelist.json`;
		const whitelistFile = Bun.file(whitelistPath);
		const whitelist = await whitelistFile.json();

		// Extract emails from whitelist
		cachedWhitelist = buildWhitelistSet(whitelist);

		console.log(`✅ Loaded ${cachedWhitelist.size} whitelisted emails`);
		return cachedWhitelist;
	} catch (error) {
		console.error("❌ Failed to load whitelist:", error);
		return new Set();
	}
}

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "sqlite",
		schema,
	}),

	// Enable email and password authentication
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false,
		minPasswordLength: 8,
		sendResetPasswordUrl: async ({ url }: { url: string }) => {
			await console.log("Reset URL:", url);
		},
		sendVerificationEmail: async ({ url }: { url: string }) => {
			await console.log("Verification URL:", url);
		},
	},

	// Session configuration
	session: {
		expiresIn: 60 * 60 * 24 * 7,
	},

	// Base configuration
	baseURL: process.env.BETTER_AUTH_URL,
	secret: process.env.BETTER_AUTH_SECRET,

	// Whitelist validation - prevent non-whitelisted users from registering
	databaseHooks: {
		user: {
			create: {
				before: async (user: { email?: string }) => {
					const email = normalizeEmail(user.email);
					const whitelist = await loadWhitelist();

					if (!email || !whitelist.has(email)) {
						throw new APIError("FORBIDDEN", {
							message: "Not allowed.",
						});
					}

					return { data: user };
				},
			},
		},
	},

	// TanStack Start cookie handling
	plugins: [tanstackStartCookies(), adminPlugin()],
});
