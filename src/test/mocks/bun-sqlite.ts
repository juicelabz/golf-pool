// Mock bun:sqlite for Node.js test environment
export class Database {
	constructor(path: string) {
		// Mock database constructor
	}

	query(sql: string, params?: any[]) {
		// Mock query method
		return [];
	}

	prepare(sql: string) {
		// Mock prepare method
		return {
			all: () => [],
			run: () => ({ lastInsertRowid: 1 }),
		};
	}

	close() {
		// Mock close method
	}
}
