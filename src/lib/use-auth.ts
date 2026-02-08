import { useEffect, useState } from "react";
import { authClient } from "./auth-client";

export interface AuthState {
	isLoading: boolean;
	isAuthenticated: boolean;
	user: any | null;
	error: Error | null;
}

export function useAuth() {
	const [session, setSession] = useState<any | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	const isAuthenticated = !!session?.user;
	const user = session?.user ?? null;

	const refetch = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const result = await authClient.getSession();
			setSession(result.data);
		} catch (err) {
			console.error("Session fetch error:", err);
			setError(err as Error);
			setSession(null);
		} finally {
			setIsLoading(false);
		}
	};

	// Initial session fetch
	useEffect(() => {
		refetch();
	}, []);

	// Setup periodic session refresh
	useEffect(() => {
		if (!isAuthenticated) return;

		const interval = setInterval(
			() => {
				refetch();
			},
			1000 * 60 * 10,
		); // Refresh every 10 minutes

		return () => clearInterval(interval);
	}, [isAuthenticated]);

	const signIn = async (email: string, password: string) => {
		try {
			const result = await authClient.signIn.email({ email, password });
			if (result.data) {
				setSession(result.data);
			}
			return result;
		} catch (err) {
			console.error("Sign in error:", err);
			throw err;
		}
	};

	const signUp = async (email: string, password: string, name?: string) => {
		try {
			const result = await authClient.signUp.email({ email, password, name });
			if (result.data) {
				setSession(result.data);
			}
			return result;
		} catch (err) {
			console.error("Sign up error:", err);
			throw err;
		}
	};

	const signOut = async () => {
		try {
			await authClient.signOut();
			setSession(null);
		} catch (err) {
			console.error("Sign out error:", err);
			throw err;
		}
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
