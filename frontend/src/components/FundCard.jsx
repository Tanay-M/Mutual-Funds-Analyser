const FundCard = ({ fundData, onRemove }) => {
    const { name, metrics, probabilities } = fundData;

    const getMetricColor = (val) => val > 0 ? 'text-green-600' : 'text-red-600';

    return (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow relative">
            <button
                onClick={onRemove}
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
            >
                ×
            </button>

            <h3 className="font-bold text-lg text-gray-800 mb-4 h-14 overflow-hidden line-clamp-2" title={name}>
                {name}
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <div className="text-xs text-gray-500 uppercase">Mean Return</div>
                    <div className={`text-xl font-bold ${getMetricColor(metrics.mean)}`}>
                        {(metrics.mean * 100).toFixed(2)}%
                    </div>
                </div>
                <div>
                    <div className="text-xs text-gray-500 uppercase">Volatility</div>
                    <div className="text-xl font-bold text-gray-800">
                        {(metrics.std_dev * 100).toFixed(2)}%
                    </div>
                </div>
            </div>

            <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Prob. of Loss</span>
                    <span className={`font-medium ${probabilities.negative > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {(probabilities.negative * 100).toFixed(0)}%
                    </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Beat Benchmark</span>
                    <span className="font-medium text-blue-600">
                        {(probabilities.beat_benchmark * 100).toFixed(0)}%
                    </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Alpha (&gt;12%)</span>
                    <span className="font-medium text-purple-600">
                        {(probabilities.beat_12pct * 100).toFixed(0)}%
                    </span>
                </div>
            </div>
        </div>
    );
};

export default FundCard;
