import { createFileRoute, Link } from "@tanstack/react-router";
import { Flag, Mail } from "lucide-react";
import { useId, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { authClient } from "../lib/auth-client";

export const Route = createFileRoute("/forgot-password")({
	component: ForgotPassword,
});

function ForgotPassword() {
	const emailId = useId();
	const [email, setEmail] = useState("");
	const [note, setNote] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleSend = async (e: React.FormEvent) => {
		e.preventDefault();
		setNote(null);
		setLoading(true);

		try {
			const result = await authClient.requestPasswordReset({
				email,
				redirectTo: `${window.location.origin}/reset-password`,
			});

			if (result.error) {
				setNote(
					result.error.message ||
						"Failed to send reset email. Please try again.",
				);
			} else {
				setNote(
					"Password reset email sent! Please check your inbox (and spam folder) for instructions.",
				);
			}
		} catch (err: any) {
			setNote(err.message || "An error occurred. Please try again.");
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
							Reset password
						</h1>
						<p className="mt-2 text-sm text-muted-foreground">
							We’ll send a reset link to your email address.
						</p>
					</div>
				</div>

				<Card className="scorecard mt-6">
					<CardHeader className="border-b border-border/70 bg-background/20">
						<CardTitle className="text-xl font-black">Email link</CardTitle>
					</CardHeader>
					<CardContent className="p-6">
						<form onSubmit={handleSend} className="space-y-5">
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

							{note && (
								<Alert>
									<AlertTitle>Scaffold</AlertTitle>
									<AlertDescription>{note}</AlertDescription>
								</Alert>
							)}

							<Button
								type="submit"
								disabled={loading}
								className="w-full h-10 font-semibold"
							>
								{loading ? "Sending..." : "Send reset link"}
							</Button>

							<div className="flex items-center justify-between text-sm">
								<Link
									to="/login"
									className="text-muted-foreground hover:text-foreground underline underline-offset-4"
								>
									Back to sign in
								</Link>
								<Link
									to="/reset-password"
									className="text-muted-foreground hover:text-foreground underline underline-offset-4"
								>
									Have a token?
								</Link>
							</div>

							<Separator className="my-2" />

							<p className="text-xs text-muted-foreground leading-relaxed">
								UI scaffold only. Wire this to Better Auth’s reset email flow.
							</p>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
