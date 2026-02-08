import { useState, useEffect } from "react";
import { Search, X, Plus, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { searchFunds } from "../api";

// Helper to debounce search calls
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
};

export default function Sidebar({
    selectedFunds,
    onAddFund,
    onRemoveFund,
    benchmark,
    setBenchmark,
    period,
    setPeriod,
    onRunComparison
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const debouncedSearchTerm = useDebounce(searchQuery, 300);

    useEffect(() => {
        const fetchFunds = async () => {
            if (debouncedSearchTerm.length < 3) {
                setSearchResults([]);
                return;
            }
            setIsSearching(true);
            const results = await searchFunds(debouncedSearchTerm);
            setSearchResults(results);
            setIsSearching(false);
        };

        fetchFunds();
    }, [debouncedSearchTerm]);

    const handleAddFund = (fund) => {
        onAddFund(fund);
        setSearchQuery("");
        setSearchResults([]);
    };

    return (
        <aside className="w-80 border-r bg-background flex flex-col h-screen fixed left-0 top-0 z-30 shadow-md">
            <div className="p-6 border-b">
                <div className="flex items-center gap-2 mb-1">
                    <div className="bg-primary/10 p-2 rounded-lg">
                        <BarChart3 className="h-6 w-6 text-primary" />
                    </div>
                    <h1 className="font-bold text-xl tracking-tight">FundAnalyser</h1>
                </div>
                <p className="text-xs text-muted-foreground ml-1">Professional Rolling Returns Engine</p>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
                {/* Search Section */}
                <section className="space-y-4">
                    <div>
                        <Label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">
                            Add Funds
                        </Label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search by name..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchResults.length > 0 && searchQuery && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 max-h-[300px] overflow-y-auto">
                                    {searchResults.map((fund) => (
                                        <button
                                            key={fund.code}
                                            onClick={() => handleAddFund(fund)}
                                            className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between group"
                                        >
                                            <span className="truncate pr-2">{fund.name}</span>
                                            <Plus className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <Label className="text-xs font-semibold uppercase text-muted-foreground mb-3 block">
                            Selected Funds ({selectedFunds.length})
                        </Label>
                        <div className="flex flex-wrap gap-2">
                            {selectedFunds.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic">No funds selected</p>
                            ) : (
                                selectedFunds.map((fund) => (
                                    <Badge
                                        key={fund.code}
                                        variant="secondary"
                                        className="flex items-center gap-1 pr-1 py-1 pl-2 text-xs"
                                    >
                                        <span className="truncate max-w-[150px]">{fund.name}</span>
                                        <button
                                            onClick={() => onRemoveFund(fund.code)}
                                            className="hover:bg-destructive/10 hover:text-destructive rounded-full p-0.5 transition-colors"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))
                            )}
                        </div>
                    </div>
                </section>

                {/* Controls Section */}
                <section className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Time Period</Label>
                            <span className="text-sm font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                                {period} Years
                            </span>
                        </div>
                        <Slider
                            value={[period]}
                            onValueChange={(vals) => setPeriod(vals[0])}
                            min={1}
                            max={10}
                            step={1}
                            className="py-2"
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                            <span>1Y</span>
                            <span>5Y</span>
                            <span>10Y</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium flex items-center gap-2">
                                Benchmark Rate
                            </Label>
                            <span className="text-sm font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                                {(benchmark * 100).toFixed(1)}%
                            </span>
                        </div>
                        <Slider
                            value={[benchmark * 100]} // work with percentage (1-15)
                            onValueChange={(vals) => setBenchmark(vals[0] / 100)}
                            min={1}
                            max={15}
                            step={0.5}
                            className="py-2"
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                            <span>1%</span>
                            <span>8%</span>
                            <span>15%</span>
                        </div>
                    </div>
                </section>
            </div>

            <div className="p-4 border-t mt-auto bg-gray-50/50">
                <Button
                    className="w-full shadow-lg hover:shadow-xl transition-all"
                    size="lg"
                    onClick={onRunComparison}
                >
                    Run Comparison
                </Button>
            </div>
        </aside>
    );
}
