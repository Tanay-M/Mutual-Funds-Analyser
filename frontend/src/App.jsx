import { useState, useEffect } from 'react';
import SearchBar from './components/SearchBar';
import FundCard from './components/FundCard';
import ChartComponent from './components/ChartComponent';
import { getComparison } from './api';

function App() {
  const [selectedFunds, setSelectedFunds] = useState([]);
  const [benchmark, setBenchmark] = useState(0.06);
  const [period, setPeriod] = useState(3.0);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Initial load - add PPFAS as example
  useEffect(() => {
    setSelectedFunds([{ code: "122639", name: "Parag Parikh Flexi Cap Fund - Direct Growth" }]);
  }, []);

  // Fetch comparison data when dependencies change
  useEffect(() => {
    if (selectedFunds.length === 0) {
      setComparisonData(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      const codes = selectedFunds.map(f => f.code);
      const data = await getComparison(codes, period, benchmark);
      setComparisonData(data);
      setLoading(false);
    };

    fetchData();
  }, [selectedFunds, benchmark, period]);

  const addFund = (fund) => {
    if (!selectedFunds.find(f => f.code === fund.code)) {
      setSelectedFunds([...selectedFunds, fund]);
    }
  };

  const removeFund = (code) => {
    setSelectedFunds(selectedFunds.filter(f => f.code !== code));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-blue-900 mb-2">
            Mutual Fund Analysis Engine
          </h1>
          <p className="text-gray-600">
            Compare rolling returns, volatility, and probability of success.
          </p>
        </header>

        {/* Search */}
        <SearchBar onAddFund={addFund} />

        {/* Controls */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-wrap gap-6 items-center justify-center">

          {/* Period Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-600">Period:</span>
            {[1, 3, 5].map((year) => (
              <button
                key={year}
                onClick={() => setPeriod(year)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${period === year
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {year}Y
              </button>
            ))}
          </div>

          {/* Benchmark Slider */}
          <div className="flex items-center gap-4 min-w-[300px]">
            <span className="text-sm font-semibold text-gray-600">Benchmark: {(benchmark * 100).toFixed(1)}%</span>
            <input
              type="range"
              min="0.04"
              max="0.15"
              step="0.005"
              value={benchmark}
              onChange={(e) => setBenchmark(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>

        {/* Main Content */}
        {loading && <div className="text-center py-10 text-gray-500">Updating analysis...</div>}

        {comparisonData && !loading && (
          <div className="space-y-8">
            {/* Chart Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm h-[400px]">
              <ChartComponent data={comparisonData} />
            </div>

            {/* Scorecards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.keys(comparisonData).map((code) => (
                <FundCard
                  key={code}
                  fundData={comparisonData[code]}
                  onRemove={() => removeFund(code)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
