import tsConfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

// Keep Vitest config isolated from app Vite plugins (TanStack Start, Tailwind, etc.)
// to avoid plugin side-effects during test collection/execution.
export default defineConfig({
	plugins: [
		tsConfigPaths({
			projects: ["./tsconfig.json"],
		}),
	],
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: ["./src/test/setup.ts"],
		include: ["src/**/*.test.{ts,tsx}", "src/**/*.spec.{ts,tsx}"],
		passWithNoTests: true,
	},
});

