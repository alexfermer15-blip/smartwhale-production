'use client';

import { useEffect, useState } from 'react';

interface InfluenceData {
  label: string;
  score: number;
  color: string;
}

export default function InfluenceChart({ period }: { period: string }) {
  const [data, setData] = useState<InfluenceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInfluenceData();
  }, [period]);

  const fetchInfluenceData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/influence?period=${period}`);
      const result = await response.json();
      setData(result.data || []);
    } catch (error) {
      console.error('Error fetching influence:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-bold mb-6">Whale Influence Score</h3>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h3 className="text-xl font-bold mb-6">Whale Influence Score</h3>
      <div className="space-y-4">
        {data.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No data available</p>
        ) : (
          data.map((whale, index) => (
            <div key={index}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">{whale.label}</span>
                <span className="text-sm text-gray-400">{whale.score.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all"
                  style={{
                    width: `${whale.score}%`,
                    backgroundColor: whale.color,
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
