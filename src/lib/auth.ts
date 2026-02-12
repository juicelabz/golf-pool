import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { admin as adminPlugin } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "./db";
import { members, schema } from "./schema";
import { buildWhitelistSet, normalizeEmail } from "./whitelist";

// Load whitelist from JSON
let cachedWhitelist: Set<string> | null = null;
interface WhitelistEntry {
	name?: string;
	email?: string;
	role?: "admin" | "data" | "user";
}
let cachedWhitelistByEmail: Map<string, WhitelistEntry> | null = null;

function normalizeMemberName(name?: string | null): string {
	return name?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";
}

async function loadWhitelist(): Promise<{
	allowedEmails: Set<string>;
	entriesByEmail: Map<string, WhitelistEntry>;
}> {
	if (cachedWhitelist && cachedWhitelistByEmail) {
		return {
			allowedEmails: cachedWhitelist,
			entriesByEmail: cachedWhitelistByEmail,
		};
	}

	try {
		const whitelistPath = `${process.cwd()}/whitelist.json`;
		const whitelistFile = Bun.file(whitelistPath);
		const whitelist = (await whitelistFile.json()) as WhitelistEntry[];

		// Extract emails from whitelist
		cachedWhitelist = buildWhitelistSet(whitelist);
		cachedWhitelistByEmail = new Map(
			whitelist
				.map((entry) => [normalizeEmail(entry.email), entry] as const)
				.filter(([email]) => email.length > 0),
		);

		console.log(`✅ Loaded ${cachedWhitelist.size} whitelisted emails`);
		return {
			allowedEmails: cachedWhitelist,
			entriesByEmail: cachedWhitelistByEmail,
		};
	} catch (error) {
		console.error("❌ Failed to load whitelist:", error);
		return { allowedEmails: new Set(), entriesByEmail: new Map() };
	}
}

async function findMemberForWhitelistedEmail(email: string): Promise<{
	id: string;
	userId: string | null;
} | null> {
	const { entriesByEmail } = await loadWhitelist();
	const entry = entriesByEmail.get(email);
	const normalizedWhitelistedName = normalizeMemberName(entry?.name);
	if (!normalizedWhitelistedName) {
		return null;
	}

	const allMembers = await db
		.select({ id: members.id, name: members.name, userId: members.userId })
		.from(members);
	const matchedMembers = allMembers.filter(
		(member) => normalizeMemberName(member.name) === normalizedWhitelistedName,
	);

	if (matchedMembers.length !== 1) {
		return null;
	}

	const [member] = matchedMembers;
	return {
		id: member.id,
		userId: member.userId ?? null,
	};
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
				before: async (user: { email?: string } & Record<string, unknown>) => {
					const email = normalizeEmail(user.email);
					//const { allowedEmails } = await loadWhitelist();

					//if (!email || !allowedEmails.has(email)) {
					//	throw new APIError("FORBIDDEN", {
					//		message: "Not allowed.",
					//	});
					//}

					const member = await findMemberForWhitelistedEmail(email);
					if (!member) {
						throw new APIError("FORBIDDEN", {
							message:
								"No eligible member record found for this email. Contact an admin.",
						});
					}
					if (member.userId) {
						throw new APIError("FORBIDDEN", {
							message: "This member is already linked to an existing account.",
						});
					}

					const whitelistRole =
						(await loadWhitelist()).entriesByEmail.get(email)?.role ?? "user";

					// Assign role based on whitelist (admin/data/user). The admin plugin does not
					// auto-promote users; it only interprets roles.
					return { data: { ...user, role: whitelistRole } };
				},
				after: async (user: { id?: string; email?: string }) => {
					const userId = user.id;
					const email = normalizeEmail(user.email);
					if (!userId || !email) return;

					const member = await findMemberForWhitelistedEmail(email);
					if (!member) {
						throw new Error(
							`Failed to find member for whitelisted email: ${email}`,
						);
					}

					await db
						.update(members)
						.set({ userId, updatedAt: new Date() })
						.where(and(eq(members.id, member.id), isNull(members.userId)));
				},
			},
		},
	},

	// TanStack Start cookie handling
	plugins: [adminPlugin(), tanstackStartCookies()],
});
