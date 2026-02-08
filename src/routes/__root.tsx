import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import * as React from "react";
import { NotFound } from "@/components/NotFound";
import Header from "../components/Header";
import { requireAuth } from "../lib/session";
import appCss from "../styles.css?url";

if (typeof window !== "undefined") {
	(window as Window & { React?: typeof React }).React = React;
}

export const Route = createRootRoute({
	beforeLoad: async ({ location }) => {
		// Auth checks here rely on the Better Auth client, so enforce on client only.
		if (typeof window === "undefined") {
			return;
		}

		if (location.pathname === "/login" || location.pathname === "/signup") {
			return;
		}

		const result = await requireAuth();
		if (!result.authenticated) {
			const redirectPath = `${location.pathname}${location.search ?? ""}${
				location.hash ?? ""
			}`;
			return {
				redirectTo: `/login?redirect=${encodeURIComponent(redirectPath)}`,
			};
		}
		return result;
	},
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Ytown Invitational • Fantasy Golf Pool",
			},
			{
				name: "description",
				content:
					"2026 Fantasy Golf Pool — live leaderboard, rosters, and tournament scoring.",
			},
		],
		links: [
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com",
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous",
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..900&family=Instrument+Sans:ital,wght@0,400..700;1,400..700&display=swap",
			},
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),

	shellComponent: RootDocument,

	notFoundComponent: NotFound,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<Header />
				{children}
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
