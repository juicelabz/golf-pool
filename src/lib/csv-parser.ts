export interface TournamentResult {
	tournamentId: string;
	golferName: string;
	rank: number;
}

export function parseTournamentCSV(csvContent: string): TournamentResult[] {
	const lines = csvContent.split("\n").filter((line) => line.trim());

	// Skip header if it exists
	const startIndex = lines[0].toLowerCase().includes("tournament") ? 1 : 0;

	const results: TournamentResult[] = [];

	for (let i = startIndex; i < lines.length; i++) {
		const parts = lines[i].split(",").map((p) => p.trim());

		if (parts.length < 3) continue;

		const [tournamentId, golferName, rankStr] = parts;

		try {
			const rank = parseInt(rankStr);
			if (isNaN(rank)) continue;

			results.push({
				tournamentId: tournamentId,
				golferName: golferName,
				rank,
			});
		} catch (error) {
			console.warn(`Skipping invalid row ${i + 1}:`, parts);
		}
	}

	return results;
}

export function validateResults(results: TournamentResult[]): {
	valid: boolean;
	errors: string[];
	warnings: string[];
} {
	const errors: string[] = [];
	const warnings: string[] = [];

	// Check for required fields
	const requiredFields = results.filter(
		(r) => !r.tournamentId || !r.golferName || r.rank === undefined,
	);

	if (requiredFields.length > 0) {
		errors.push(`${requiredFields.length} rows have missing required fields`);
	}

	// Validate ranks
	const invalidRanks = results.filter((r) => r.rank < 1 || r.rank > 10);
	if (invalidRanks.length > 0) {
		warnings.push(
			`${invalidRanks.length} results have ranks outside 1-10 range`,
		);
	}

	return {
		valid: errors.length === 0,
		errors,
		warnings,
	};
}

export function getCSVTemplate(): string {
	return `TournamentID,GolferName,Rank
sony-open,Tommy Fleetwood,1
sony-open,Rory McIlroy,2
sony-open,Russell Henley,3
american-express,Justin Thomas,1
american-express,Sepp Straka,2
...`;
}
