export const POINTS_MAP = {
	Standard: [15, 10, 8, 7, 6, 5, 4, 3, 2, 1],
	Double: [30, 20, 16, 14, 12, 10, 8, 6, 4, 2],
	Triple: [45, 30, 24, 21, 18, 15, 12, 9, 6, 3],
} as const;

export type TournamentType = keyof typeof POINTS_MAP;

export function calculatePoints(rank: number, type: TournamentType): number {
	if (rank > 10) return 0;
	return POINTS_MAP[type][rank - 1];
}
