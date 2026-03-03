import { useState, useEffect } from 'react';
import api from '../api';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler, // Import Filler for area charts
} from 'chart.js';
import Spinner from '../components/Spinner';
import Card from './ui/Card'; // Import our new Card component

// Register Chart.js components
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
);

// --- SVG Icons (Heroicons) ---
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
const BoxIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0-5.455-1.789c-.186-.011-.37-.02-.55-.022A12.31 12.31 0 0 1 3 13.593V10.141a12.31 12.31 0 0 1 8.945-8.472L12 0l3.055 1.669a12.31 12.31 0 0 1 8.945 8.472v3.452a12.31 12.31 0 0 1-9 5.535v-1.139Z" /></svg>;
// --- End SVG Icons ---


// --- StatCard component ---
const StatCard = ({ title, value, icon, colorClass }) => (
  <div className={`relative overflow-hidden rounded-[2rem] p-6 shadow-xl border border-white/20 bg-white/80 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}>
    <div className={`absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 rounded-full ${colorClass} opacity-10 blur-2xl`}></div>
    <div className="relative z-10 flex items-start justify-between">
      <div>
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">{title}</p>
        <p className="text-4xl font-bold text-gray-900 tracking-tight">{value}</p>
      </div>
      <div className={`p-4 rounded-2xl ${colorClass} text-white shadow-lg`}>
        {icon}
      </div>
    </div>
  </div>
);
// --- End StatCard ---


function Dashboard() {
  const [stats, setStats] = useState({ familiesHelped: 0, remainingStock: 0, volunteersActive: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [chartData, setChartData] = useState(null);
  const [loadingChart, setLoadingChart] = useState(true);

  // Fetch stats data
  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await api.get('/dashboard-stats');
        setStats(response.data);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoadingStats(false);
      }
    }
    fetchStats();
  }, []);

  // Fetch chart data
  useEffect(() => {
    async function fetchChartData() {
      try {
        setLoadingChart(true);
        const response = await api.get('/distribution-trends');
        if (response.data && response.data.labels && response.data.data) {
          setChartData({
            labels: response.data.labels,
            datasets: [
              {
                label: 'Items Distributed',
                data: response.data.data,
                borderColor: '#4f46e5', // Primary Color
                backgroundColor: (context) => {
                  const ctx = context.chart.ctx;
                  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                  gradient.addColorStop(0, 'rgba(79, 70, 229, 0.4)');
                  gradient.addColorStop(1, 'rgba(79, 70, 229, 0.0)');
                  return gradient;
                },
                fill: true,
                tension: 0.4, // Smooth curve
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#4f46e5',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
              },
            ],
          });
        } else {
          console.error("Received invalid chart data format:", response.data);
          setChartData(null);
        }
      } catch (error) {
        console.error("Error fetching chart data:", error);
        setChartData(null);
      } finally {
        setLoadingChart(false);
      }
    }
    fetchChartData();
  }, []);


  // Chart.js options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 12,
        cornerRadius: 8,
        titleFont: { family: 'Outfit', size: 14 },
        bodyFont: { family: 'Inter', size: 13 },
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Inter' }, color: '#64748b' }
      },
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9', borderDash: [2, 2] },
        ticks: { font: { family: 'Inter' }, color: '#64748b', stepSize: 10 }
      }
    }
  };


  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-primary-dark via-primary to-secondary-dark rounded-[2.5rem] p-8 sm:p-12 overflow-hidden shadow-2xl mb-10 border border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-10 left-10 w-96 h-96 bg-secondary-light/20 rounded-full mix-blend-overlay filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h2 className="text-4xl sm:text-5xl font-heading font-bold text-white mb-3 tracking-tight">Dashboard Overview</h2>
            <p className="text-white/80 text-lg max-w-2xl font-light">
              Track distribution trends, active volunteers, and remaining stock at a glance.
            </p>
          </div>
          <div>
            <span className="text-sm text-primary-dark font-bold bg-white/90 px-4 py-2 rounded-2xl shadow-lg backdrop-blur-md">
              Last 7 Days
            </span>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      {loadingStats ? (
        <div className="flex justify-center p-12"><Spinner /></div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard
            title="Families Helped"
            value={stats.familiesHelped}
            icon={<CheckIcon />}
            colorClass="bg-gradient-to-br from-green-400 to-green-600"
          />
          <StatCard
            title="Remaining Stock"
            value={stats.remainingStock}
            icon={<BoxIcon />}
            colorClass="bg-gradient-to-br from-blue-400 to-blue-600"
          />
          <StatCard
            title="Active Volunteers"
            value={stats.volunteersActive}
            icon={<UsersIcon />}
            colorClass="bg-gradient-to-br from-indigo-400 to-primary"
          />
        </div>
      )}

      {/* Chart Section */}
      <div className="mt-8">
        <Card className="p-8 border-0 shadow-xl bg-white/80 backdrop-blur-xl ring-1 ring-black/5 rounded-[2rem]">
          <div className="mb-6">
            <h3 className="text-2xl font-heading font-bold text-gray-900 mb-1">Distribution Trends</h3>
            <p className="text-base text-gray-500 font-light">Daily aid distribution volume</p>
          </div>

          <div className="relative h-80 w-full">
            {loadingChart ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Spinner />
              </div>
            ) : chartData && chartData.labels && chartData.labels.length > 0 ? (
              <Line options={chartOptions} data={chartData} />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center flex-col text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                <p className="text-sm font-medium">No distribution data available</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;