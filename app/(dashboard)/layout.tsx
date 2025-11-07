'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="bg-black text-white min-h-screen">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-slate-900/80 backdrop-blur border-b border-slate-700/50 z-40 h-16">
        <div className="h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden text-white text-2xl"
          >
            ☰
          </button>

          <Link href="/dashboard" className="text-2xl font-bold text-blue-400">
            SmartWhale
          </Link>

          <div className="flex items-center gap-4">
            <button className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 transition flex items-center justify-center text-white font-bold">
              U
            </button>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside
          className={`fixed left-0 top-16 bottom-0 w-64 bg-slate-900/50 border-r border-slate-700/50 transform transition-transform duration-300 md:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:relative md:w-64`}
        >
          <nav className="p-6 space-y-2">
            <Link
              href="/dashboard"
              className="block px-4 py-3 rounded-lg bg-blue-600/20 border border-blue-600/50 text-white hover:bg-blue-600/30 transition"
            >
              📊 Dashboard
            </Link>
            <Link
              href="#"
              className="block px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800/50 transition"
            >
              🐋 Whale Tracker
            </Link>
            <Link
              href="#"
              className="block px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800/50 transition"
            >
              📈 Portfolio
            </Link>
            <Link
              href="#"
              className="block px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800/50 transition"
            >
              🔔 Alerts
            </Link>
            <Link
              href="#"
              className="block px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800/50 transition"
            >
              ⚙️ Settings
            </Link>

            <hr className="border-slate-700 my-4" />

            <button className="w-full px-4 py-3 rounded-lg bg-red-600/20 border border-red-600/50 text-red-400 hover:bg-red-600/30 transition text-left">
              🚪 Logout
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 md:ml-0">
          {children}
        </main>
      </div>
    </div>
  )
}
