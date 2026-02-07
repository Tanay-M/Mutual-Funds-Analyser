import { useState, useEffect } from 'react';
import { searchFunds } from '../api';

const SearchBar = ({ onAddFund }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isDirectGrowth, setIsDirectGrowth] = useState(true);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (query.length > 2) {
                setLoading(true);
                const filter = isDirectGrowth ? 'Direct Growth' : null;
                const data = await searchFunds(query, filter);
                setResults(data);
                setLoading(false);
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [query, isDirectGrowth]);

    const handleSelect = (fund) => {
        onAddFund(fund);
        setQuery('');
        setResults([]);
    };

    return (
        <div className="relative w-full max-w-2xl mx-auto mb-6">
            <div className="flex items-center gap-4">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search Mutual Funds..."
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <label className="flex items-center whitespace-nowrap gap-2 text-sm text-gray-700">
                    <input
                        type="checkbox"
                        checked={isDirectGrowth}
                        onChange={(e) => setIsDirectGrowth(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    Direct Growth Only
                </label>
            </div>

            {/* Results Dropdown */}
            {(results.length > 0 || loading) && query.length > 2 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {loading ? (
                        <div className="p-3 text-center text-gray-500">Loading...</div>
                    ) : results.length > 0 ? (
                        results.map((fund) => (
                            <div
                                key={fund.code}
                                onClick={() => handleSelect(fund)}
                                className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0"
                            >
                                <div className="font-medium text-gray-800">{fund.name}</div>
                                <div className="text-xs text-gray-500">Code: {fund.code}</div>
                            </div>
                        ))
                    ) : (
                        <div className="p-3 text-center text-gray-500">No results found</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchBar;
