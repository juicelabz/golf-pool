import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "@tanstack/react-router";
import { type RenderOptions, render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

const AllTheProviders = ({ children }: { children: ReactNode }) => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	});

	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
};

const customRender = (
	ui: ReactElement,
	options?: Omit<RenderOptions, "wrapper">,
) => render(ui, { wrapper: AllTheProviders, ...options });

export function createMockRouter(
	initialEntries: string[] = ["/"],
	routeConfig: unknown[] = [],
) {
	const router = createMemoryRouter(
		[
			{
				path: "/",
				element: <div>Home</div>,
			},
			{
				path: "/login",
				element: <div>Login</div>,
			},
			{
				path: "/signup",
				element: <div>Signup</div>,
			},
			{
				path: "/admin",
				element: <div>Admin</div>,
			},
			{
				path: "/data-import",
				element: <div>Data Import</div>,
			},
			...routeConfig,
		],
		{
			initialEntries,
		},
	);

	return router;
}

export function renderWithRouter(
	_ui: ReactElement,
	{
		initialEntries = ["/"],
		routeConfig = [],
	}: { initialEntries?: string[]; routeConfig?: unknown[] } = {},
) {
	const router = createMockRouter(initialEntries, routeConfig);
	return customRender(<RouterProvider router={router} />);
}

export * from "@testing-library/react";
export { customRender as render };
