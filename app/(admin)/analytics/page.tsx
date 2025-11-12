'use client';

import { useState, useEffect } from 'react';
import { ArrowUpIcon, ArrowDownIcon, RefreshCwIcon } from 'lucide-react';
import HeatmapChart from '@/components/analytics/HeatmapChart';
import TopMoversTable from '@/components/analytics/TopMoversTable';
import InfluenceChart from '@/components/analytics/InfluenceChart';
import SentimentGauge from '@/components/analytics/SentimentGauge';
import GasAnalytics from '@/components/analytics/GasAnalytics';

type Period = '24h' | '7d' | '30d';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('24h');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalVolume: 0,
    activeWhales: 0,
    avgInfluence: 0
  });

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch stats from API
      const response = await fetch(`/api/analytics/stats?period=${period}`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Advanced Analytics</h1>
          <p className="text-gray-400">Deep insights into whale behavior</p>
        </div>
        
        <div className="flex gap-4">
          {/* Period Selector */}
          <div className="flex gap-2 bg-gray-900 p-1 rounded-lg">
            {(['24h', '7d', '30d'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-md transition-colors ${
                  period === p
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCwIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Transactions"
          value={stats.totalTransactions.toLocaleString()}
          icon={<ArrowUpIcon className="w-6 h-6 text-green-500" />}
          trend="+12%"
        />
        <StatCard
          title="Total Volume"
          value={`$${(stats.totalVolume / 1000000).toFixed(1)}M`}
          icon={<ArrowUpIcon className="w-6 h-6 text-green-500" />}
          trend="+8%"
        />
        <StatCard
          title="Active Whales"
          value={stats.activeWhales.toString()}
          icon={<ArrowUpIcon className="w-6 h-6 text-green-500" />}
          trend="+3"
        />
        <StatCard
          title="Avg Influence"
          value={`${stats.avgInfluence.toFixed(1)}%`}
          icon={<ArrowDownIcon className="w-6 h-6 text-red-500" />}
          trend="-2%"
        />
      </div>

      {/* Charts Grid */}
      <div className="space-y-8">
        {/* Row 1: Heatmap + Sentiment */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <HeatmapChart period={period} />
          </div>
          <div>
            <SentimentGauge period={period} />
          </div>
        </div>

        {/* Row 2: Top Movers */}
        <TopMoversTable period={period} />

        {/* Row 3: Influence Chart + Gas Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InfluenceChart period={period} />
          <GasAnalytics period={period} />
        </div>
      </div>
    </div>
  );
}

// Helper Component: Stat Card
function StatCard({ title, value, icon, trend }: any) {
  const isPositive = trend.startsWith('+');
  
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex justify-between items-start mb-4">
        <p className="text-gray-400 text-sm">{title}</p>
        {icon}
      </div>
      <p className="text-3xl font-bold mb-2">{value}</p>
      <p className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {trend} from last period
      </p>
    </div>
  );
}
