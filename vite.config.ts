import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

const config = defineConfig({
	plugins: [
		tsConfigPaths({
			projects: ["./tsconfig.json"],
		}),
		devtools(),
		tanstackStart(),
		tailwindcss(),
	],
});

export default config;
