'use client'

import { useState, useEffect } from 'react'
import type { Word, Activity, Group } from '@prisma/client'
import Link from 'next/link'

// Define the Word type with its group relation
type WordWithGroup = Word & {
  group: Group | null
}

type ActivityWithWord = Activity & {
  word: WordWithGroup
}

interface ActivityStats {
  correct: number
  wrong: number
  total: number
}

export default function ActivitiesPage() {
  const [currentWord, setCurrentWord] = useState<WordWithGroup | null>(null)
  const [answer, setAnswer] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<ActivityStats>({
    correct: 0,
    wrong: 0,
    total: 0
  })
  const [recentActivities, setRecentActivities] = useState<ActivityWithWord[]>([])
  const [hasWords, setHasWords] = useState<boolean | null>(null)

  useEffect(() => {
    checkForWords()
    fetchActivities()
  }, [])

  const checkForWords = async () => {
    try {
      const response = await fetch('/api/words')
      const data = await response.json()
      setHasWords(data.data && data.data.length > 0)
    } catch (err) {
      console.error('Error checking for words:', err)
      setHasWords(false)
    }
  }

  const fetchActivities = async () => {
    try {
      setIsLoading(true)
      const [activitiesRes, statsRes] = await Promise.all([
        fetch('/api/activities'),
        fetch('/api/activities/today')
      ])

      if (!activitiesRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch activities data')
      }

      const activitiesData = await activitiesRes.json()
      const statsData = await statsRes.json()

      setRecentActivities(activitiesData.data || [])
      setStats(statsData.data || { correct: 0, wrong: 0, total: 0 })
    } catch (err) {
      console.error('Error fetching activities:', err)
      setError('Failed to load activities')
    } finally {
      setIsLoading(false)
    }
  }

  const startPractice = async () => {
    try {
      setMessage('') // Clear any previous messages
      const response = await fetch('/api/words/random')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch word')
      }
      
      if (!data.data) {
        setMessage('No words available. Please add some words first.')
        return
      }
      
      setCurrentWord(data.data)
      setAnswer('')
    } catch (err) {
      console.error('Error in startPractice:', err)
      setMessage('Failed to start practice. Please try again.')
    }
  }

  const checkAnswer = async () => {
    if (!currentWord) return

    try {
      const success = answer.toLowerCase().trim() === currentWord.translation.toLowerCase().trim()
      
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordId: currentWord.id,
          success,
          type: 'practice'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to record activity')
      }

      setMessage(success ? 'Correct!' : `Wrong! The answer was: ${currentWord.translation}`)
      
      // Refresh activities and stats
      await Promise.all([
        fetchActivities(),
        // Trigger a refresh of the homepage stats
        fetch('/api/stats', { 
          method: 'GET',
          cache: 'no-store'
        })
      ])
      
      // Get next word after a brief delay
      setTimeout(startPractice, 2000)
    } catch (err) {
      console.error('Error checking answer:', err)
      setMessage('Failed to record activity. Please try again.')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      checkAnswer()
    }
  }

  const NoWordsMessage = () => (
    <div className="bg-yellow-50 dark:bg-yellow-900/50 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-2">
        No Words Available
      </h3>
      <p className="text-yellow-700 dark:text-yellow-300 mb-4">
        You need to add some words before you can start practicing.
      </p>
      <Link
        href="/words"
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
      >
        Add Words →
      </Link>
    </div>
  )

  if (isLoading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-6">Study Activities</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-6">Study Activities</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    )
  }

  const successRate = stats.total > 0 
    ? ((stats.correct / stats.total) * 100).toFixed(1) 
    : '0.0'

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Study Activities</h1>

      {/* Show warning if no words are available */}
      {hasWords === false && <NoWordsMessage />}

      {/* Today's Progress */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Today's Progress</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-gray-600 dark:text-gray-400">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Correct</p>
            <p className="text-2xl font-bold text-green-500">{stats.correct}</p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Success Rate</p>
            <p className="text-2xl font-bold">{successRate}%</p>
          </div>
        </div>
      </div>

      {/* Practice Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Practice</h2>
        {!currentWord ? (
          hasWords ? (
            <button
              onClick={startPractice}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Start Practice
            </button>
          ) : (
            <p className="text-gray-500">
              Add some words to start practicing
            </p>
          )
        ) : (
          <div className="space-y-4">
            <p className="text-lg">
              Translate: <span className="font-medium">{currentWord.text}</span>
              {currentWord.group && (
                <span className="text-sm text-gray-500 ml-2">
                  Group: {currentWord.group.name}
                </span>
              )}
            </p>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyPress={handleKeyPress}
              className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600"
              placeholder="Enter translation"
              autoFocus
            />
            <button
              onClick={checkAnswer}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Check Answer
            </button>
          </div>
        )}
        {message && (
          <p className={`mt-2 ${
            message.includes('Correct') 
              ? 'text-green-600' 
              : message.includes('Wrong') 
                ? 'text-red-600' 
                : 'text-yellow-600'
          }`}>
            {message}
          </p>
        )}
      </div>

      {/* Recent Activities */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-3">Recent Activities</h2>
        {recentActivities.length === 0 ? (
          <p className="text-gray-500 text-center">No activities yet</p>
        ) : (
          <div className="space-y-2">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className={`p-2 rounded ${
                  activity.success 
                    ? 'bg-green-50 dark:bg-green-900/50' 
                    : 'bg-red-50 dark:bg-red-900/50'
                }`}
              >
                <p>
                  {activity.word.text} ({activity.word.translation})
                  {activity.word.group && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                      Group: {activity.word.group.name}
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(activity.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 