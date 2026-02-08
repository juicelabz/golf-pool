import { createFileRoute, Link } from "@tanstack/react-router";
import { CreditCard, Database, LogOut, Users } from "lucide-react";
import { NotAuthorized } from "../components/NotAuthorized";
import { Button } from "../components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../components/ui/card";
import { requireRole } from "../lib/session";
import { useAuth } from "../lib/use-auth";

export const Route = createFileRoute("/admin")({
	component: Admin,
	beforeLoad: async () => {
		const result = await requireRole(["admin", "data"]);
		if (!result.authenticated) {
			return {
				redirectTo: "/login",
			};
		}
		return result;
	},
});

function Admin() {
	const { authorized, user } = Route.useRouteContext();
	const { signOut } = useAuth();
	const role = (user as { role?: string } | null)?.role ?? "user";
	const isDataRole = role === "data";
	const showAdminCards = role === "admin";

	if (authorized === false) {
		return <NotAuthorized />;
	}

	const handleLogout = async () => {
		try {
			await signOut();
			window.location.href = "/login";
		} catch (error) {
			console.error("Sign out error:", error);
		}
	};

	return (
		<div className="min-h-dvh">
			<div className="mx-auto max-w-5xl px-6 pt-12 pb-16">
				<div className="scorecard golf-hero rounded-[calc(var(--radius)+0.5rem)]">
					<div className="relative px-6 py-10 md:px-12 md:py-12">
						<div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
							<div>
								<div className="inline-flex items-center gap-2 rounded-full flag-chip px-3 py-1 text-xs font-semibold text-foreground/90 backdrop-blur">
									<Users className="size-3.5 text-[oklch(0.66_0.19_28)]" />
									Commissioner tools
								</div>
								<h1 className="mt-4 text-balance text-4xl md:text-6xl font-black tracking-tight">
									Clubhouse admin
								</h1>
								<p className="mt-2 max-w-2xl text-sm md:text-base text-muted-foreground">
									Payments, rosters, and data operations—keep the season running
									smoothly.
								</p>
							</div>

							<Button
								onClick={handleLogout}
								variant="outline"
								className="h-10 px-5 border-border/80 bg-background/30 hover:bg-background/40 font-semibold"
							>
								<LogOut className="size-4" />
								Sign out
							</Button>
						</div>
					</div>
				</div>

				<div
					className={`mt-10 grid grid-cols-1 gap-6 ${
						isDataRole ? "md:grid-cols-1" : "md:grid-cols-3"
					}`}
				>
					{showAdminCards && (
						<Card className="scorecard">
							<CardHeader className="border-b border-border/70 bg-background/20">
								<CardTitle className="text-lg font-black flex items-center gap-2">
									<span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/25">
										<CreditCard className="size-4 text-primary" />
									</span>
									Payment status
								</CardTitle>
							</CardHeader>
							<CardContent className="p-6">
								<p className="text-sm text-muted-foreground mb-4">
									Track member payments and status.
								</p>
								<Button className="w-full h-10 font-semibold">
									Manage payments
								</Button>
							</CardContent>
						</Card>
					)}

					{showAdminCards && (
						<Card className="scorecard">
							<CardHeader className="border-b border-border/70 bg-background/20">
								<CardTitle className="text-lg font-black flex items-center gap-2">
									<span className="inline-flex size-8 items-center justify-center rounded-lg bg-background/25 ring-1 ring-border/60">
										<Users className="size-4 text-foreground" />
									</span>
									User management
								</CardTitle>
							</CardHeader>
							<CardContent className="p-6">
								<p className="text-sm text-muted-foreground mb-4">
									View and manage all users, roles, and access.
								</p>
								<Button
									asChild
									variant="outline"
									className="w-full h-10 border-border/80 bg-background/30 hover:bg-background/40 font-semibold"
								>
									<Link to="/admin/users">Manage users</Link>
								</Button>
							</CardContent>
						</Card>
					)}

					{showAdminCards && (
						<Card className="scorecard">
							<CardHeader className="border-b border-border/70 bg-background/20">
								<CardTitle className="text-lg font-black flex items-center gap-2">
									<span className="inline-flex size-8 items-center justify-center rounded-lg bg-background/25 ring-1 ring-border/60">
										<Users className="size-4 text-foreground" />
									</span>
									Roster management
								</CardTitle>
							</CardHeader>
							<CardContent className="p-6">
								<p className="text-sm text-muted-foreground mb-4">
									View and edit member rosters.
								</p>
								<Button
									variant="outline"
									className="w-full h-10 border-border/80 bg-background/30 hover:bg-background/40 font-semibold"
								>
									Manage rosters
								</Button>
							</CardContent>
						</Card>
					)}

					<Card className="scorecard">
						<CardHeader className="border-b border-border/70 bg-background/20">
							<CardTitle className="text-lg font-black flex items-center gap-2">
								<span className="inline-flex size-8 items-center justify-center rounded-lg bg-[oklch(0.66_0.19_28/0.14)] ring-1 ring-[oklch(0.66_0.19_28/0.25)]">
									<Database className="size-4 text-[oklch(0.66_0.19_28)]" />
								</span>
								Data import
							</CardTitle>
						</CardHeader>
						<CardContent className="p-6">
							<p className="text-sm text-muted-foreground mb-4">
								Upload CSV files with tournament results.
							</p>
							<Button asChild className="w-full h-10 font-semibold">
								<Link to="/data-import">Import data</Link>
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
