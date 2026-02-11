export function resolvePostLoginRedirect(
	redirectPath: string | undefined,
): string {
	if (redirectPath?.startsWith("/") && !redirectPath.startsWith("//")) {
		return redirectPath;
	}

	return "/leaderboard";
}
