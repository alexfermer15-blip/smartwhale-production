'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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

  const handleChangePassword = async () => {
    try {
      setError('')
      const newPassword = prompt('Enter new password:')
      if (!newPassword) return

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        setError(updateError.message)
      } else {
        setSuccess('Password updated successfully!')
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
        // Refresh profile
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setProfile({
            ...profile!,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || '',
          })
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating profile')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">Loading profile...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-400">Profile not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Profile Settings</h1>
        <p className="text-gray-400">Manage your account information</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-green-300">
          ✓ {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-300">
          ✕ {error}
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Account Information</h2>
          <button
            onClick={() => setEditing(!editing)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editing ? (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
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
          <div className="space-y-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">Full Name</p>
              <p className="text-xl font-semibold text-white">{profile.full_name || 'Not set'}</p>
            </div>

            <div>
              <p className="text-gray-400 text-sm mb-1">Email</p>
              <p className="text-xl font-semibold text-white">{profile.email}</p>
            </div>

            <div>
              <p className="text-gray-400 text-sm mb-1">Member Since</p>
              <p className="text-xl font-semibold text-white">
                {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Security Card */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Security</h2>

        <button
          onClick={handleChangePassword}
          className="w-full bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-600/50 text-yellow-400 font-bold py-3 rounded-lg transition"
        >
          🔒 Change Password
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-red-400 mb-4">Danger Zone</h2>
        <p className="text-gray-400 mb-4">
          Deleting your account is permanent and cannot be undone.
        </p>
        <button className="bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 text-red-400 font-bold py-3 px-6 rounded-lg transition">
          🗑️ Delete Account
        </button>
      </div>
    </div>
  )
}
