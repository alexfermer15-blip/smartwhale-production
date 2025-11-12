'use client';

import { useEffect, useState } from 'react';

interface HeatmapData {
  hour: number;
  day: string;
  activity: number;
}

export default function HeatmapChart({ period }: { period: string }) {
  const [data, setData] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState(true);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  useEffect(() => {
    fetchHeatmapData();
  }, [period]);

  const fetchHeatmapData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/heatmap?period=${period}`);
      const result = await response.json();
      setData(result.data || []);
    } catch (error) {
      console.error('Error fetching heatmap:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityColor = (activity: number) => {
    if (activity === 0) return 'bg-gray-800';
    if (activity < 5) return 'bg-green-900';
    if (activity < 10) return 'bg-green-700';
    if (activity < 20) return 'bg-green-500';
    return 'bg-green-400';
  };

  const getActivity = (hour: number, day: string) => {
    const cell = data.find((d) => d.hour === hour && d.day === day);
    return cell?.activity || 0;
  };

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-bold mb-6">Whale Activity Heatmap</h3>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">Whale Activity Heatmap</h3>
        <p className="text-sm text-gray-400">Peak activity hours highlighted</p>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Hour labels */}
          <div className="flex mb-2">
            <div className="w-16"></div>
            {hours.map((hour) => (
              <div
                key={hour}
                className="w-8 text-xs text-gray-500 text-center"
              >
                {hour % 3 === 0 ? `${hour}h` : ''}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          {days.map((day) => (
            <div key={day} className="flex mb-1">
              <div className="w-16 text-sm text-gray-400 flex items-center">
                {day}
              </div>
              {hours.map((hour) => {
                const activity = getActivity(hour, day);
                return (
                  <div
                    key={`${day}-${hour}`}
                    className={`w-8 h-8 mx-0.5 rounded ${getActivityColor(activity)} cursor-pointer hover:opacity-80 transition-opacity`}
                    title={`${day} ${hour}:00 - ${activity} transactions`}
                  />
                );
              })}
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center gap-2 mt-6">
            <span className="text-sm text-gray-500">Less</span>
            {[0, 5, 10, 20, 30].map((val) => (
              <div
                key={val}
                className={`w-6 h-6 rounded ${getActivityColor(val)}`}
              />
            ))}
            <span className="text-sm text-gray-500">More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
