import { createFileRoute, Link } from "@tanstack/react-router";
import { Flag, Settings, Trophy } from "lucide-react";
import { Button } from "../components/ui/button";

export const Route = createFileRoute("/")({
	component: Home,
});

function Home() {
	return (
		<div className="min-h-dvh">
			<div className="mx-auto max-w-6xl px-6 pt-16 pb-16">
				<div className="scorecard golf-hero rounded-[calc(var(--radius)+0.5rem)]">
					<div className="relative px-6 py-12 md:px-12 md:py-16">
						<div className="inline-flex items-center gap-2 rounded-full flag-chip px-3 py-1 text-xs font-semibold text-foreground/90 backdrop-blur">
							<Flag className="size-3.5 text-[oklch(0.66_0.19_28)]" />
							Live scoring • Real-time updates
						</div>

						<h1 className="mt-6 text-balance text-5xl md:text-7xl font-black tracking-tight">
							Ytown Invitational
						</h1>

						<p className="mt-3 max-w-2xl text-pretty text-base md:text-lg text-muted-foreground">
							2026 Fantasy Golf Pool — standings, rosters, and tournament
							results in one clubhouse.
						</p>

						<div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
							<Button asChild className="h-10 px-5 font-semibold">
								<Link to="/leaderboard">
									<Trophy className="size-4" />
									View leaderboard
								</Link>
							</Button>

							<Button
								asChild
								variant="outline"
								className="h-10 px-5 border-border/80 bg-background/30 hover:bg-background/40"
							>
								<Link to="/admin">
									<Settings className="size-4" />
									Admin portal
								</Link>
							</Button>
						</div>

						<div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
							<div className="rounded-xl border border-border/70 bg-background/20 px-5 py-4 backdrop-blur">
								<div className="text-xs font-semibold text-muted-foreground">
									Active members
								</div>
								<div className="mt-1 text-2xl font-black tracking-tight">
									108
								</div>
							</div>
							<div className="rounded-xl border border-border/70 bg-background/20 px-5 py-4 backdrop-blur">
								<div className="text-xs font-semibold text-muted-foreground">
									PGA golfers
								</div>
								<div className="mt-1 text-2xl font-black tracking-tight">
									119
								</div>
							</div>
							<div className="rounded-xl border border-border/70 bg-background/20 px-5 py-4 backdrop-blur">
								<div className="text-xs font-semibold text-muted-foreground">
									Tournaments
								</div>
								<div className="mt-1 text-2xl font-black tracking-tight">
									34
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
					<Link
						to="/leaderboard"
						className="group rounded-2xl border border-border/80 bg-card/40 backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-card/55 hover:shadow-2xl hover:shadow-black/30"
					>
						<div className="p-6">
							<div className="flex items-start justify-between gap-4">
								<div>
									<div className="inline-flex items-center gap-2 rounded-full bg-background/25 px-3 py-1 text-xs font-semibold text-muted-foreground">
										<Trophy className="size-3.5 text-primary" />
										Standings
									</div>
									<h2 className="mt-3 text-2xl font-black tracking-tight">
										Live leaderboard
									</h2>
									<p className="mt-2 text-sm text-muted-foreground">
										Segment totals, overall points, and the race to the top.
									</p>
								</div>
								<div className="rounded-xl border border-border/70 bg-background/20 p-3">
									<div className="h-10 w-10 rounded-lg bg-primary/15 ring-1 ring-primary/25" />
								</div>
							</div>
							<div className="mt-5">
								<div className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors group-hover:bg-primary/90">
									Open leaderboard
								</div>
							</div>
						</div>
					</Link>

					<Link
						to="/admin"
						className="group rounded-2xl border border-border/80 bg-card/40 backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-card/55 hover:shadow-2xl hover:shadow-black/30"
					>
						<div className="p-6">
							<div className="flex items-start justify-between gap-4">
								<div>
									<div className="inline-flex items-center gap-2 rounded-full bg-background/25 px-3 py-1 text-xs font-semibold text-muted-foreground">
										<Settings className="size-3.5 text-[oklch(0.66_0.19_28)]" />
										Commissioner tools
									</div>
									<h2 className="mt-3 text-2xl font-black tracking-tight">
										Clubhouse admin
									</h2>
									<p className="mt-2 text-sm text-muted-foreground">
										Manage rosters, payments, and data operations.
									</p>
								</div>
								<div className="rounded-xl border border-border/70 bg-background/20 p-3">
									<div className="h-10 w-10 rounded-lg bg-[oklch(0.66_0.19_28/0.14)] ring-1 ring-[oklch(0.66_0.19_28/0.25)]" />
								</div>
							</div>
							<div className="mt-5">
								<div className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-semibold shadow-sm transition-colors group-hover:bg-background/90">
									Enter admin
								</div>
							</div>
						</div>
					</Link>
				</div>

				<div className="mt-10 text-center text-xs text-muted-foreground">
					<p className="leading-relaxed">
						Keep it honest: points are earned on the course, not in the
						comments.
					</p>
				</div>
			</div>
		</div>
	);
}
