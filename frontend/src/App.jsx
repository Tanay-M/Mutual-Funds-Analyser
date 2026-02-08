import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import AnalysisPanel from './components/AnalysisPanel';
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

  const runComparison = async () => {
    if (selectedFunds.length === 0) {
      setComparisonData(null);
      return;
    }

    setLoading(true);
    const codes = selectedFunds.map(f => f.code);
    const data = await getComparison(codes, period, benchmark);
    setComparisonData(data);
    setLoading(false);
  };

  // Auto-run comparison when funds change, but maybe demand manual run for sliders unless we want real-time
  // The requirements said: "Optionally, make the app update automatically on slider change".
  // Let's do auto-update for everything for a smoother experience, but keep the button as well/primary trigger if needed.
  // Actually, for "hackathon-winning" feel, live updates are better.
  useEffect(() => {
    // Debounce slightly to avoid rapid API calls on slider drag
    const timer = setTimeout(() => {
      if (selectedFunds.length > 0) {
        runComparison();
      }
    }, 500);
    return () => clearTimeout(timer);
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
    <div className="flex h-screen w-full bg-gray-50 font-sans text-gray-900 overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar
        selectedFunds={selectedFunds}
        onAddFund={addFund}
        onRemoveFund={removeFund}
        benchmark={benchmark}
        setBenchmark={setBenchmark}
        period={period}
        setPeriod={setPeriod}
        onRunComparison={runComparison}
      />

      {/* Main Content Area */}
      <main className="flex-1 ml-80 h-full overflow-hidden">
        {loading && (
          <div className="absolute top-4 right-4 z-50">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        )}

        <AnalysisPanel
          comparisonData={comparisonData}
          benchmarkRate={benchmark}
        />
      </main>
    </div>
  );
}

export default App;
