import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, CheckCircle, Download, Upload } from "lucide-react";
import { useState } from "react";
import { NotAuthorized } from "@/components/NotAuthorized";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/session";

export const Route = createFileRoute("/data-import")({
	component: DataImport,
	beforeLoad: async () => {
		const result = await requireRole(["admin", "data"]);
		if (!result.authenticated) {
			return {
				redirectTo: "/login",
			};
		}
		return result;
	},
});

function DataImport() {
	const { authorized } = Route.useRouteContext();
	const [isDragging, setIsDragging] = useState(false);
	const [uploadStatus, setUploadStatus] = useState<
		"idle" | "uploading" | "success" | "error"
	>("idle");
	const [uploadProgress, setUploadProgress] = useState(0);

	if (authorized === false) {
		return <NotAuthorized />;
	}

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
		// Handle file drop logic here
		simulateUpload();
	};

	const simulateUpload = () => {
		setUploadStatus("uploading");
		setUploadProgress(0);

		const progressInterval = setInterval(() => {
			setUploadProgress((prev) => {
				if (prev >= 100) {
					clearInterval(progressInterval);
					setUploadStatus("success");
					return 100;
				}
				return prev + 10;
			});
		}, 200);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
			<div className="relative overflow-hidden">
				{/* Animated background elements */}
				<div className="absolute inset-0">
					<div className="absolute top-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
					<div className="absolute bottom-20 left-20 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl animate-pulse delay-1000" />
				</div>

				<div className="relative z-10 px-6 py-24">
					<div className="max-w-4xl mx-auto">
						<div className="text-center mb-12">
							<h1 className="text-6xl md:text-7xl font-black tracking-tight mb-4">
								<span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-600 bg-clip-text text-transparent">
									Data Import Portal
								</span>
							</h1>
							<p className="text-xl text-slate-300 max-w-2xl mx-auto">
								Upload tournament results and scoring data for the golf pool
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
							{/* Upload Section */}
							<Card
								className={`backdrop-blur-xl bg-slate-800/50 border border-slate-700/50 transition-all duration-300 ${
									isDragging
										? "border-purple-500/50 shadow-2xl shadow-purple-500/20"
										: "shadow-2xl"
								}`}
							>
								<CardHeader className="bg-gradient-to-r from-slate-800/90 to-slate-900/90 border-b border-slate-700/50">
									<CardTitle className="text-2xl font-black flex items-center gap-3">
										<div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full" />
										Import Tournament Results
									</CardTitle>
								</CardHeader>
								<CardContent className="p-6 space-y-4">
									{/* Upload Area */}
									<button
										type="button"
										onDragOver={handleDragOver}
										onDragLeave={handleDragLeave}
										onDrop={handleDrop}
										className={`w-full border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer ${
											isDragging
												? "border-purple-500 bg-purple-500/10"
												: "border-slate-600 hover:border-purple-500 hover:bg-purple-500/5"
										}`}
									>
										{uploadStatus === "idle" && (
											<>
												<Upload className="w-16 h-16 mx-auto mb-4 text-slate-400" />
												<p className="text-lg text-slate-300 font-black mb-2">
													Drag and drop CSV file here
												</p>
												<p className="text-sm text-slate-500 mb-4">
													or click to browse
												</p>
												<Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700">
													Select File
												</Button>
											</>
										)}

										{uploadStatus === "uploading" && (
											<>
												<div className="w-16 h-16 mx-auto mb-4 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
												<p className="text-lg text-slate-300 font-black mb-4">
													Processing...
												</p>
												<div className="w-full bg-slate-700 rounded-full h-2">
													<div
														className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-200"
														style={{ width: `${uploadProgress}%` }}
													/>
												</div>
												<p className="text-sm text-slate-400 mt-2">
													{uploadProgress}% complete
												</p>
											</>
										)}

										{uploadStatus === "success" && (
											<>
												<CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
												<p className="text-lg text-green-400 font-black mb-2">
													Upload Complete!
												</p>
												<p className="text-sm text-slate-400 mb-4">
													Data has been successfully imported
												</p>
												<Button
													variant="outline"
													className="border-green-600 text-green-300 hover:bg-green-700 hover:text-slate-200"
												>
													Import Another File
												</Button>
											</>
										)}

										{uploadStatus === "error" && (
											<>
												<AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
												<p className="text-lg text-red-400 font-black mb-2">
													Upload Failed
												</p>
												<p className="text-sm text-slate-400 mb-4">
													There was an error processing your file
												</p>
												<Button
													variant="outline"
													className="border-red-600 text-red-300 hover:bg-red-700 hover:text-slate-200"
												>
													Try Again
												</Button>
											</>
										)}
									</button>

									{/* CSV Format Instructions */}
									<div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
										<h3 className="text-sm font-black text-slate-300 mb-2">
											CSV Format
										</h3>
										<pre className="text-xs text-slate-400 font-mono">
											TournamentID,GolferName,Rank
											<br />
											sony-open,Tommy Fleetwood,1
											<br />
											sony-open,Rory McIlroy,2
											<br />
											...
										</pre>
									</div>

									{/* Quick Actions */}
									<div className="flex gap-3">
										<Button
											variant="outline"
											className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-200"
										>
											<Download className="w-4 h-4 mr-2" />
											Download Template
										</Button>
										<Button
											variant="outline"
											className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-200"
										>
											View Import History
										</Button>
									</div>
								</CardContent>
							</Card>

							{/* Import History */}
							<Card className="backdrop-blur-xl bg-slate-800/50 border border-slate-700/50 shadow-2xl">
								<CardHeader className="bg-gradient-to-r from-green-800/90 to-emerald-900/90 border-b border-slate-700/50">
									<CardTitle className="text-2xl font-black flex items-center gap-2">
										<div className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" />
										Recent Imports
									</CardTitle>
								</CardHeader>
								<CardContent className="p-6">
									<div className="space-y-3">
										{[
											{
												file: "sony-open-results.csv",
												date: "2 hours ago",
												status: "success",
											},
											{
												file: "american-express-results.csv",
												date: "2 days ago",
												status: "success",
											},
											{
												file: "farmers-insurance-results.csv",
												date: "5 days ago",
												status: "success",
											},
											{
												file: "pebble-beach-results.csv",
												date: "1 week ago",
												status: "error",
											},
										].map((import_, index) => (
											<div
												key={import_.file + String(index)}
												className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700/30 hover:border-green-500/30 transition-colors"
											>
												<div className="flex items-center gap-3">
													{import_.status === "success" ? (
														<CheckCircle className="w-5 h-5 text-green-400" />
													) : (
														<AlertCircle className="w-5 h-5 text-red-400" />
													)}
													<div>
														<p className="font-black text-slate-100">
															{import_.file}
														</p>
														<p className="text-xs text-slate-500">
															{import_.date}
														</p>
													</div>
												</div>
												<div className="flex items-center gap-2">
													<span
														className={`text-xs font-black ${
															import_.status === "success"
																? "text-green-400"
																: "text-red-400"
														}`}
													>
														{import_.status === "success"
															? "Complete"
															: "Failed"}
													</span>
												</div>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						</div>

						{/* Import Statistics */}
						<div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
							<Card className="backdrop-blur-xl bg-slate-800/50 border border-slate-700/50">
								<CardContent className="p-6 text-center">
									<div className="text-4xl font-black text-cyan-400 font-bold mb-2">
										156
									</div>
									<div className="text-sm text-slate-400">Total Imports</div>
								</CardContent>
							</Card>
							<Card className="backdrop-blur-xl bg-slate-800/50 border border-slate-700/50">
								<CardContent className="p-6 text-center">
									<div className="text-4xl font-black text-green-400 font-bold mb-2">
										149
									</div>
									<div className="text-sm text-slate-400">Successful</div>
								</CardContent>
							</Card>
							<Card className="backdrop-blur-xl bg-slate-800/50 border border-slate-700/50">
								<CardContent className="p-6 text-center">
									<div className="text-4xl font-black text-amber-400 font-bold mb-2">
										7
									</div>
									<div className="text-sm text-slate-400">Pending Review</div>
								</CardContent>
							</Card>
							<Card className="backdrop-blur-xl bg-slate-800/50 border border-slate-700/50">
								<CardContent className="p-6 text-center">
									<div className="text-4xl font-black text-purple-400 font-bold mb-2">
										98%
									</div>
									<div className="text-sm text-slate-400">Success Rate</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
