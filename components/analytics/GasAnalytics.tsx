'use client';

import { useEffect, useState } from 'react';

export default function GasAnalytics({ period }: { period: string }) {
  const [gasData, setGasData] = useState({
    average: 0,
    peak: 0,
    low: 0,
    bestTime: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGasData();
  }, [period]);

  const fetchGasData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/gas?period=${period}`);
      const data = await response.json();
      setGasData(data);
    } catch (error) {
      console.error('Error fetching gas data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-bold mb-6">Gas Fee Analytics</h3>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h3 className="text-xl font-bold mb-6">Gas Fee Analytics</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-2">Average Gas</p>
          <p className="text-2xl font-bold">{gasData.average.toFixed(0)} Gwei</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-2">Peak Gas</p>
          <p className="text-2xl font-bold text-red-500">{gasData.peak.toFixed(0)} Gwei</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-2">Lowest Gas</p>
          <p className="text-2xl font-bold text-green-500">{gasData.low.toFixed(0)} Gwei</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-2">Best Time to Trade</p>
          <p className="text-lg font-bold">{gasData.bestTime || '02:00 AM'}</p>
        </div>
      </div>
      <p className="text-sm text-gray-500 mt-4">
        💡 Tip: Gas fees are typically lowest during off-peak hours (2AM-6AM UTC)
      </p>
    </div>
  );
}
