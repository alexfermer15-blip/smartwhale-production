'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface Notification {
  id: string
  whale_address: string
  whale_label: string
  notification_type: string
  message: string
  is_read: boolean
  created_at: string
  data: any
}

export default function NotificationsPanel() {
  const [user, setUser] = useState<any>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showPanel, setShowPanel] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) fetchNotifications(user.id)
    })
  }, [])

  async function fetchNotifications(userId: string) {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('whale_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error fetching notifications:', error)
        return
      }

      setNotifications(data || [])
      setUnreadCount(data?.filter((n) => !n.is_read).length || 0)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  async function markAsRead(id: string) {
    try {
      const { error } = await supabase
        .from('whale_notifications')
        .update({ is_read: true })
        .eq('id', id)

      if (error) {
        console.error('Error marking as read:', error)
        return
      }

      if (user) fetchNotifications(user.id)
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  async function markAllAsRead() {
    if (!user) return
    try {
      const { error } = await supabase
        .from('whale_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) {
        console.error('Error marking all as read:', error)
        return
      }

      if (user) fetchNotifications(user.id)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  if (!user) return null

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 text-gray-400 hover:text-white transition"
        title="Notifications"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Panel */}
      {showPanel && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowPanel(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-12 w-96 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 max-h-[500px] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-white font-bold">🔔 Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-blue-400 hover:text-blue-300 text-sm transition"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-8 text-center text-gray-400">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                  <p>Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <div className="text-4xl mb-2">📭</div>
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-slate-700 hover:bg-slate-700/30 cursor-pointer transition ${
                      !notification.is_read ? 'bg-blue-500/10 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-white font-semibold text-sm">
                        {notification.whale_label || 'Whale Alert'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(notification.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mb-1">{notification.message}</p>
                    <span className="text-xs text-gray-500">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </span>
                    {notification.data?.tx_hash && (
                      <a
                        href={`https://etherscan.io/tx/${notification.data.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 text-xs hover:underline mt-2 inline-block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Transaction →
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-slate-700 bg-slate-900">
              <button
                onClick={() => {
                  setShowPanel(false)
                  window.location.href = '/alerts'
                }}
                className="w-full px-4 py-2 text-sm text-blue-400 hover:text-blue-300 transition"
              >
                View all alerts →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
