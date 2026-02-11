import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";

// Dynamic imports prevent bun:sqlite from contaminating the client bundle.
// In dev mode, Vite resolves all static imports for both client and server;
// server-only modules like bun:sqlite must be loaded dynamically.
let db: BunSQLiteDatabase = undefined as unknown as BunSQLiteDatabase;

if (typeof window === "undefined") {
	const { Database } = await import("bun:sqlite");
	const { drizzle } = await import("drizzle-orm/bun-sqlite");
	const sqlite = new Database(process.env.DATABASE_URL || "./golf-pool.db");
	sqlite.exec("PRAGMA foreign_keys = ON");
	db = drizzle({ client: sqlite });
}

export { db };
export type DB = typeof db;
