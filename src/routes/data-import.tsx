import { createFileRoute, redirect } from "@tanstack/react-router";
import {
	AlertCircle,
	CheckCircle,
	Download,
	History,
	Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { NotAuthorized } from "@/components/NotAuthorized";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ImportPreview } from "@/lib/csv-parser";
import { getCSVTemplate } from "@/lib/csv-parser";
import { commitImport, previewImport } from "@/lib/import-server";
import { requireRole } from "@/lib/session";

export const Route = createFileRoute("/data-import")({
	component: DataImport,
	beforeLoad: async ({ location }) => {
		const result = await requireRole(["admin", "data"]);
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
});

function DataImport() {
	const routeContext = Route.useRouteContext();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [uploadStatus, setUploadStatus] = useState<
		"idle" | "uploading" | "preview" | "success" | "error"
	>("idle");
	const [uploadProgress, setUploadProgress] = useState(0);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [preview, setPreview] = useState<ImportPreview | null>(null);
	const [error, setError] = useState<string | null>(null);

	// Handle authorization
	if (routeContext.authorized === false) {
		return <NotAuthorized />;
	}

	const handleFileSelect = async (file: File) => {
		if (!file.name.endsWith(".csv")) {
			setError("Please select a CSV file");
			return;
		}

		setSelectedFile(file);
		setError(null);
		setUploadStatus("uploading");
		setUploadProgress(0);

		try {
			// Read file content
			const csvContent = await file.text();
			setUploadProgress(50);

			// Get preview from server
			const previewResult = await previewImport({ data: { csvContent } });
			setUploadProgress(100);

			setPreview(previewResult);
			setUploadStatus("preview");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to process file");
			setUploadStatus("error");
		}
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = () => {
		setIsDragging(false);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);

		const files = e.dataTransfer.files;
		if (files.length > 0) {
			handleFileSelect(files[0]);
		}
	};

	const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files && files.length > 0) {
			handleFileSelect(files[0]);
		}
	};

	const downloadTemplate = () => {
		const template = getCSVTemplate();
		const blob = new Blob([template], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "tournament-template.csv";
		a.click();
		URL.revokeObjectURL(url);
	};

	const resetImport = () => {
		setSelectedFile(null);
		setPreview(null);
		setError(null);
		setUploadStatus("idle");
		setUploadProgress(0);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleCommit = async () => {
		if (!preview || !preview.canCommit) return;

		setUploadStatus("uploading");
		try {
			const result = await commitImport({
				data: { results: preview.validRows },
			});
			if (result.success) {
				setUploadStatus("success");
				// You could add a success message here
			} else {
				setError(result.message);
				setUploadStatus("error");
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to commit import");
			setUploadStatus("error");
		}
	};

	return (
		<div className="min-h-dvh">
			<div className="mx-auto max-w-6xl px-6 pt-12 pb-16">
				<div className="scorecard golf-hero rounded-[calc(var(--radius)+0.5rem)]">
					<div className="relative px-6 py-10 md:px-12 md:py-12">
						<div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
							<div>
								<div className="inline-flex items-center gap-2 rounded-full flag-chip px-3 py-1 text-xs font-semibold text-foreground/90 backdrop-blur">
									<Upload className="size-3.5 text-[oklch(0.66_0.19_28)]" />
									Data import
								</div>
								<h1 className="mt-4 text-balance text-4xl md:text-6xl font-black tracking-tight">
									Bring in tournament results
								</h1>
								<p className="mt-2 max-w-2xl text-sm md:text-base text-muted-foreground">
									Upload a CSV to update scoring. This page is styled and ready;
									wire the actual import logic when you’re ready.
								</p>
							</div>

							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									className="h-10 px-5 border-border/80 bg-background/30 hover:bg-background/40 font-semibold"
									onClick={downloadTemplate}
								>
									<Download className="size-4" />
									Template
								</Button>
								<Button
									variant="outline"
									className="h-10 px-5 border-border/80 bg-background/30 hover:bg-background/40 font-semibold"
								>
									<History className="size-4" />
									History
								</Button>
							</div>
						</div>
					</div>
				</div>

				<div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
					<Card
						className={`scorecard lg:col-span-2 overflow-hidden transition-colors ${
							isDragging ? "ring-2 ring-primary/35" : ""
						}`}
					>
						<CardHeader className="border-b border-border/70 bg-background/20">
							<CardTitle className="text-xl md:text-2xl font-black flex items-center gap-3">
								<span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/25">
									<Upload className="size-4 text-primary" />
								</span>
								Import CSV
							</CardTitle>
						</CardHeader>
						<CardContent className="p-6 space-y-5">
							<input
								ref={fileInputRef}
								type="file"
								accept=".csv"
								onChange={handleFileInputChange}
								className="hidden"
							/>
							<button
								type="button"
								onDragOver={handleDragOver}
								onDragLeave={handleDragLeave}
								onDrop={handleDrop}
								onClick={() => fileInputRef.current?.click()}
								className={[
									"w-full rounded-2xl border border-dashed px-6 py-10 text-left transition-colors",
									"bg-background/20 hover:bg-background/25",
									isDragging ? "border-primary/60" : "border-border/70",
								].join(" ")}
							>
								<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
									<div className="flex items-start gap-4">
										<div className="mt-0.5 inline-flex size-12 items-center justify-center rounded-xl border border-border/70 bg-background/25">
											{uploadStatus === "success" ? (
												<CheckCircle className="size-6 text-primary" />
											) : uploadStatus === "error" ? (
												<AlertCircle className="size-6 text-destructive" />
											) : (
												<Upload className="size-6 text-muted-foreground" />
											)}
										</div>

										<div>
											<div className="text-base font-semibold">
												{uploadStatus === "idle" && "Drop your CSV here"}
												{uploadStatus === "uploading" && "Processing import…"}
												{uploadStatus === "success" && "Upload complete"}
												{uploadStatus === "error" && "Upload failed"}
											</div>
											<p className="mt-1 text-sm text-muted-foreground">
												{uploadStatus === "idle" &&
													"Drag & drop or click to select a file."}
												{uploadStatus === "uploading" &&
													"Parsing, validating, and staging scoring updates."}
												{uploadStatus === "success" &&
													"Data has been staged (hook up the real importer next)."}
												{uploadStatus === "error" &&
													"Something went wrong. Try again once wired."}
											</p>
										</div>
									</div>

									<div className="flex items-center gap-2">
										{uploadStatus === "preview" ||
										uploadStatus === "success" ? (
											<Button
												variant="outline"
												className="h-10 border-border/80 bg-background/30 hover:bg-background/40 font-semibold"
												onClick={resetImport}
											>
												Import another
											</Button>
										) : (
											<Button
												className="h-10 font-semibold"
												onClick={() => fileInputRef.current?.click()}
											>
												Select file
											</Button>
										)}
									</div>
								</div>

								{uploadStatus === "uploading" && (
									<div className="mt-6 space-y-2">
										<Progress value={uploadProgress} />
										<div className="text-xs text-muted-foreground">
											{uploadProgress}% complete
										</div>
									</div>
								)}
							</button>

							{selectedFile && (
								<div className="rounded-xl border border-border/70 bg-background/20 px-4 py-3 text-xs text-muted-foreground">
									Selected file:{" "}
									<span className="font-semibold text-foreground">
										{selectedFile.name}
									</span>
								</div>
							)}

							{error && (
								<div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
									{error}
								</div>
							)}

							{/* Preview Section */}
							{preview && (
								<div className="rounded-xl border border-border/70 bg-background/20 p-4">
									<div className="flex items-center justify-between gap-3">
										<h3 className="text-sm font-black tracking-tight">
											Import Preview
										</h3>
										<Badge
											variant={preview.canCommit ? "default" : "destructive"}
											className={
												preview.canCommit
													? "bg-primary/15 border-primary/30"
													: ""
											}
										>
											{preview.canCommit ? "Ready to import" : "Has errors"}
										</Badge>
									</div>
									<div className="mt-3 space-y-2 text-sm">
										<div className="flex justify-between">
											<span>Total rows:</span>
											<span className="font-semibold">
												{preview.summary.totalRows}
											</span>
										</div>
										<div className="flex justify-between">
											<span>Valid rows:</span>
											<span className="font-semibold text-green-600">
												{preview.summary.validRows}
											</span>
										</div>
										<div className="flex justify-between">
											<span>Errors:</span>
											<span className="font-semibold text-red-600">
												{preview.summary.errors}
											</span>
										</div>
										<div className="flex justify-between">
											<span>Warnings:</span>
											<span className="font-semibold text-yellow-600">
												{preview.summary.warnings}
											</span>
										</div>
									</div>
									{preview.canCommit && (
										<div className="mt-4 pt-4 border-t border-border/70">
											<Button
												onClick={handleCommit}
												disabled={uploadStatus === "uploading"}
												className="w-full"
											>
												{uploadStatus === "uploading"
													? "Importing..."
													: "Commit Import"}
											</Button>
										</div>
									)}
								</div>
							)}

							<div className="rounded-xl border border-border/70 bg-background/20 p-4">
								<div className="flex items-center justify-between gap-3">
									<h3 className="text-sm font-black tracking-tight">
										CSV format
									</h3>
									<Badge variant="outline" className="bg-background/25">
										TournamentID • GolferName • Rank
									</Badge>
								</div>
								<pre className="mt-3 text-xs text-muted-foreground font-mono leading-relaxed">
									TournamentID,GolferName,Rank{"\n"}
									sony-open,Tommy Fleetwood,1{"\n"}
									sony-open,Rory McIlroy,2{"\n"}…
								</pre>
							</div>
						</CardContent>
					</Card>

					<div className="space-y-6">
						<Card className="scorecard">
							<CardHeader className="border-b border-border/70 bg-background/20">
								<CardTitle className="text-lg font-black flex items-center gap-2">
									<span className="inline-flex size-7 items-center justify-center rounded-lg bg-background/25 ring-1 ring-border/60">
										<History className="size-3.5 text-[oklch(0.66_0.19_28)]" />
									</span>
									Recent imports
								</CardTitle>
							</CardHeader>
							<CardContent className="p-6">
								<div className="space-y-3">
									{[
										{
											file: "sony-open-results.csv",
											date: "2 hours ago",
											status: "success" as const,
										},
										{
											file: "american-express-results.csv",
											date: "2 days ago",
											status: "success" as const,
										},
										{
											file: "farmers-insurance-results.csv",
											date: "5 days ago",
											status: "success" as const,
										},
										{
											file: "pebble-beach-results.csv",
											date: "1 week ago",
											status: "error" as const,
										},
									].map((import_, index) => (
										<div
											key={import_.file + String(index)}
											className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/20 px-4 py-3 hover:bg-background/25 transition-colors"
										>
											<div className="flex items-center gap-3 min-w-0">
												{import_.status === "success" ? (
													<CheckCircle className="size-5 text-primary shrink-0" />
												) : (
													<AlertCircle className="size-5 text-destructive shrink-0" />
												)}
												<div className="min-w-0">
													<p className="truncate text-sm font-semibold">
														{import_.file}
													</p>
													<p className="text-[11px] text-muted-foreground">
														{import_.date}
													</p>
												</div>
											</div>

											<Badge
												variant="outline"
												className={[
													"bg-background/25",
													import_.status === "success"
														? "text-primary border-primary/30"
														: "text-destructive border-destructive/30",
												].join(" ")}
											>
												{import_.status === "success" ? "Complete" : "Failed"}
											</Badge>
										</div>
									))}
								</div>
							</CardContent>
						</Card>

						<Card className="scorecard">
							<CardHeader className="border-b border-border/70 bg-background/20">
								<CardTitle className="text-lg font-black">
									Import stats
								</CardTitle>
							</CardHeader>
							<CardContent className="p-6">
								<div className="grid grid-cols-2 gap-3">
									<div className="rounded-xl border border-border/70 bg-background/20 p-3 text-center">
										<div className="text-xl font-black text-foreground">
											156
										</div>
										<div className="mt-1 text-[11px] text-muted-foreground">
											Total
										</div>
									</div>
									<div className="rounded-xl border border-border/70 bg-background/20 p-3 text-center">
										<div className="text-xl font-black text-primary">149</div>
										<div className="mt-1 text-[11px] text-muted-foreground">
											Successful
										</div>
									</div>
									<div className="rounded-xl border border-border/70 bg-background/20 p-3 text-center">
										<div className="text-xl font-black text-[oklch(0.66_0.19_28)]">
											7
										</div>
										<div className="mt-1 text-[11px] text-muted-foreground">
											Pending
										</div>
									</div>
									<div className="rounded-xl border border-border/70 bg-background/20 p-3 text-center">
										<div className="text-xl font-black text-foreground">
											98%
										</div>
										<div className="mt-1 text-[11px] text-muted-foreground">
											Rate
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
