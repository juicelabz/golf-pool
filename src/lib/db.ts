import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";

// Create or open the SQLite database
const sqlite = new Database(process.env.DATABASE_URL || "./golf-pool.db");

// Enable foreign keys
sqlite.exec("PRAGMA foreign_keys = ON");

// Create Drizzle instance
export const db = drizzle(sqlite);

export type DB = typeof db;
