import { createFileRoute } from "@tanstack/react-router";
import { Flag, Sparkles, Trophy } from "lucide-react";
import { Button } from "../components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../components/ui/card";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "../components/ui/pagination";
import { getLeaderboardData } from "../lib/server-functions";

export const Route = createFileRoute("/leaderboard")({
	component: Leaderboard,
	validateSearch: (search: Record<string, unknown>) => ({
		page: Number(search.page) || 1,
		pageSize: Number(search.pageSize) || 20,
	}),
	loaderDeps: ({ search: { page, pageSize } }) => ({ page, pageSize }),
	loader: async ({ deps: { page, pageSize } }) => {
		return getLeaderboardData({
			data: {
				page,
				pageSize,
			},
		});
	},
});

function Leaderboard() {
	const data = Route.useLoaderData();
	const { page, pageSize } = Route.useSearch();
	const navigate = Route.useNavigate();

	return (
		<div className="min-h-dvh">
			<div className="mx-auto max-w-7xl px-6 pt-12 pb-16">
				<div className="scorecard golf-hero rounded-[calc(var(--radius)+0.5rem)]">
					<div className="relative px-6 py-10 md:px-12 md:py-12">
						<div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
							<div>
								<div className="inline-flex items-center gap-2 rounded-full flag-chip px-3 py-1 text-xs font-semibold text-foreground/90 backdrop-blur">
									<Flag className="size-3.5 text-[oklch(0.66_0.19_28)]" />
									Live leaderboard
								</div>
								<h1 className="mt-4 text-balance text-4xl md:text-6xl font-black tracking-tight">
									Standings
								</h1>
								<p className="mt-2 max-w-2xl text-sm md:text-base text-muted-foreground">
									Overall totals and segment splits—updated as results come in.
								</p>
							</div>

							<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
								<Button className="h-10 px-5 font-semibold">
									<Trophy className="size-4" />
									Top 10 focus
								</Button>
								<Button
									variant="outline"
									className="h-10 px-5 border-border/80 bg-background/30 hover:bg-background/40 font-semibold"
								>
									<Sparkles className="size-4" />
									Highlights
								</Button>
							</div>
						</div>
					</div>
				</div>

				<div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
					<div className="lg:col-span-2">
						<Card className="scorecard overflow-hidden">
							<CardHeader className="border-b border-border/70 bg-background/20">
								<CardTitle className="text-xl md:text-2xl font-black flex items-center gap-3">
									<span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/25">
										<Trophy className="size-4 text-primary" />
									</span>
									Live leaderboard
								</CardTitle>
							</CardHeader>
							<CardContent className="p-0">
								<div className="overflow-x-auto">
									<table className="w-full">
										<thead>
											<tr className="border-b border-border/70 bg-background/25">
												<th className="text-left py-4 px-6 text-xs font-semibold tracking-wide text-muted-foreground">
													#
												</th>
												<th className="text-left py-4 px-6 text-xs font-semibold tracking-wide text-muted-foreground">
													Member
												</th>
												<th className="text-center py-4 px-6 text-xs font-semibold tracking-wide text-muted-foreground">
													Total
												</th>
												<th className="text-center py-4 px-6 text-xs font-semibold tracking-wide text-muted-foreground">
													Seg 1
												</th>
												<th className="text-center py-4 px-6 text-xs font-semibold tracking-wide text-muted-foreground">
													Seg 2
												</th>
												<th className="text-center py-4 px-6 text-xs font-semibold tracking-wide text-muted-foreground">
													Seg 3
												</th>
												<th className="text-center py-4 px-6 text-xs font-semibold tracking-wide text-muted-foreground">
													Seg 4
												</th>
												<th className="text-center py-4 px-6 text-xs font-semibold tracking-wide text-muted-foreground">
													Seg 5
												</th>
											</tr>
										</thead>
										<tbody>
											{data.members.map((member, index: number) => (
												<tr
													key={member.id}
													className="border-b border-border/50 hover:bg-background/15 transition-colors"
												>
													<td className="py-4 px-6">
														<div className="flex items-center justify-center w-8 h-8 rounded-full bg-background/25 ring-1 ring-border/60 text-xs font-semibold">
															{index + 1}
														</div>
													</td>
													<td className="py-4 px-6">
														<div className="text-foreground font-semibold">
															{member.name}
														</div>
													</td>
													<td className="py-4 px-6 text-center">
														<div className="text-xl md:text-2xl font-black text-primary">
															{member.totalPoints.toLocaleString()}
														</div>
													</td>
													<td className="py-4 px-6 text-center text-muted-foreground">
														{member.segment1Points}
													</td>
													<td className="py-4 px-6 text-center text-muted-foreground">
														{member.segment2Points}
													</td>
													<td className="py-4 px-6 text-center text-muted-foreground">
														{member.segment3Points}
													</td>
													<td className="py-4 px-6 text-center text-muted-foreground">
														{member.segment4Points}
													</td>
													<td className="py-4 px-6 text-center text-muted-foreground">
														{member.segment5Points}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
								{data.totalPages > 1 && (
									<div className="px-6 py-4 border-t border-border/70 bg-background/20">
										<Pagination>
											<PaginationContent>
												<PaginationItem>
													<PaginationPrevious
														onClick={() =>
															navigate({
																search: {
																	page: Math.max(1, page - 1),
																	pageSize,
																},
															})
														}
														className={
															page === 1
																? "pointer-events-none opacity-50"
																: "cursor-pointer"
														}
													/>
												</PaginationItem>
												{Array.from(
													{ length: data.totalPages },
													(_, i) => i + 1,
												).map((pageNum) => {
													const isCurrentPage = pageNum === page;
													const isNearCurrent = Math.abs(pageNum - page) <= 2;
													const isFirst = pageNum === 1;
													const isLast = pageNum === data.totalPages;

													if (
														isNearCurrent ||
														(isFirst && page > 4) ||
														(isLast && page < data.totalPages - 3)
													) {
														return (
															<PaginationItem key={pageNum}>
																<PaginationLink
																	onClick={() =>
																		navigate({
																			search: { page: pageNum, pageSize },
																		})
																	}
																	isActive={isCurrentPage}
																	className="cursor-pointer"
																>
																	{pageNum}
																</PaginationLink>
															</PaginationItem>
														);
													} else if (
														(pageNum === 2 && page > 4) ||
														(pageNum === data.totalPages - 1 &&
															page < data.totalPages - 3)
													) {
														return (
															<PaginationItem key={pageNum}>
																<PaginationEllipsis />
															</PaginationItem>
														);
													}
													return null;
												})}
												<PaginationItem>
													<PaginationNext
														onClick={() =>
															navigate({
																search: {
																	page: Math.min(data.totalPages, page + 1),
																	pageSize,
																},
															})
														}
														className={
															page === data.totalPages
																? "pointer-events-none opacity-50"
																: "cursor-pointer"
														}
													/>
												</PaginationItem>
											</PaginationContent>
										</Pagination>
									</div>
								)}
							</CardContent>
						</Card>
					</div>

					<div className="space-y-6">
						<Card className="scorecard">
							<CardHeader className="border-b border-border/70 bg-background/20">
								<CardTitle className="text-lg font-black flex items-center gap-2">
									<span className="inline-flex size-7 items-center justify-center rounded-lg bg-background/25 ring-1 ring-border/60">
										<Flag className="size-3.5 text-[oklch(0.66_0.19_28)]" />
									</span>
									Pool snapshot
								</CardTitle>
							</CardHeader>
							<CardContent className="p-6 space-y-4">
								<div className="grid grid-cols-3 gap-3">
									<div className="rounded-xl border border-border/70 bg-background/20 p-3 text-center">
										<div className="text-xl font-black text-primary">
											{data.totalParticipants}
										</div>
										<div className="mt-1 text-[11px] text-muted-foreground">
											Members
										</div>
									</div>
									<div className="rounded-xl border border-border/70 bg-background/20 p-3 text-center">
										<div className="text-xl font-black text-foreground">
											{data.totalGolfers}
										</div>
										<div className="mt-1 text-[11px] text-muted-foreground">
											Golfers
										</div>
									</div>
									<div className="rounded-xl border border-border/70 bg-background/20 p-3 text-center">
										<div className="text-xl font-black text-[oklch(0.66_0.19_28)]">
											{data.tournaments.length}
										</div>
										<div className="mt-1 text-[11px] text-muted-foreground">
											Events
										</div>
									</div>
								</div>
								<div className="text-center pt-4 border-t border-border/60 space-y-2">
									<div className="text-[11px] text-muted-foreground">
										Showing {(page - 1) * pageSize + 1}-
										{Math.min(page * pageSize, data.totalMembers)} of{" "}
										{data.totalMembers} members
									</div>
									<div className="text-[11px] text-muted-foreground">
										Last updated: {new Date().toLocaleTimeString()}
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="scorecard">
							<CardHeader className="border-b border-border/70 bg-background/20">
								<CardTitle className="text-lg font-black flex items-center gap-2">
									<span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/25">
										<Sparkles className="size-3.5 text-primary" />
									</span>
									Quick actions
								</CardTitle>
							</CardHeader>
							<CardContent className="p-6 space-y-3">
								<Button className="w-full h-10 font-semibold">
									View full rosters
								</Button>
								<Button
									variant="outline"
									className="w-full h-10 border-border/80 bg-background/30 hover:bg-background/40 font-semibold"
								>
									Tournament schedule
								</Button>
								<Button
									variant="outline"
									className="w-full h-10 border-border/80 bg-background/30 hover:bg-background/40 font-semibold"
								>
									Chalk counter
								</Button>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
