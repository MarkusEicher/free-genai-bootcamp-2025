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

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      const data = await response.json()
      setStats(data.data)
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    }
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
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Last Study Session</h2>
          {stats?.lastSession ? (
            <>
              <p className="text-gray-600">{stats.lastSession.type}</p>
              <p className="text-gray-600">{stats.lastSession.date}</p>
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
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Study Progress</h2>
          <div className="mb-4">
            <p className="text-gray-600">Total Words Studied</p>
            <p className="text-2xl font-bold">{stats?.totalWords || 0} / 124</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-500 h-2.5 rounded-full" 
              style={{ width: `${(stats?.totalWords || 0) / 124 * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 mt-2">Mastery Progress: 0%</p>
        </div>

        {/* Quick Stats */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Quick Stats</h2>
          <div className="space-y-2">
            <p className="flex justify-between">
              <span className="text-gray-600">Success Rate</span>
              <span className="font-medium">{stats?.successRate || 0}%</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-600">Study Sessions</span>
              <span className="font-medium">{stats?.studySessions || 0}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-600">Active Groups</span>
              <span className="font-medium">{stats?.activeGroups || 0}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-600">Study Streak</span>
              <span className="font-medium">{stats?.studyStreak || 0} days</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 