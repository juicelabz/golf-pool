import { Link } from "@tanstack/react-router";
import {
	Flag,
	Home,
	LogOut,
	Menu,
	Settings,
	Trophy,
	User,
	Users,
	X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/use-auth";

export default function Header() {
	const [isOpen, setIsOpen] = useState(false);
	const { isAuthenticated, user, signOut, isLoading } = useAuth();

	return (
		<>
			<header className="sticky top-0 z-50 border-b border-border/70 bg-background/55 backdrop-blur-xl">
				<div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
					<button
						type="button"
						onClick={() => setIsOpen(true)}
						className="inline-flex size-10 items-center justify-center rounded-lg border border-border/70 bg-background/30 hover:bg-background/40 transition-colors"
						aria-label="Open menu"
					>
						<Menu size={20} />
					</button>

					<Link to="/" className="flex items-center gap-3">
						<div className="size-10 rounded-xl border border-border/70 bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center">
							<Flag className="size-5 text-[oklch(0.66_0.19_28)]" />
						</div>
						<div className="leading-tight">
							<div className="text-base font-black tracking-tight">
								Ytown Invitational
							</div>
							<div className="text-[11px] text-muted-foreground">
								Fantasy Golf Pool • 2026
							</div>
						</div>
					</Link>

					<div className="ml-auto flex items-center gap-2">
						{!isLoading && isAuthenticated && (
							<>
								<Link
									to="/leaderboard"
									search={{ page: 1, pageSize: 20 }}
									className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-border/70 bg-background/30 px-3 py-2 text-sm font-semibold hover:bg-background/40 transition-colors"
								>
									<Trophy className="size-4 text-primary" />
									Leaderboard
								</Link>
								<Link
									to="/rosters"
									className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-border/70 bg-background/30 px-3 py-2 text-sm font-semibold hover:bg-background/40 transition-colors"
								>
									<Users className="size-4 text-[oklch(0.66_0.19_28)]" />
									Rosters
								</Link>
								{user?.role === "admin" || user?.role === "data" ? (
									<Link
										to="/admin"
										className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-border/70 bg-background/30 px-3 py-2 text-sm font-semibold hover:bg-background/40 transition-colors"
									>
										<Settings className="size-4 text-[oklch(0.66_0.19_28)]" />
										Admin
									</Link>
								) : null}
								<div className="hidden sm:flex items-center gap-2 border-l border-border/50 pl-2 ml-2">
									<div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-background/20">
										<User className="size-4 text-muted-foreground" />
										<span className="text-sm font-medium text-foreground">
											{user?.name || user?.email}
										</span>
									</div>
									{/*<button
										type="button"
										onClick={async () => {
											try {
												await signOut();
												window.location.href = "/login";
											} catch (error) {
												console.error("Sign out error:", error);
											}
										}}
										className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-background/30 px-3 py-2 text-sm font-semibold hover:bg-background/40 transition-colors"
									>
										<LogOut className="size-4" />
										<span className="hidden sm:inline">Sign out</span>
									</button>*/}
								</div>
							</>
						)}
						{!isLoading && !isAuthenticated && (
							<Link
								to="/login"
								className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-border/70 bg-primary/15 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/25 transition-colors"
							>
								<User className="size-4" />
								Sign in
							</Link>
						)}
					</div>
				</div>
			</header>

			<aside
				className={`fixed top-0 left-0 h-full w-80 bg-card/95 text-foreground shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-r border-border/70 ${
					isOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="flex items-center justify-between p-4 border-b border-border/70 bg-background/20">
					<h2 className="text-lg font-black tracking-tight">Clubhouse</h2>
					<button
						type="button"
						onClick={() => setIsOpen(false)}
						className="inline-flex size-10 items-center justify-center rounded-lg border border-border/70 bg-background/30 hover:bg-background/40 transition-colors"
						aria-label="Close menu"
					>
						<X size={18} />
					</button>
				</div>

				<nav className="flex-1 p-4 overflow-y-auto">
					{!isLoading && isAuthenticated && (
						<>
							<Link
								to="/"
								onClick={() => setIsOpen(false)}
								className="flex items-center gap-3 p-3 rounded-xl hover:bg-background/20 transition-colors mb-2"
								activeProps={{
									className:
										"flex items-center gap-3 p-3 rounded-xl bg-primary/15 ring-1 ring-primary/25 transition-colors mb-2",
								}}
							>
								<Home size={20} />
								<span className="font-medium">Home</span>
							</Link>

							{/* Golf Pool Links */}
							<Link
								to="/leaderboard"
								search={{ page: 1, pageSize: 20 }}
								onClick={() => setIsOpen(false)}
								className="flex items-center gap-3 p-3 rounded-xl hover:bg-background/20 transition-colors mb-2"
								activeProps={{
									className:
										"flex items-center gap-3 p-3 rounded-xl bg-primary/15 ring-1 ring-primary/25 transition-colors mb-2",
								}}
							>
								<Trophy size={20} />
								<span className="font-medium">Leaderboard</span>
							</Link>
							<Link
								to="/rosters"
								onClick={() => setIsOpen(false)}
								className="flex items-center gap-3 p-3 rounded-xl hover:bg-background/20 transition-colors mb-2"
								activeProps={{
									className:
										"flex items-center gap-3 p-3 rounded-xl bg-primary/15 ring-1 ring-primary/25 transition-colors mb-2",
								}}
							>
								<Users size={20} />
								<span className="font-medium">Rosters</span>
							</Link>

							{user?.role === "admin" || user?.role === "data" ? (
								<Link
									to="/admin"
									onClick={() => setIsOpen(false)}
									className="flex items-center gap-3 p-3 rounded-xl hover:bg-background/20 transition-colors mb-2"
									activeProps={{
										className:
											"flex items-center gap-3 p-3 rounded-xl bg-primary/15 ring-1 ring-primary/25 transition-colors mb-2",
									}}
								>
									<Settings size={20} />
									<span className="font-medium">Admin</span>
								</Link>
							) : null}

							<div className="border-t border-border/70 my-4 pt-4">
								<div className="flex items-center gap-3 p-3 rounded-xl bg-background/10 mb-2">
									<User size={20} className="text-muted-foreground" />
									<div className="flex-1 min-w-0">
										<div className="font-medium text-sm text-foreground truncate">
											{user?.name || "User"}
										</div>
										<div className="text-xs text-muted-foreground truncate">
											{user?.email}
										</div>
										{user?.role && (
											<div className="text-xs text-primary capitalize">
												{user.role}
											</div>
										)}
									</div>
								</div>

								<button
									type="button"
									onClick={async () => {
										try {
											await signOut();
											window.location.href = "/login";
										} catch (error) {
											console.error("Sign out error:", error);
										}
									}}
									className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-background/20 transition-colors text-sm font-medium text-foreground"
								>
									<LogOut size={20} />
									<span>Sign out</span>
								</button>
							</div>
						</>
					)}

					{!isLoading && !isAuthenticated && (
						<Link
							to="/login"
							onClick={() => setIsOpen(false)}
							className="flex items-center gap-3 p-3 rounded-xl hover:bg-background/20 transition-colors mb-2"
							activeProps={{
								className:
									"flex items-center gap-3 p-3 rounded-xl bg-primary/15 ring-1 ring-primary/25 transition-colors mb-2",
							}}
						>
							<User size={20} />
							<span className="font-medium">Sign in</span>
						</Link>
					)}

					{isLoading && (
						<div className="flex items-center justify-center p-8">
							<div className="text-sm text-muted-foreground">Loading...</div>
						</div>
					)}
				</nav>
			</aside>
		</>
	);
}
