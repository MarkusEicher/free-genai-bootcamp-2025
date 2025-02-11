'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Activity } from '@prisma/client'

interface DashboardStats {
  lastSession: {
    type: string
    date: string
    correct: number
    wrong: number
    groupId?: string
    groupName?: string
    createdAt: string
    successfulWords: number
    totalWords: number
    successRate: number
  } | null
  studyProgress: {
    totalWords: number
    studiedWords: number
    masteryProgress: number
  }
  quickStats: {
    successRate: number
    studySessions: number
    activeGroups: number
    studyStreak: number
  }
}

const initialStats: DashboardStats = {
  lastSession: null,
  studyProgress: {
    totalWords: 0,
    studiedWords: 0,
    masteryProgress: 0
  },
  quickStats: {
    successRate: 0,
    studySessions: 0,
    activeGroups: 0,
    studyStreak: 0
  }
}

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new TypeError("Response was not JSON")
      }
      const data = await response.json()
      setStats(data.data)
    } catch (err) {
      console.error('Error fetching stats:', err)
      setError('Failed to load dashboard stats')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) return <div className="p-4">Loading...</div>
  if (error) return <div className="p-4 text-red-500">{error}</div>
  if (!stats) return <div className="p-4">No stats available</div>

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
        <Link
          href="/activities"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Start Studying →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Last Study Session */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="flex items-center gap-2 text-lg font-medium mb-4">
            <span className="text-gray-400">⏱</span>
            Last Study Session
          </h2>
          {stats.lastSession && (
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-4">Last Study Session</h2>
              <div className="space-y-4">
                <div>
                  <div className="text-gray-400 mb-1">Date</div>
                  <div>
                    {new Date(stats.lastSession.createdAt).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 mb-1">Type</div>
                  <div className="capitalize">{stats.lastSession.type}</div>
                </div>
                <div>
                  <div className="text-gray-400 mb-1">Group</div>
                  <div>{stats.lastSession.groupName}</div>
                </div>
                <div>
                  <div className="text-gray-400 mb-1">Performance</div>
                  <div>
                    {stats.lastSession.successfulWords} of {stats.lastSession.totalWords} words correct (
                    <span className={stats.lastSession.successRate >= 70 ? 'text-green-500' : 'text-yellow-500'}>
                      {stats.lastSession.successRate}%
                    </span>
                    )
                  </div>
                </div>
                {stats.lastSession.createdAt && (
                  <Link
                    href={`/sessions/${encodeURIComponent(stats.lastSession.createdAt)}`}
                    className="block text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    View Session Details
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Study Progress */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="flex items-center gap-2 text-lg font-medium mb-4">
            <span className="text-gray-400">📈</span>
            Study Progress
          </h2>
          <div className="mb-4">
            <div className="text-2xl font-bold mb-2">
              {stats.studyProgress.studiedWords} / {stats.studyProgress.totalWords}
            </div>
            <div className="text-sm text-gray-500 mb-2">Total Words Studied</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${stats.studyProgress.masteryProgress}%` }}
              />
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Mastery Progress {stats.studyProgress.masteryProgress}%
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="flex items-center gap-2 text-lg font-medium mb-4">
            <span className="text-gray-400">🏆</span>
            Quick Stats
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <div className="text-gray-500">Success Rate</div>
              <div className="font-medium">{stats.quickStats.successRate}%</div>
            </div>
            <div className="flex justify-between">
              <div className="text-gray-500">Study Sessions</div>
              <div className="font-medium">{stats.quickStats.studySessions}</div>
            </div>
            <div className="flex justify-between">
              <div className="text-gray-500">Active Groups</div>
              <div className="font-medium">{stats.quickStats.activeGroups}</div>
            </div>
            <div className="flex justify-between">
              <div className="text-gray-500">Study Streak</div>
              <div className="font-medium">{stats.quickStats.studyStreak} days</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
