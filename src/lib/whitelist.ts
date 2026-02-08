export interface WhitelistEntry {
	email?: string;
}

export function normalizeEmail(email?: string | null): string {
	return email?.trim().toLowerCase() ?? "";
}

export function buildWhitelistSet(entries: WhitelistEntry[]): Set<string> {
	return new Set(
		entries
			.map((entry) => normalizeEmail(entry.email))
			.filter((email) => email.length > 0),
	);
}
