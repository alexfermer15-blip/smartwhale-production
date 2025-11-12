'use client';

import { useEffect, useState } from 'react';

export default function SentimentGauge({ period }: { period: string }) {
  const [sentiment, setSentiment] = useState(0); // -100 to 100
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSentiment();
  }, [period]);

  const fetchSentiment = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/sentiment?period=${period}`);
      const data = await response.json();
      setSentiment(data.sentiment || 0);
    } catch (error) {
      console.error('Error fetching sentiment:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentLabel = () => {
    if (sentiment > 50) return 'Very Bullish';
    if (sentiment > 20) return 'Bullish';
    if (sentiment > -20) return 'Neutral';
    if (sentiment > -50) return 'Bearish';
    return 'Very Bearish';
  };

  const getSentimentColor = () => {
    if (sentiment > 20) return 'text-green-500';
    if (sentiment > -20) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-bold mb-6">Market Sentiment</h3>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h3 className="text-xl font-bold mb-6">Market Sentiment</h3>
      <div className="flex flex-col items-center justify-center py-8">
        <div className="relative w-48 h-48 mb-6">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
            {/* Background circle */}
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="#1f2937"
              strokeWidth="20"
            />
            {/* Sentiment arc */}
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke={sentiment > 0 ? '#10b981' : '#ef4444'}
              strokeWidth="20"
              strokeDasharray={`${(Math.abs(sentiment) / 100) * 502} 502`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-bold ${getSentimentColor()}`}>
              {sentiment > 0 ? '+' : ''}
              {sentiment.toFixed(0)}
            </span>
            <span className="text-sm text-gray-400 mt-1">Sentiment Score</span>
          </div>
        </div>
        <p className={`text-2xl font-bold ${getSentimentColor()}`}>{getSentimentLabel()}</p>
        <p className="text-sm text-gray-400 mt-2">Based on whale activity</p>
      </div>
    </div>
  );
}
