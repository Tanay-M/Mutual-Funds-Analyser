import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function MetricCard({ fundData }) {
    if (!fundData) return null;

    // Helper to format percentage
    const fmt = (num) => `${(num * 100).toFixed(2)}%`;

    // Determine color for probability metrics
    const getProbColor = (val, type) => {
        if (type === 'loss') {
            return val > 0.3 ? "text-destructive" : "text-green-600";
        }
        if (type === 'beat') {
            return val > 0.6 ? "text-green-600" : "text-yellow-600";
        }
        return "text-foreground";
    };

    return (
        <Card className="overflow-hidden hover:shadow-md transition-shadow border-t-4 border-t-primary">
            <CardHeader className="bg-secondary/20 pb-4">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    {fundData.name}
                </CardTitle>
                <div className="text-2xl font-bold mt-1">
                    {/* Placeholder for current NAV or other primary stat if available */}
                    {fmt(fundData.metrics?.mean)} <span className="text-xs font-normal text-muted-foreground">Mean Return</span>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="grid grid-cols-2 divide-x divide-y border-t bg-background">
                    <div className="p-4 flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Prob. of Loss</span>
                        <span className={cn("text-lg font-semibold", getProbColor(fundData.probabilities?.negative, 'loss'))}>
                            {fmt(fundData.probabilities?.negative)}
                        </span>
                    </div>
                    <div className="p-4 flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Beat Benchmark</span>
                        <span className={cn("text-lg font-semibold", getProbColor(fundData.probabilities?.beat_benchmark, 'beat'))}>
                            {fmt(fundData.probabilities?.beat_benchmark)}
                        </span>
                    </div>
                    <div className="p-4 flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Min Return</span>
                        <span className="text-lg font-semibold text-destructive">
                            {fmt(fundData.metrics?.min)}
                        </span>
                    </div>
                    <div className="p-4 flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Volatility (Std Dev)</span>
                        <span className="text-lg font-semibold">
                            {fmt(fundData.metrics?.std_dev)}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
