import { useEffect } from 'react'
import { useSessionStats } from './useApi'

export function useStreakNotification() {
  const { data: stats } = useSessionStats()

  useEffect(() => {
    if (stats?.currentStreak && stats.currentStreak > 0) {
      // Check if we haven't shown this streak notification today
      const lastNotification = localStorage.getItem('lastStreakNotification')
      const today = new Date().toDateString()

      if (lastNotification !== today) {
        const notification = new Notification('Streak Update!', {
          body: `You're on a ${stats.currentStreak} day streak! Keep it up!`,
          icon: '/streak-icon.png'
        })

        localStorage.setItem('lastStreakNotification', today)

        // Auto-close notification
        setTimeout(() => notification.close(), 5000)
      }
    }
  }, [stats?.currentStreak])

  // Request notification permission on mount
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])
} 