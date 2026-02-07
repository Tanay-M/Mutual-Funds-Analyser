import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const colors = [
    'rgb(75, 192, 192)',   // Teal
    'rgb(255, 99, 132)',   // Red
    'rgb(53, 162, 235)',   // Blue
    'rgb(255, 205, 86)',   // Yellow
    'rgb(153, 102, 255)',  // Purple
];

const ChartComponent = ({ data }) => {
    if (!data || Object.keys(data).length === 0) return null;

    // Prepare Chart Data
    // We need a common set of labels (dates). Since funds might have different start dates,
    // typically we'd align them. For simplicity, we'll take dates from the first fund
    // and assume reasonable overlap for the "Last 100 days" view we built in backend.

    const firstFundKey = Object.keys(data)[0];
    const labels = data[firstFundKey].series_data.map(item => item.date);

    const datasets = Object.keys(data).map((key, index) => {
        const fund = data[key];
        return {
            label: fund.name,
            data: fund.series_data.map(item => item.rolling_return * 100), // Convert to %
            borderColor: colors[index % colors.length],
            backgroundColor: colors[index % colors.length],
            tension: 0.3,
            pointRadius: 0,
            pointHoverRadius: 5
        };
    });

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Rolling Returns Over Time (%)' },
            tooltip: {
                mode: 'index',
                intersect: false,
            }
        },
        scales: {
            y: {
                title: { display: true, text: 'Return %' }
            }
        }
    };

    return <Line options={options} data={{ labels, datasets }} />;
};

export default ChartComponent;
