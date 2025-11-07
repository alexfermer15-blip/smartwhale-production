'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  created_at: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push('/login')
          return
        }

        setProfile({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || '',
          avatar_url: user.user_metadata?.avatar_url || null,
          created_at: user.created_at || new Date().toISOString(),
        })

        setFormData({
          full_name: user.user_metadata?.full_name || '',
          email: user.email || '',
        })
      } catch (err) {
        console.error('Error fetching profile:', err)
        setError('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [router])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setError('New password must be at least 6 characters')
      return
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      })

      if (updateError) {
        setError(updateError.message)
      } else {
        setSuccess('Password updated successfully!')
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating password')
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        email: formData.email,
        data: {
          full_name: formData.full_name,
        },
      })

      if (updateError) {
        setError(updateError.message)
      } else {
        setSuccess('Profile updated successfully!')
        setEditing(false)
        setTimeout(() => setSuccess(''), 3000)

        // Refresh profile
        const { data: { user } } = await supabase.auth.getUser()
        if (user && profile) {
          setProfile({
            ...profile,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || '',
          })
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating profile')
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = confirm(
      'Are you sure? This action cannot be undone. All your data will be deleted.'
    )
    if (!confirmed) return

    try {
      setError('')
      // Call delete account API
      const response = await fetch('/api/auth/delete-account', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to delete account')
      }

      setSuccess('Account deleted. Redirecting...')
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting account')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin text-4xl">⏳</div>
          <p className="text-gray-400 mt-4">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-400 text-lg">Profile not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Profile Settings</h1>
        <p className="text-gray-400">Manage your account and preferences</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-green-300 flex items-start gap-3">
          <span className="text-xl">✓</span>
          <div>{success}</div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-300 flex items-start gap-3">
          <span className="text-xl">✕</span>
          <div>{error}</div>
        </div>
      )}

      {/* Account Information Card */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">Account Information</h2>
          <button
            onClick={() => setEditing(!editing)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editing ? (
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="John Doe"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition"
            >
              Save Changes
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="pb-6 border-b border-slate-700">
              <p className="text-gray-400 text-sm mb-1">Full Name</p>
              <p className="text-xl font-semibold text-white">{profile.full_name || 'Not set'}</p>
            </div>

            <div className="pb-6 border-b border-slate-700">
              <p className="text-gray-400 text-sm mb-1">Email Address</p>
              <p className="text-xl font-semibold text-white">{profile.email}</p>
            </div>

            <div className="pb-6 border-b border-slate-700">
              <p className="text-gray-400 text-sm mb-1">Member Since</p>
              <p className="text-xl font-semibold text-white">
                {new Date(profile.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            <div>
              <p className="text-gray-400 text-sm mb-1">Account ID</p>
              <p className="text-sm font-mono text-gray-500 truncate">{profile.id}</p>
            </div>
          </div>
        )}
      </div>

      {/* Security Card */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-white mb-8">Security</h2>

        <form onSubmit={handleChangePassword} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">New Password</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
            />
            <p className="text-xs text-gray-400 mt-1">Minimum 6 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
              }
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-600/50 text-yellow-400 font-bold py-3 rounded-lg transition"
          >
            🔒 Update Password
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/10 border border-red-500/50 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-red-400 mb-4">Danger Zone</h2>
        <p className="text-gray-400 mb-6">
          Deleting your account is permanent and cannot be undone. All your data will be
          permanently deleted.
        </p>
        <button
          onClick={handleDeleteAccount}
          className="bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 text-red-400 font-bold py-3 px-6 rounded-lg transition"
        >
          🗑️ Delete Account
        </button>
      </div>

      {/* Help Section */}
      <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-6 text-center">
        <p className="text-gray-400">
          Need help? Contact{' '}
          <a href="mailto:support@smartwhale.app" className="text-blue-400 hover:text-blue-300">
            support@smartwhale.app
          </a>
        </p>
      </div>
    </div>
  )
}
