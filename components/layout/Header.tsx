'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 w-full bg-slate-900/80 backdrop-blur border-b border-slate-700/50 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link 
          href="/" 
          className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent hover:from-blue-300 hover:to-blue-500 transition"
        >
          SmartWhale
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-8 items-center">
          <a href="/#features" className="text-gray-300 hover:text-white transition">
            Features
          </a>
          <a href="/#pricing" className="text-gray-300 hover:text-white transition">
            Pricing
          </a>
          <a href="#" className="text-gray-300 hover:text-white transition">
            Docs
          </a>
          <a href="#" className="text-gray-300 hover:text-white transition">
            Blog
          </a>
        </nav>

        {/* Auth Buttons */}
        <div className="hidden md:flex gap-4 items-center">
          <Link
            href="/login"
            className="px-4 py-2 text-gray-300 hover:text-white transition"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden text-white text-2xl"
        >
          ☰
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-800 border-t border-slate-700 p-4 space-y-4">
          <a href="/#features" className="block text-gray-300 hover:text-white transition">
            Features
          </a>
          <a href="/#pricing" className="block text-gray-300 hover:text-white transition">
            Pricing
          </a>
          <a href="#" className="block text-gray-300 hover:text-white transition">
            Docs
          </a>
          <Link href="/login" className="block text-gray-300 hover:text-white transition">
            Sign In
          </Link>
          <Link
            href="/register"
            className="block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold text-center"
          >
            Get Started
          </Link>
        </div>
      )}
    </header>
  )
}
