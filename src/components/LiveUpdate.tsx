import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

interface LiveUpdateProps {
	onRefresh?: () => void;
	autoRefreshInterval?: number;
}

export function LiveUpdate({
	onRefresh,
	autoRefreshInterval = 30000,
}: LiveUpdateProps) {
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [lastUpdated, setLastUpdated] = useState(new Date());
	const [nextUpdate, setNextUpdate] = useState(0);

	useEffect(() => {
		const updateTimer = setInterval(() => {
			setNextUpdate((prev) => (prev > 0 ? prev - 1000 : 0));
		}, 1000);

		return () => clearInterval(updateTimer);
	}, [autoRefreshInterval]);

	useEffect(() => {
		const refreshInterval = setInterval(() => {
			if (isRefreshing) return;

			setLastUpdated(new Date());
			setNextUpdate(autoRefreshInterval);

			if (onRefresh) {
				onRefresh();
			}
		}, autoRefreshInterval);

		return () => clearInterval(refreshInterval);
	}, [autoRefreshInterval, onRefresh, isRefreshing]);

	const formatTime = (timeUntil: number) => {
		if (timeUntil < 1000) return "now";
		if (timeUntil < 60000) return `${Math.floor(timeUntil / 1000)}s`;
		if (timeUntil < 3600000) return `${Math.floor(timeUntil / 60000)}m`;
		return `${Math.floor(timeUntil / 3600000)}h`;
	};

	return (
		<div className="flex items-center gap-4">
			<div className="relative">
				<div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
				<div className="w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary/50" />
			</div>

			<div className="flex flex-col">
				<span className="text-xs font-semibold text-primary">
					{isRefreshing ? "Updating..." : "Auto-refresh"}
				</span>
				<span className="text-xs text-muted-foreground">
					{formatTime(nextUpdate)}
				</span>
			</div>

			<div className="flex-1 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

			<div className="flex items-center gap-2">
				<span className="text-xs text-muted-foreground">
					Last: {lastUpdated.toLocaleTimeString()}
				</span>
				<button
					onClick={() => {
						setIsRefreshing(true);
						if (onRefresh) {
							onRefresh();
						}
						setTimeout(() => setIsRefreshing(false), 2000);
					}}
					disabled={isRefreshing}
					className="p-1.5 rounded-lg bg-background/30 hover:bg-background/40 border border-border/60 transition-colors"
					aria-label="Refresh leaderboard"
				>
					<RefreshCw
						className={`size-4 text-primary ${isRefreshing ? "animate-spin" : ""}`}
					/>
				</button>
			</div>
		</div>
	);
}
