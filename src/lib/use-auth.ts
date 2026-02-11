import { authClient } from "./auth-client";

export function useAuth() {
	const {
		data: session,
		isPending: isLoading,
		error,
		refetch,
	} = authClient.useSession();

	const user = session?.user ?? null;
	const isAuthenticated = !!user;

	const signIn = async (email: string, password: string) => {
		return authClient.signIn.email({ email, password });
	};

	const signUp = async (email: string, password: string, name: string) => {
		return authClient.signUp.email({ email, password, name });
	};

	const signOut = async () => {
		return authClient.signOut();
	};

	return {
		isLoading,
		isAuthenticated,
		user,
		error,
		signIn,
		signUp,
		signOut,
		refetch,
	};
}
