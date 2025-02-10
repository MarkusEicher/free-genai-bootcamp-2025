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
  const [stats, setStats] = useState<DashboardStats>(initialStats)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard')
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to fetch stats')
      setStats(data.data)
    } catch (err) {
      console.error('Error fetching stats:', err)
      setError('Failed to load stats')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) return <div className="p-4">Loading...</div>
  if (error) return <div className="p-4 text-red-500">{error}</div>

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
          {stats.lastSession ? (
            <>
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <div>{stats.lastSession.type}</div>
                  <div className="text-gray-500">{stats.lastSession.date}</div>
                </div>
                <div className="flex gap-4">
                  <div className="text-green-500">✓ {stats.lastSession.correct} correct</div>
                  <div className="text-red-500">✗ {stats.lastSession.wrong} wrong</div>
                </div>
              </div>
              {stats.lastSession.groupId && (
                <Link
                  href={`/groups/${stats.lastSession.groupId}`}
                  className="text-blue-500 hover:text-blue-600 text-sm"
                >
                  View Group →
                </Link>
              )}
            </>
          ) : (
            <div className="text-gray-500">No sessions yet</div>
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
