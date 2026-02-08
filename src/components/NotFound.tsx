import { Link } from "@tanstack/react-router";
import { File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function NotFound() {
	return (
		<div className="min-h-dvh px-6 py-16">
			<div className="mx-auto w-full max-w-xl">
				<Card className="scorecard">
					<CardContent className="p-10 text-center">
						<div className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-full border border-amber-400/30 bg-amber-500/10">
							<File className="size-6 text-amber-400" />
						</div>
						<h1 className="text-2xl font-black tracking-tight">
							Page not found
						</h1>
						<p className="mt-2 text-sm text-muted-foreground">
							The page you are looking for does not exist.
						</p>
						<div className="mt-6 flex items-center justify-center gap-3">
							<Button asChild className="h-10 px-5 font-semibold">
								<Link to="/">Return to home</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
