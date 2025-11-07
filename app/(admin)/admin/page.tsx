'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    whaleAlertsToday: 0,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Получить статистику из базы
        const { count: usersCount } = await supabase
          .from('auth.users')
          .select('*', { count: 'exact', head: true })

        setStats({
          ...stats,
          totalUsers: usersCount || 0,
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <p className="text-gray-400 mb-2">Total Users</p>
          <p className="text-3xl font-bold text-blue-400">{stats.totalUsers}</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <p className="text-gray-400 mb-2">Active Subscriptions</p>
          <p className="text-3xl font-bold text-green-400">{stats.activeSubscriptions}</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <p className="text-gray-400 mb-2">Total Revenue</p>
          <p className="text-3xl font-bold text-yellow-400">${stats.totalRevenue}</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <p className="text-gray-400 mb-2">Whale Alerts Today</p>
          <p className="text-3xl font-bold text-purple-400">{stats.whaleAlertsToday}</p>
        </div>
      </div>
    </div>
  )
}
