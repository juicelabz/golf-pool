import { relations } from "drizzle-orm";
import {
	index,
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

// Users table (Better-Auth Core Table)
export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: integer("email_verified", { mode: "boolean" })
		.default(false)
		.notNull(),
	image: text("image"),
	createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" })
		.$onUpdate(() => new Date())
		.notNull(),
	role: text("role"),
	banned: integer("banned", { mode: "boolean" }).default(false),
	banReason: text("ban_reason"),
	banExpires: integer("ban_expires", { mode: "timestamp_ms" }),
});

// Sessions table (Better-Auth Core Table)
export const session = sqliteTable(
	"session",
	{
		id: text("id").primaryKey(),
		expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
		token: text("token").notNull().unique(),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.$onUpdate(() => new Date())
			.notNull(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		impersonatedBy: text("impersonated_by"),
	},
	(table) => [index("session_userId_idx").on(table.userId)],
);

// Accounts table (Better-Auth Core Table)
export const account = sqliteTable(
	"account",
	{
		id: text("id").primaryKey(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: integer("access_token_expires_at", {
			mode: "timestamp_ms",
		}),
		refreshTokenExpiresAt: integer("refresh_token_expires_at", {
			mode: "timestamp_ms",
		}),
		scope: text("scope"),
		password: text("password"),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("account_userId_idx").on(table.userId)],
);

// Verifications table (Better-Auth Core Table)
export const verification = sqliteTable(
	"verification",
	{
		id: text("id").primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}));

// Golfers table (119 PGA players)
export const golfers = sqliteTable("golfers", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	category: integer("category").notNull(), // 1-7, 8 for open picks
	isEligible: integer("is_eligible", { mode: "boolean" })
		.default(true)
		.notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
		() => new Date(),
	),
});

// Members table (108 league participants)
export const members = sqliteTable("members", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	userId: text("user_id").references(() => user.id), // Link to auth user
	totalPoints: integer("total_points").default(0).notNull(),
	segment1Points: integer("segment1_points").default(0).notNull(),
	segment2Points: integer("segment2_points").default(0).notNull(),
	segment3Points: integer("segment3_points").default(0).notNull(),
	segment4Points: integer("segment4_points").default(0).notNull(),
	segment5Points: integer("segment5_points").default(0).notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
		() => new Date(),
	),
	updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
		() => new Date(),
	),
});

// Tournaments table (34 events)
export const tournaments = sqliteTable("tournaments", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	type: text("type", { enum: ["Standard", "Double", "Triple"] }).notNull(),
	segment: integer("segment").notNull(), // 1-5
	startDate: text("start_date").notNull(), // YYYY-MM-DD format
	endDate: text("end_date").notNull(), // YYYY-MM-DD format
	isActive: integer("is_active", { mode: "boolean" }).default(false).notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
		() => new Date(),
	),
});

// Scoring table (weekly results)
export const scoring = sqliteTable("scoring", {
	id: text("id").primaryKey(),
	tournamentId: text("tournament_id")
		.references(() => tournaments.id, { onDelete: "cascade" })
		.notNull(),
	golferId: text("golfer_id")
		.references(() => golfers.id, { onDelete: "cascade" })
		.notNull(),
	rank: integer("rank").notNull(), // 1-10+ (top 10 only get points)
	points: integer("points").notNull(), // Calculated based on rank and tournament type
	createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
		() => new Date(),
	),
});

// Rosters table (member to golfer assignments)
export const rosters = sqliteTable("rosters", {
	id: text("id").primaryKey(),
	memberId: text("member_id")
		.references(() => members.id, { onDelete: "cascade" })
		.notNull(),
	golferId: text("golfer_id")
		.references(() => golfers.id, { onDelete: "cascade" })
		.notNull(),
	category: integer("category").notNull(), // 1-10 (which slot the golfer fills)
	createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
		() => new Date(),
	),
});

// Unique constraints
export const rostersUnique = uniqueIndex("rosters_member_category_unique").on(
	rosters.memberId,
	rosters.category,
);

export const scoringUnique = uniqueIndex("scoring_tournament_golfer_unique").on(
	scoring.tournamentId,
	scoring.golferId,
);

// Schema export
export const schema = {
	user,
	session,
	account,
	verification,
	golfers,
	members,
	tournaments,
	scoring,
	rosters,
};

// Type exports for TypeScript
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Golfer = typeof golfers.$inferSelect;
export type NewGolfer = typeof golfers.$inferInsert;
export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;
export type Tournament = typeof tournaments.$inferSelect;
export type NewTournament = typeof tournaments.$inferInsert;
export type Scoring = typeof scoring.$inferSelect;
export type NewScoring = typeof scoring.$inferInsert;
export type Roster = typeof rosters.$inferSelect;
export type NewRoster = typeof rosters.$inferInsert;
