import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Flag, KeyRound, Mail, User } from "lucide-react";
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

export const Route = createFileRoute("/signup")({
	component: Signup,
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

function Signup() {
	const router = useRouter();
	const { refetch } = useAuth();
	const nameId = useId();
	const emailId = useId();
	const passwordId = useId();
	const confirmPasswordId = useId();

	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleSignup = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (password !== confirmPassword) {
			setError("Passwords do not match.");
			return;
		}

		if (password.length < 8) {
			setError("Password must be at least 8 characters.");
			return;
		}

		setLoading(true);

		try {
			const result = await authClient.signUp.email({
				name,
				email,
				password,
			});

			if (result.error) {
				setError("Not allowed.");
			} else {
				setError(null);
				await refetch();
				router.navigate({ to: "/leaderboard" });
			}
		} catch {
			setError("Not allowed.");
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
						<h1 className="mt-4 text-4xl font-black tracking-tight">
							Create account
						</h1>
						<p className="mt-2 text-sm text-muted-foreground">
							Only whitelisted emails can register.
						</p>
					</div>
				</div>

				<Card className="scorecard mt-6">
					<CardHeader className="border-b border-border/70 bg-background/20">
						<CardTitle className="text-xl font-black">Registration</CardTitle>
					</CardHeader>
					<CardContent className="p-6">
						<form onSubmit={handleSignup} className="space-y-5">
							<div className="space-y-2">
								<Label htmlFor={nameId}>Name</Label>
								<div className="relative">
									<User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										id={nameId}
										value={name}
										onChange={(e) => setName(e.target.value)}
										placeholder="First Last"
										className="pl-9"
									/>
								</div>
							</div>

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
										autoComplete="new-password"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										required
										placeholder="At least 8 characters"
										className="pl-9"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor={confirmPasswordId}>Confirm password</Label>
								<div className="relative">
									<KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										id={confirmPasswordId}
										type="password"
										autoComplete="new-password"
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										required
										placeholder="Repeat password"
										className="pl-9"
									/>
								</div>
							</div>

							{error && (
								<Alert variant="destructive">
									<AlertTitle>Registration failed</AlertTitle>
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							)}

							<Button
								type="submit"
								disabled={loading}
								className="w-full h-10 font-semibold"
							>
								{loading ? "Creating account..." : "Create account"}
							</Button>

							<div className="text-center text-sm text-muted-foreground">
								Already have an account?{" "}
								<Link
									to="/login"
									className="text-foreground underline underline-offset-4"
								>
									Sign in
								</Link>
							</div>

							<Separator className="my-2" />

							<p className="text-xs text-muted-foreground leading-relaxed">
								Note: Only whitelisted email addresses can create accounts.
							</p>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
