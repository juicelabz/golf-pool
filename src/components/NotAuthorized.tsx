import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function NotAuthorized() {
	return (
		<div className="min-h-dvh px-6 py-16">
			<div className="mx-auto w-full max-w-xl">
				<Card className="scorecard">
					<CardContent className="p-10 text-center">
						<div className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-full border border-amber-400/30 bg-amber-500/10">
							<ShieldAlert className="size-6 text-amber-400" />
						</div>
						<h1 className="text-2xl font-black tracking-tight">
							Not authorized
						</h1>
						<p className="mt-2 text-sm text-muted-foreground">
							You do not have access to this section. If you think this is a
							mistake, contact the commissioner.
						</p>
						<div className="mt-6 flex items-center justify-center gap-3">
							<Button asChild className="h-10 px-5 font-semibold">
								<Link to="/leaderboard">Return to leaderboard</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
