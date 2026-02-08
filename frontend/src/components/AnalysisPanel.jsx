import { useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from "recharts";
import MetricCard from "./MetricCard";
import { Card, CardContent } from "@/components/ui/card";

// Colors for chart lines (using CSS variables mapped to hex for Recharts if needed, 
// or using the CSS variable directly if supported, but Recharts usually needs hex/string)
const CHART_COLORS = [
    "hsl(221.2, 83.2%, 53.3%)", // Primary Blue
    "hsl(12, 76%, 61%)",       // Orange
    "hsl(173, 58%, 39%)",      // Teal
    "hsl(197, 37%, 24%)",      // Dark Blue
    "hsl(43, 74%, 66%)",       // Yellow
];

export default function AnalysisPanel({ comparisonData, benchmarkRate }) {
    if (!comparisonData) {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-4 text-muted-foreground">
                <div className="p-4 bg-secondary rounded-full">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-12 h-12 opacity-50"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
                        />
                    </svg>
                </div>
                <div className="text-center">
                    <h3 className="font-semibold text-lg">No Analysis Running</h3>
                    <p className="max-w-xs mx-auto text-sm">Select funds from the sidebar and click "Run Comparison" to generate insights.</p>
                </div>
            </div>
        );
    }

    // Process data for Recharts
    const chartData = useMemo(() => {
        if (!comparisonData) return [];

        const funds = Object.keys(comparisonData).filter(k => k !== 'chartData');
        const dateMap = new Map();

        funds.forEach(fundCode => {
            const fund = comparisonData[fundCode];
            if (fund.series_data) {
                fund.series_data.forEach(point => {
                    const date = point.date; // date string YYYY-MM-DD
                    if (!dateMap.has(date)) {
                        dateMap.set(date, { date, benchmark: benchmarkRate });
                    }
                    const entry = dateMap.get(date);
                    entry[fundCode] = point.rolling_return;
                });
            }
        });

        // Convert map to sorted array
        return Array.from(dateMap.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [comparisonData, benchmarkRate]);

    return (
        <div className="p-8 space-y-8 h-full overflow-y-auto">
            {/* Chart Section */}
            <Card className="shadow-sm border-none bg-white/50 backdrop-blur-sm">
                <CardContent className="p-6">
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 12, fill: '#888' }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 12, fill: '#888' }}
                                    tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    formatter={(val) => [`${(val * 100).toFixed(2)}%`]}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend />

                                {/* Benchmark Line */}
                                <Line
                                    type="monotone"
                                    dataKey="benchmark"
                                    stroke="#94a3b8"
                                    strokeDasharray="5 5"
                                    strokeWidth={2}
                                    dot={false}
                                    name={`Benchmark ${(benchmarkRate * 100).toFixed(1)}%`}
                                />

                                {/* Fund Lines - We need to map dynamically */}
                                {/* IF chartData structure is [{date: '...', fund1: 0.12, fund2: 0.15}, ...] */}
                                {Object.keys(comparisonData || {}).filter(k => k !== 'chartData').map((fundCode, index) => (
                                    <Line
                                        key={fundCode}
                                        type="monotone"
                                        dataKey={fundCode}
                                        name={comparisonData[fundCode].name}
                                        stroke={CHART_COLORS[index % CHART_COLORS.length]}
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 6 }}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Object.keys(comparisonData || {}).filter(k => k !== 'chartData').map((fundCode) => (
                    <MetricCard
                        key={fundCode}
                        fundData={comparisonData[fundCode]}
                    />
                ))}
            </div>
        </div>
    );
}
