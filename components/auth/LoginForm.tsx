'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Loader2 } from 'lucide-react'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push('/whale-tracker')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      setError('✅ Check your email for confirmation link!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md p-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl border border-slate-700/50">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-block p-3 bg-blue-600 rounded-full mb-4">
          <span className="text-4xl">🐋</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">SmartWhale</h1>
        <p className="text-gray-400">Track Ethereum Whales</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setIsSignUp(false)}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
            !isSignUp
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700/50 text-gray-400 hover:text-white'
          }`}
        >
          Login
        </button>
        <button
          onClick={() => setIsSignUp(true)}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
            isSignUp
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700/50 text-gray-400 hover:text-white'
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* Form */}
      <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              placeholder="you@example.com"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className={`p-3 rounded-lg text-sm ${
              error.includes('✅')
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/50"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              <span>Processing...</span>
            </>
          ) : (
            <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
          )}
        </button>
      </form>

      {/* Footer */}
      <p className="text-center text-sm text-gray-500 mt-6">
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-blue-400 hover:text-blue-300 font-medium transition"
        >
          {isSignUp ? 'Login' : 'Sign Up'}
        </button>
      </p>
    </div>
  )
}
