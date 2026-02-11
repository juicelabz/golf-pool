import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Flag, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { getRostersData } from "@/lib/rosters";

const SLOT_LABELS: Record<number, string> = {
	1: "Cat 1",
	2: "Cat 2",
	3: "Cat 3",
	4: "Cat 4",
	5: "Cat 5",
	6: "Cat 6",
	7: "Cat 7",
	8: "Open 1",
	9: "Open 2",
	10: "Open 3",
};

const SLOTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export const Route = createFileRoute("/rosters")({
	component: RostersPage,
	loader: async () => {
		return getRostersData();
	},
});

function RostersPage() {
	const data = Route.useLoaderData();

	return (
		<div className="min-h-dvh">
			<div className="mx-auto max-w-7xl px-6 pt-12 pb-16">
				<div className="scorecard golf-hero rounded-[calc(var(--radius)+0.5rem)]">
					<div className="relative px-6 py-10 md:px-12 md:py-12">
						<div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
							<div>
								<div className="inline-flex items-center gap-2 rounded-full flag-chip px-3 py-1 text-xs font-semibold text-foreground/90 backdrop-blur">
									<Flag className="size-3.5 text-[oklch(0.66_0.19_28)]" />
									Member rosters
								</div>
								<h1 className="mt-4 text-balance text-4xl md:text-6xl font-black tracking-tight">
									Team Rosters
								</h1>
								<p className="mt-2 max-w-2xl text-sm md:text-base text-muted-foreground">
									Every member and their 10 picks—categories 1–7 plus three open
									slots.
								</p>
							</div>
							<Button
								asChild
								variant="outline"
								className="h-10 px-5 border-border/80 bg-background/30 hover:bg-background/40 font-semibold shrink-0"
							>
								<Link to="/leaderboard" search={{ page: 1, pageSize: 20 }}>
									<ChevronLeft className="size-4" />
									Back to leaderboard
								</Link>
							</Button>
						</div>
					</div>
				</div>

				<div className="mt-10">
					<Card className="scorecard overflow-hidden">
						<CardHeader className="border-b border-border/70 bg-background/20">
							<CardTitle className="text-xl md:text-2xl font-black flex items-center gap-3">
								<span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/25">
									<Users className="size-4 text-primary" />
								</span>
								Teams
							</CardTitle>
						</CardHeader>
						<CardContent className="p-0">
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow className="border-b border-border/70 bg-background/25 hover:bg-transparent">
											<TableHead className="py-4 px-6 text-xs font-semibold tracking-wide text-muted-foreground w-[180px] sticky left-0 z-10 bg-background/95 backdrop-blur">
												Member
											</TableHead>
											{SLOTS.map((slot) => (
												<TableHead
													key={slot}
													className="py-4 px-4 text-xs font-semibold tracking-wide text-muted-foreground text-center min-w-[120px]"
												>
													{SLOT_LABELS[slot]}
												</TableHead>
											))}
										</TableRow>
									</TableHeader>
									<TableBody>
										{data.members.map((member) => (
											<TableRow
												key={member.memberId}
												className="border-b border-border/50 hover:bg-background/15 transition-colors"
											>
												<TableCell className="py-3 px-6 font-semibold sticky left-0 z-10 bg-background/95 backdrop-blur border-r border-border/40">
													{member.memberName}
												</TableCell>
												{SLOTS.map((slot) => (
													<TableCell
														key={slot}
														className="py-3 px-4 text-center text-muted-foreground"
													>
														{member.golfersBySlot[slot] ?? "—"}
													</TableCell>
												))}
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
							<div className="px-6 py-4 border-t border-border/70 bg-background/20">
								<div className="text-center text-[11px] text-muted-foreground">
									{data.members.length} members • Cat 1–7 = chalk categories •
									Open 1–3 = write-ins
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
