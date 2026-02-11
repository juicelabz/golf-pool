import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { RefreshCw, Shield, ShieldAlert, Trash2, User, X } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { NotAuthorized } from "@/components/NotAuthorized";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";
import { requireRole } from "@/lib/session";

export const Route = createFileRoute("/admin/users/$userId")({
	component: UserDetail,
	beforeLoad: async ({ location }) => {
		const result = await requireRole(["admin"]);
		if (!result.authenticated) {
			const redirectPath = `${location.pathname}${location.search ?? ""}${
				location.hash ?? ""
			}`;
			throw redirect({
				to: "/login",
				search: { redirect: redirectPath },
			});
		}
		return result;
	},
	loader: async ({ params }) => {
		const result = await authClient.admin.getUser({
			query: { id: params.userId },
		});
		return { user: result.data, error: result.error };
	},
});

function UserDetail() {
	const { authorized } = Route.useRouteContext();
	const { user, error } = Route.useLoaderData();
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(false);
	const [roleDialogOpen, setRoleDialogOpen] = useState(false);
	const [banDialogOpen, setBanDialogOpen] = useState(false);
	const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	const banReasonId = useId();
	const newPasswordId = useId();
	const roleId = useId();

	const [selectedRole, setSelectedRole] = useState(user?.role || "user");
	const [banReason, setBanReason] = useState("");
	const [newPassword, setNewPassword] = useState("");

	if (authorized === false) {
		return <NotAuthorized />;
	}

	if (error) {
		return (
			<div className="min-h-screen px-6 py-10">
				<div className="mx-auto max-w-7xl">
					<Alert variant="destructive">
						<RefreshCw className="h-4 w-4" />
						<AlertTitle>Error</AlertTitle>
						<AlertDescription>
							{error.message || "Failed to load user details"}
						</AlertDescription>
					</Alert>
				</div>
			</div>
		);
	}

	if (!user) {
		return (
			<div className="min-h-screen px-6 py-10">
				<div className="mx-auto max-w-7xl">
					<Alert>
						<AlertTitle>User not found</AlertTitle>
						<AlertDescription>
							The requested user could not be found.
						</AlertDescription>
					</Alert>
					<Button
						onClick={() => navigate({ to: "/admin/users" })}
						className="mt-4"
					>
						Back to Users
					</Button>
				</div>
			</div>
		);
	}

	const handleRoleChange = async () => {
		try {
			setIsLoading(true);
			const result = await authClient.admin.setRole({
				userId: user.id,
				role: selectedRole as "user" | "admin",
			});

			if (result.error) {
				toast.error(result.error.message || "Failed to update role");
			} else {
				toast.success("Role updated successfully");
				setRoleDialogOpen(false);
				navigate({ to: "/admin/users", replace: true });
			}
		} catch (err: unknown) {
			toast.error(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setIsLoading(false);
		}
	};

	const handleBanToggle = async () => {
		try {
			setIsLoading(true);

			if (user.banned) {
				const result = await authClient.admin.unbanUser({
					userId: user.id,
				});

				if (result.error) {
					toast.error(result.error.message || "Failed to unban user");
				} else {
					toast.success("User unbanned successfully");
					setBanDialogOpen(false);
					navigate({
						to: "/admin/users/$userId",
						params: { userId: user.id },
						replace: true,
					});
				}
			}
		} catch (err: unknown) {
			toast.error(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setIsLoading(false);
		}
	};

	const handlePasswordReset = async () => {
		if (newPassword.length < 8) {
			toast.error("Password must be at least 8 characters long");
			return;
		}

		try {
			setIsLoading(true);
			const result = await authClient.admin.setUserPassword({
				userId: user.id,
				newPassword,
			});

			if (result.error) {
				toast.error(result.error.message || "Failed to reset password");
			} else {
				toast.success("Password reset successfully");
				setPasswordDialogOpen(false);
				setNewPassword("");
			}
		} catch (err: unknown) {
			toast.error(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setIsLoading(false);
		}
	};

	const handleDeleteUser = async () => {
		try {
			setIsLoading(true);
			const result = await authClient.admin.removeUser({
				userId: user.id,
			});

			if (result.error) {
				toast.error(result.error.message || "Failed to delete user");
			} else {
				toast.success("User deleted successfully");
				setDeleteDialogOpen(false);
				navigate({ to: "/admin/users" });
			}
		} catch (err: unknown) {
			toast.error(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setIsLoading(false);
		}
	};

	const formatDate = (date: Date | string | null | undefined) => {
		if (!date) return "N/A";
		return new Date(date).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	return (
		<div className="min-h-screen px-6 py-10">
			<div className="mx-auto max-w-7xl">
				<div className="mb-8">
					<div className="mb-2 flex items-center gap-3">
						<div className="inline-flex items-center gap-2 rounded-full flag-chip px-3 py-1 text-xs font-semibold text-foreground/90 backdrop-blur">
							<User className="size-3.5 text-[oklch(0.66_0.19_28)]" />
							Admin Panel
						</div>
					</div>
					<div className="mb-6 flex items-center gap-4">
						<h1 className="mb-4 text-4xl font-black tracking-tight md:text-5xl">
							User Details
						</h1>
						<Button
							variant="ghost"
							onClick={() => navigate({ to: "/admin/users" })}
							className="m-0 h-8 gap-1"
						>
							<X className="size-4" />
							Back
						</Button>
					</div>
				</div>

				<div className="grid gap-6 lg:grid-cols-2">
					<Card className="scorecard">
						<CardHeader>
							<CardTitle>Profile Information</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
									<Label className="text-muted-foreground">Name:</Label>
									<span className="font-medium">{user.name || "N/A"}</span>

									<Label className="text-muted-foreground">Email:</Label>
									<span className="font-medium">{user.email}</span>

									<Label className="text-muted-foreground">Role:</Label>
									<span
										className={
											user.role === "admin"
												? "font-semibold text-purple-400"
												: user.role === "data"
													? "font-semibold text-blue-400"
													: "text-slate-400"
										}
									>
										{user.role || "user"}
									</span>

									<Label className="text-muted-foreground">Status:</Label>
									{user.banned ? (
										<div className="inline-flex items-center gap-1.5 rounded-full border border-red-800/50 bg-red-900/30 px-2 py-0.5 text-xs font-medium text-red-300">
											<ShieldAlert className="h-3 w-3" />
											Banned
										</div>
									) : (
										<div className="inline-flex items-center gap-1.5 rounded-full border border-green-800/50 bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-300">
											<Shield className="h-3 w-3" />
											Active
										</div>
									)}

									<Label className="text-muted-foreground">
										Email Verified:
									</Label>
									<span>{user.emailVerified ? "Yes" : "No"}</span>

									<Label className="text-muted-foreground">Created:</Label>
									<span>{formatDate(user.createdAt)}</span>

									{user.banned && user.banReason && (
										<>
											<Label className="text-muted-foreground">
												Ban Reason:
											</Label>
											<span className="text-red-400">{user.banReason}</span>
										</>
									)}
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="scorecard">
						<CardHeader>
							<CardTitle>Actions</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex flex-col gap-3">
								<Button
									onClick={() => {
										setSelectedRole(
											(user.role === "admin" || user.role === "data"
												? "admin"
												: "user") as "user" | "admin",
										);
										setRoleDialogOpen(true);
									}}
									disabled={isLoading}
								>
									<Shield className="mr-2 size-4" />
									Change Role
								</Button>

								<Button
									onClick={() => {
										if (!user.banned) {
											setBanReason("");
										}
										setBanDialogOpen(true);
									}}
									variant={user.banned ? "secondary" : "destructive"}
									disabled={isLoading}
								>
									{user.banned ? (
										<>
											<Shield className="mr-2 size-4" />
											Unban User
										</>
									) : (
										<>
											<ShieldAlert className="mr-2 size-4" />
											Ban User
										</>
									)}
								</Button>

								<Button
									onClick={() => {
										setNewPassword("");
										setPasswordDialogOpen(true);
									}}
									variant="outline"
									disabled={isLoading}
								>
									<RefreshCw className="mr-2 size-4" />
									Reset Password
								</Button>

								<Button
									onClick={() => setDeleteDialogOpen(true)}
									variant="destructive"
									disabled={isLoading}
								>
									<Trash2 className="mr-2 size-4" />
									Delete User
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>

				<Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Change User Role</DialogTitle>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="grid gap-2">
								<Label htmlFor={roleId}>Role</Label>
								<Select
									value={selectedRole}
									onValueChange={(value) =>
										setSelectedRole(value as "user" | "admin")
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select role" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="user">User</SelectItem>
										<SelectItem value="admin">Administrator</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setRoleDialogOpen(false)}
								disabled={isLoading}
							>
								Cancel
							</Button>
							<Button onClick={handleRoleChange} disabled={isLoading}>
								{isLoading ? "Saving..." : "Save"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				<Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>
								{user.banned ? "Unban User" : "Ban User"}
							</DialogTitle>
							<DialogDescription>
								{user.banned
									? "Are you sure you want to unban this user? They will regain access to the application."
									: "Are you sure you want to ban this user? They will lose access to the application."}
							</DialogDescription>
						</DialogHeader>
						{!user.banned && (
							<div className="grid gap-4 py-4">
								<div className="grid gap-2">
									<Label htmlFor={banReasonId}>Ban Reason (Optional)</Label>
									<Input
										id={banReasonId}
										placeholder="Reason for banning"
										value={banReason}
										onChange={(e) => setBanReason(e.target.value)}
									/>
								</div>
							</div>
						)}
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setBanDialogOpen(false)}
								disabled={isLoading}
							>
								Cancel
							</Button>
							<Button
								onClick={handleBanToggle}
								variant={user.banned ? "default" : "destructive"}
								disabled={isLoading}
							>
								{isLoading ? "Processing..." : user.banned ? "Unban" : "Ban"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				<Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Reset User Password</DialogTitle>
							<DialogDescription>
								Enter a new password for this user. The password must be at
								least 8 characters long.
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="grid gap-2">
								<Label htmlFor={newPasswordId}>New Password</Label>
								<Input
									id={newPasswordId}
									type="password"
									placeholder="Enter new password"
									value={newPassword}
									onChange={(e) => setNewPassword(e.target.value)}
								/>
							</div>
						</div>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setPasswordDialogOpen(false)}
								disabled={isLoading}
							>
								Cancel
							</Button>
							<Button onClick={handlePasswordReset} disabled={isLoading}>
								{isLoading ? "Resetting..." : "Reset Password"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Delete User</DialogTitle>
							<DialogDescription>
								Are you sure you want to permanently delete this user? This
								action cannot be undone.
							</DialogDescription>
						</DialogHeader>
						<div className="py-4">
							<Alert variant="destructive">
								<ShieldAlert className="h-4 w-4" />
								<AlertTitle>Warning</AlertTitle>
								<AlertDescription>
									This will permanently remove the user and all their data from
									the system.
								</AlertDescription>
							</Alert>
						</div>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setDeleteDialogOpen(false)}
								disabled={isLoading}
							>
								Cancel
							</Button>
							<Button
								onClick={handleDeleteUser}
								variant="destructive"
								disabled={isLoading}
							>
								{isLoading ? "Deleting..." : "Delete"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
}
