import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { golfers, scoring, tournaments } from "./schema";
import { calculatePoints } from "./seed";

export const importScoringData = createServerFn({ method: "POST" })
  .handler(async ({ tournamentResults }: { tournamentResults: Array<{ tournamentId: string; golferName: string; rank: number }> }) => {
    const results = [];
    
    // Process each tournament result
    for (const result of tournamentResults) {
      // Find the tournament
      const tournamentList = await db.select().from(tournaments);
      const tournament = tournamentList.find(t => t.id === result.tournamentId);
      
      if (!tournament) {
        throw new Error(`Tournament not found: ${result.tournamentId}`);
      }
      
      // Find the golfer by name
      const golfersList = await db.select().from(golfers);
      const golfer = golfersList.find(g => g.name === result.golferName);
      
      if (!golfer) {
        throw new Error(`Golfer not found: ${result.golferName}`);
      }
      
      // Calculate points based on rank and tournament type
      const points = calculatePoints(result.rank, tournament.type);
      
      // Create scoring entry
      const scoringEntry = {
        id: `scoring-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        tournamentId: result.tournamentId,
        golferId: golfer.id,
        rank: result.rank,
        points,
        createdAt: new Date(),
      };
      
      // Insert scoring data
      await db.insert(scoring).values(scoringEntry);
      
      results.push({
        golfer: golfer.name,
        tournament: tournament.name,
        rank: result.rank,
        points,
      });
    }
    
    return {
      success: true,
      count: results.length,
      results,
    };
  });

export const getTournamentList = createServerFn({ method: "GET" })
  .handler(async () => {
    const allTournaments = await db.select().from(tournaments);
    return allTournaments;
  });

			if (!tournament) {
				throw new Error(`Tournament not found: ${result.tournamentId}`);
			}

			// Find the golfer by name
			const golfer = await db.query.golfers.findFirst({
				where: eq(golfers.name, result.golferName),
			});

			if (!golfer) {
				throw new Error(`Golfer not found: ${result.golferName}`);
			}

			// Calculate points based on rank and tournament type
			const points = calculatePoints(result.rank, tournament.type);

			// Create scoring entry
			const scoringEntry = {
				id: `scoring-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				tournamentId: result.tournamentId,
				golferId: golfer.id,
				rank: result.rank,
				points,
				createdAt: new Date(),
			};

			// Insert scoring data
			await db.insert(scoring).values(scoringEntry);

			results.push({
				golfer: golfer.name,
				tournament: tournament.name,
				rank: result.rank,
				points,
			});
		}

		return {
			success: true,
			count: results.length,
			results,
		};
	},
);

export const getTournamentList = createServerFn({ method: "GET" }).handler(
	async () => {
		const allTournaments = await db.select().from(tournaments);
		return allTournaments;
	},
);
