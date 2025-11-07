'use client'

import Link from 'next/link'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    // Validation
    if (!formData.name.trim()) {
      setError('Full name is required')
      setLoading(false)
      return
    }

    if (!formData.email.trim()) {
      setError('Email is required')
      setLoading(false)
      return
    }

    if (!formData.password) {
      setError('Password is required')
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy')
      setLoading(false)
      return
    }

    try {
      // Register with Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
          },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        },
      })

      if (signUpError) {
        setError(signUpError.message || 'Failed to create account')
        setLoading(false)
        return
      }

      if (data?.user) {
        // Send welcome email via API
        try {
          await fetch('/api/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: formData.email,
              subject: 'Welcome to SmartWhale! 🐋',
              type: 'welcome',
              data: {
                name: formData.name,
              },
            }),
          })
        } catch (emailError) {
          console.error('Email send error:', emailError)
          // Don't fail the signup if email fails
        }

        setSuccess(
          'Account created successfully! Please check your email to verify your account. Redirecting to login...'
        )
        setFormData({ name: '', email: '', password: '', confirmPassword: '' })

        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong'
      setError(errorMessage)
      console.error('Signup error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-black flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 backdrop-blur">
          {/* Logo */}
          <Link href="/" className="block text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              SmartWhale
            </h1>
          </Link>

          {/* Heading */}
          <h2 className="text-2xl font-bold text-white mb-2 text-center">Create Account</h2>
          <p className="text-gray-400 text-center mb-8">Join thousands of traders using SmartWhale</p>

          {/* Success Message */}
          {success && (
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-6 text-green-300 text-sm animate-pulse">
              <div className="flex items-start gap-2">
                <span className="text-lg">✓</span>
                <div>{success}</div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 text-red-300 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-lg">✕</span>
                <div>{error}</div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                disabled={loading}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                autoComplete="name"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                disabled={loading}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                disabled={loading}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                autoComplete="new-password"
              />
              <p className="text-xs text-gray-400 mt-2">Minimum 6 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                disabled={loading}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                autoComplete="new-password"
              />
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg border border-slate-700/50">
              <input
                id="terms"
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                disabled={loading}
                className="w-4 h-4 mt-1 cursor-pointer accent-blue-600 disabled:opacity-50"
              />
              <label htmlFor="terms" className="text-sm text-gray-400 cursor-pointer">
                I agree to the{' '}
                <Link href="/terms" className="text-blue-400 hover:text-blue-300 transition">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-blue-400 hover:text-blue-300 transition">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !agreedToTerms}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition duration-300 mt-6"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block animate-spin">⏳</span>
                  Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-800/50 text-gray-400">Already have an account?</span>
            </div>
          </div>

          {/* Sign In Link */}
          <Link
            href="/login"
            className="w-full block text-center px-4 py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 text-white font-bold rounded-lg transition duration-300"
          >
            Sign In Instead
          </Link>

          {/* Back to Home */}
          <p className="text-center text-gray-400 text-sm mt-6">
            <Link href="/" className="text-blue-400 hover:text-blue-300 transition">
              ← Back to Home
            </Link>
          </p>

          {/* Footer Text */}
          <p className="text-center text-gray-500 text-xs mt-4 leading-relaxed">
            By creating an account, you acknowledge that you have read and understood our{' '}
            <Link href="/privacy" className="text-gray-400 hover:text-gray-300">
              privacy practices
            </Link>
            . We are committed to protecting your data.
          </p>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-8 text-gray-400 text-sm">
          Need help? Email us at{' '}
          <a href="mailto:support@smartwhale.app" className="text-blue-400 hover:text-blue-300">
            support@smartwhale.app
          </a>
        </div>
      </div>
    </main>
  )
}
