import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Flag, KeyRound, Mail } from "lucide-react";
import { useId, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import { requireAuth } from "@/lib/session";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/login")({
	component: Login,
	validateSearch: (search: Record<string, unknown>) => ({
		redirect: typeof search.redirect === "string" ? search.redirect : undefined,
	}),
	beforeLoad: async () => {
		const result = await requireAuth();
		if (result.authenticated) {
			return {
				redirectTo: "/leaderboard",
			};
		}
		return result;
	},
});

function Login() {
	const router = useRouter();
	const emailId = useId();
	const passwordId = useId();
	const { redirect } = Route.useSearch();
	const { signIn } = useAuth();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			const result = await signIn(email, password);

			if (result.error) {
				setError(
					result.error.message ||
						"We couldn't sign you in. Check your email and password.",
				);
			} else {
				const redirectTo =
					redirect && redirect.startsWith("/") ? redirect : "/leaderboard";
				router.navigate({ to: redirectTo });
			}
		} catch (err: any) {
			setError(err.message || "Sign-in failed. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-dvh px-4 py-10 flex items-center justify-center">
			<div className="w-full max-w-md">
				<div className="scorecard golf-hero rounded-[calc(var(--radius)+0.5rem)]">
					<div className="relative px-6 py-10">
						<div className="inline-flex items-center gap-2 rounded-full flag-chip px-3 py-1 text-xs font-semibold text-foreground/90 backdrop-blur">
							<Flag className="size-3.5 text-[oklch(0.66_0.19_28)]" />
							Ytown Invitational • 2026
						</div>
						<h1 className="mt-4 text-4xl font-black tracking-tight">Sign in</h1>
						<p className="mt-2 text-sm text-muted-foreground">
							Access is limited to whitelisted emails.
						</p>
					</div>
				</div>

				<Card className="scorecard mt-6">
					<CardHeader className="border-b border-border/70 bg-background/20">
						<CardTitle className="text-xl font-black">Account</CardTitle>
					</CardHeader>
					<CardContent className="p-6">
						<form onSubmit={handleLogin} className="space-y-5">
							<div className="space-y-2">
								<Label htmlFor={emailId}>Email</Label>
								<div className="relative">
									<Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										id={emailId}
										type="email"
										autoComplete="email"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										required
										placeholder="you@example.com"
										className="pl-9"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor={passwordId}>Password</Label>
								<div className="relative">
									<KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										id={passwordId}
										type="password"
										autoComplete="current-password"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										required
										placeholder="••••••••"
										className="pl-9"
									/>
								</div>
							</div>

							{error && (
								<Alert variant="destructive">
									<AlertTitle>Sign-in failed</AlertTitle>
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							)}

							<Button
								type="submit"
								disabled={loading}
								className="w-full h-10 font-semibold"
							>
								{loading ? "Signing in..." : "Sign in"}
							</Button>

							<div className="flex items-center justify-between text-sm">
								<Link
									to="/forgot-password"
									className="text-muted-foreground hover:text-foreground underline underline-offset-4"
								>
									Forgot password?
								</Link>
								<Link
									to="/signup"
									className="text-muted-foreground hover:text-foreground underline underline-offset-4"
								>
									Create account
								</Link>
							</div>

							<Separator className="my-2" />

							<p className="text-xs text-muted-foreground leading-relaxed">
								This screen is UI-only scaffolding for your Better Auth flow.
							</p>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
