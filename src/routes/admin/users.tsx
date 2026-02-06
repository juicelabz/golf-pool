import { createFileRoute, Link } from "@tanstack/react-router";
import {
	RefreshCw,
	Search,
	Settings,
	Shield,
	ShieldAlert,
	Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { NotAuthorized } from "@/components/NotAuthorized";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { requireRole } from "@/lib/session";

export const Route = createFileRoute("/admin/users")({
	component: UserManagement,
	beforeLoad: async () => {
		const result = await requireRole(["admin"]);
		if (!result.authenticated) {
			return {
				redirectTo: "/login",
			};
		}
		return result;
	},
});

function UserManagement() {
	const { authorized } = Route.useRouteContext();
	const [users, setUsers] = useState<any[]>([]);
	const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");

	if (authorized === false) {
		return <NotAuthorized />;
	}

	const fetchUsers = useCallback(async () => {
		try {
			setError(null);
			setLoading(true);
			const result = await authClient.admin.listUsers({
				query: {
					limit: 100,
				},
			});

			if (result.error) {
				setError(result.error.message || "Failed to fetch users");
			} else {
				setUsers(result.data?.users || []);
				setFilteredUsers(result.data?.users || []);
			}
		} catch (err: any) {
			setError(err.message || "An error occurred");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		if (authorized === false) {
			return;
		}
		fetchUsers();
	}, [authorized, fetchUsers]);

	useEffect(() => {
		if (searchQuery) {
			const filtered = users.filter((user) =>
				user.email.toLowerCase().includes(searchQuery.toLowerCase()),
			);
			setFilteredUsers(filtered);
		} else {
			setFilteredUsers(users);
		}
	}, [searchQuery, users]);

	return (
		<div className="min-h-screen px-6 py-10">
			<div className="mx-auto max-w-7xl">
				<div className="mb-8">
					<div className="mb-2 flex items-center gap-3">
						<div className="inline-flex items-center gap-2 rounded-full flag-chip px-3 py-1 text-xs font-semibold text-foreground/90 backdrop-blur">
							<Users className="size-3.5 text-[oklch(0.66_0.19_28)]" />
							Admin Panel
						</div>
					</div>
					<h1 className="mb-4 text-4xl font-black tracking-tight md:text-5xl">
						User Management
					</h1>
					<p className="text-slate-300 text-lg">
						Manage league participants, roles, and access
					</p>
				</div>

				{error && (
					<Alert variant="destructive" className="mb-6">
						<RefreshCw className="h-4 w-4" />
						<AlertTitle>Error</AlertTitle>
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				<div className="mb-6">
					<div className="relative">
						<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="text"
							placeholder="Search users by email..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9 h-10"
						/>
					</div>
				</div>

				{loading ? (
					<div className="flex items-center justify-center py-12">
						<RefreshCw className="h-8 w-8 animate-spin text-purple-500" />
					</div>
				) : (
					<div className="grid gap-4">
						{filteredUsers.length === 0 ? (
							<Card className="scorecard">
								<CardContent className="p-12 text-center">
									<div className="mb-4 inline-flex items-center justify-center rounded-full bg-slate-800/50 p-4">
										<Users className="h-8 w-8 text-slate-500" />
									</div>
									<h3 className="mb-2 text-lg font-semibold">
										{searchQuery ? "No users found" : "No users found"}
									</h3>
									<p className="text-sm text-muted-foreground">
										{searchQuery
											? "Try a different search term"
											: "No users have been registered yet"}
									</p>
								</CardContent>
							</Card>
						) : (
							<>
								<div className="text-sm text-muted-foreground">
									Showing {filteredUsers.length} user
									{filteredUsers.length !== 1 && "s"}
								</div>
								{filteredUsers.map((user) => (
									<Card key={user.id} className="scorecard">
										<CardContent className="p-6">
											<div className="flex items-start justify-between gap-4">
												<div className="min-w-0 flex-1">
													<div className="mb-2 flex items-center gap-3">
														<h3 className="text-lg font-semibold">
															{user.name}
														</h3>
														{user.banned ? (
															<div className="inline-flex items-center gap-1.5 rounded-full border border-red-800/50 bg-red-900/30 px-2 py-0.5 text-xs font-medium text-red-300">
																<ShieldAlert className="h-3 w-3" />
																Banned
															</div>
														) : (
															<div className="inline-flex items-center gap-1.5 rounded-full border border-green-800/50 bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-300">
																<Shield className="h-3 w-3" />
																Active
															</div>
														)}
													</div>
													<p className="mb-3 text-sm text-muted-foreground">
														{user.email}
													</p>
													<div className="flex items-center gap-4 text-sm">
														<div className="flex items-center gap-1.5">
															<Shield className="h-4 w-4 text-slate-400" />
															<span
																className={
																	user.role === "admin"
																		? "font-semibold text-purple-400"
																		: user.role === "data"
																			? "font-semibold text-blue-400"
																			: "text-slate-400"
																}
															>
																{user.role || "user"}
															</span>
														</div>
														{!user.emailVerified && (
															<span className="text-yellow-500">
																Email not verified
															</span>
														)}
													</div>
													{user.banned && user.banReason && (
														<p className="mt-2 text-xs text-red-400">
															Ban reason: {user.banReason}
														</p>
													)}
													<div className="mt-2 flex-shrink-0">
														<Link
															to={`/admin/users/${user.id}`}
															className="inline-flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-slate-200 border border-slate-600/50 rounded-lg hover:bg-slate-700/50 transition-all"
														>
															<Settings className="h-3.5 w-3.5" />
															Manage
														</Link>
													</div>
												</div>
											</div>
										</CardContent>
									</Card>
								))}
							</>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
