'use client';

import { useEffect, useState } from 'react';
import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react';

interface Mover {
  id: string;
  label: string;
  address: string;
  change24h: number;
  volume: number;
  txCount: number;
}

export default function TopMoversTable({ period }: { period: string }) {
  const [movers, setMovers] = useState<Mover[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopMovers();
  }, [period]);

  const fetchTopMovers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/top-movers?period=${period}`);
      const data = await response.json();
      setMovers(data.movers || []);
    } catch (error) {
      console.error('Error fetching top movers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-bold mb-6">Top Movers</h3>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h3 className="text-xl font-bold mb-6">Top Movers ({period})</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-800">
              <th className="pb-4">Whale</th>
              <th className="pb-4">24h Change</th>
              <th className="pb-4">Volume</th>
              <th className="pb-4">Txs</th>
            </tr>
          </thead>
          <tbody>
            {movers.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-500">
                  No data available
                </td>
              </tr>
            ) : (
              movers.map((mover) => (
                <tr key={mover.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-4">
                    <div>
                      <p className="font-medium">{mover.label}</p>
                      <p className="text-sm text-gray-500">{mover.address.slice(0, 10)}...</p>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      {mover.change24h > 0 ? (
                        <TrendingUpIcon className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDownIcon className="w-4 h-4 text-red-500" />
                      )}
                      <span className={mover.change24h > 0 ? 'text-green-500' : 'text-red-500'}>
                        {mover.change24h > 0 ? '+' : ''}
                        {mover.change24h.toFixed(2)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-4">${(mover.volume / 1000000).toFixed(2)}M</td>
                  <td className="py-4">{mover.txCount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
