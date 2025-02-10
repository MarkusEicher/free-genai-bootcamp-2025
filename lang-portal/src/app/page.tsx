'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface DashboardStats {
  totalWords: number
  successRate: number
  studySessions: number
  activeGroups: number
  studyStreak: number
  lastSession?: {
    type: string
    date: string
    correct: number
    wrong: number
    groupId?: string
  }
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/stats')
      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }
      const data = await response.json()
      setStats(data.data)
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      setError('Failed to load dashboard stats')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-4 rounded-lg shadow h-48"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link 
          href="/activities"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Start Studying →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Last Study Session */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Last Study Session</h2>
          {stats?.lastSession ? (
            <>
              <p className="text-gray-600 dark:text-gray-300">{stats.lastSession.type}</p>
              <p className="text-gray-600 dark:text-gray-300">
                {new Date(stats.lastSession.date).toLocaleDateString()}
              </p>
              <div className="mt-2">
                <span className="text-green-500">✓ {stats.lastSession.correct} correct</span>
                <span className="text-red-500 ml-3">✗ {stats.lastSession.wrong} wrong</span>
              </div>
              {stats.lastSession.groupId && (
                <Link href={`/groups/${stats.lastSession.groupId}`} className="text-blue-500 text-sm hover:underline">
                  View Group →
                </Link>
              )}
            </>
          ) : (
            <p className="text-gray-500">No sessions yet</p>
          )}
        </div>

        {/* Study Progress */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Study Progress</h2>
          <div className="mb-4">
            <p className="text-gray-600 dark:text-gray-300">Total Words Studied</p>
            <p className="text-2xl font-bold">{stats?.totalWords || 0}</p>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div 
              className="bg-blue-500 h-2.5 rounded-full" 
              style={{ width: `${Math.min((stats?.totalWords || 0) / 100 * 100, 100)}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Progress: {Math.min(Math.round((stats?.totalWords || 0) / 100 * 100), 100)}%
          </p>
        </div>

        {/* Quick Stats */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Quick Stats</h2>
          <div className="space-y-2">
            <p className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Success Rate</span>
              <span className="font-medium">{stats?.successRate || 0}%</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Study Sessions</span>
              <span className="font-medium">{stats?.studySessions || 0}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Active Groups</span>
              <span className="font-medium">{stats?.activeGroups || 0}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Study Streak</span>
              <span className="font-medium">{stats?.studyStreak || 0} days</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
