type VitestListEntry = {
	file: string;
};

async function run(): Promise<void> {
	// Vitest+Bun in this repo appears to execute only one matched test file per invocation.
	// Work around by listing test files, then running each file explicitly.
	const listProc = Bun.spawn(
		["bunx", "--bun", "vitest", "list", "--filesOnly", "--json"],
		{
			stdout: "pipe",
			stderr: "inherit",
		},
	);

	const stdout = await new Response(listProc.stdout).text();
	const listExitCode = await listProc.exited;
	if (listExitCode !== 0) {
		throw new Error(`vitest list failed (exit ${listExitCode})`);
	}

	const files = (JSON.parse(stdout) as VitestListEntry[])
		.map((e) => e.file)
		.filter(Boolean);

	if (files.length === 0) {
		// Match Vitest's passWithNoTests behavior.
		process.exit(0);
	}

	for (const file of files) {
		const proc = Bun.spawn(
			[
				"bunx",
				"--bun",
				"vitest",
				"run",
				"--config",
				"vitest.config.ts",
				file,
			],
			{
				stdout: "inherit",
				stderr: "inherit",
			},
		);

		const code = await proc.exited;
		if (code !== 0) {
			process.exit(code);
		}
	}
}

await run();

