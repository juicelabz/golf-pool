import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle, Flag, KeyRound, ShieldCheck } from "lucide-react";
import { useId, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/reset-password")({
	component: ResetPassword,
	beforeLoad: async () => {
		// Get token from URL params
		const url = new URL(window.location.href);
		const tokenFromUrl = url.searchParams.get("token") || url.hash.substring(1);

		return { tokenFromUrl };
	},
});

function ResetPassword() {
	const { tokenFromUrl } = Route.useRouteContext();
	const tokenId = useId();
	const passwordId = useId();
	const confirmPasswordId = useId();

	const [token, setToken] = useState(tokenFromUrl || "");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);

	const handleReset = async (e: React.FormEvent) => {
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
			const result = await authClient.resetPassword({
				token,
				newPassword: password,
			});

			if (result.error) {
				setError(
					result.error.message ||
						"Failed to reset password. The link may have expired.",
				);
			} else {
				setSuccess(true);
			}
		} catch (err: any) {
			setError(err.message || "An error occurred. Please try again.");
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
							Account recovery
						</div>
						<h1 className="mt-4 text-4xl font-black tracking-tight">
							Set a new password
						</h1>
						<p className="mt-2 text-sm text-muted-foreground">
							Paste your reset token and choose a new password.
						</p>
					</div>
				</div>

				<Card className="scorecard mt-6">
					<CardHeader className="border-b border-border/70 bg-background/20">
						<CardTitle className="text-xl font-black">New password</CardTitle>
					</CardHeader>
					<CardContent className="p-6">
						<form onSubmit={handleReset} className="space-y-5">
							{success ? (
								<Alert>
									<CheckCircle className="h-4 w-4" />
									<AlertTitle>Password updated!</AlertTitle>
									<AlertDescription>
										Your password has been successfully changed. You can now
										sign in with your new password.
										<div className="mt-4">
											<Link
												to="/login"
												className="inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
											>
												Proceed to sign in
											</Link>
										</div>
									</AlertDescription>
								</Alert>
							) : (
								<>
									<div className="space-y-2">
										<Label htmlFor={tokenId}>
											{tokenFromUrl ? "Reset token" : "Enter your token"}
										</Label>
										<div className="relative">
											<ShieldCheck className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
											<Input
												id={tokenId}
												value={token}
												onChange={(e) => setToken(e.target.value)}
												placeholder="Paste token from email link"
												className="pl-9"
												required
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
											<AlertTitle>Error</AlertTitle>
											<AlertDescription>{error}</AlertDescription>
										</Alert>
									)}

									<Button
										type="submit"
										disabled={loading}
										className="w-full h-10 font-semibold"
									>
										{loading ? "Updating..." : "Update password"}
									</Button>

									<div className="flex items-center justify-between text-sm">
										<Link
											to="/forgot-password"
											className="text-muted-foreground hover:text-foreground underline underline-offset-4"
										>
											Request a link
										</Link>
										<Link
											to="/login"
											className="text-muted-foreground hover:text-foreground underline underline-offset-4"
										>
											Back to sign in
										</Link>
									</div>
								</>
							)}
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
