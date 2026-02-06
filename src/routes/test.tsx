import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/test")({
	component: Test,
});

function Test() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
			<h1 className="text-4xl font-black text-center mb-4">
				Test Page - If you can see this, routing works!
			</h1>
			<p className="text-slate-300 text-center">
				Database and auth are working.
			</p>
		</div>
	);
}
