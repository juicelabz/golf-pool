import { createServerFn } from "@tanstack/react-start";
import { asc } from "drizzle-orm";
import { db } from "./db";
import { golfers, members, rosters } from "./schema";

export type MemberRosterEntry = {
	memberId: string;
	memberName: string;
	golfersBySlot: Record<number, string>;
};

export type RostersData = {
	members: MemberRosterEntry[];
};

async function loadRostersData(): Promise<RostersData> {
	const [allMembers, allRosters, allGolfers] = await Promise.all([
		db.select().from(members).orderBy(asc(members.name)),
		db.select().from(rosters),
		db.select().from(golfers),
	]);

	const golfersById = new Map(allGolfers.map((g) => [g.id, g.name]));
	const rosterByMemberId = new Map<string, Record<number, string>>();

	for (const r of allRosters) {
		let slotMap = rosterByMemberId.get(r.memberId);
		if (!slotMap) {
			slotMap = {};
			rosterByMemberId.set(r.memberId, slotMap);
		}
		slotMap[r.category] = golfersById.get(r.golferId) ?? r.golferId;
	}

	const memberEntries: MemberRosterEntry[] = allMembers.map((m) => ({
		memberId: m.id,
		memberName: m.name,
		golfersBySlot: rosterByMemberId.get(m.id) ?? {},
	}));

	return { members: memberEntries };
}

export const getRostersData = createServerFn({ method: "GET" }).handler(
	loadRostersData,
);
