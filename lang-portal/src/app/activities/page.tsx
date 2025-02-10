'use client'

import { useState, useEffect } from 'react'
import type { Word, Activity, Group } from '@prisma/client'

// Define the Word type with its group relation
type WordWithGroup = Word & {
  group: Group | null
}

type ActivityWithWord = Activity & {
  word: WordWithGroup
}

interface ActivityStats {
  totalActivities: number
  successRate: number
  recentActivities: ActivityWithWord[]
}

export default function ActivitiesPage() {
  const [words, setWords] = useState<WordWithGroup[]>([])
  const [stats, setStats] = useState<ActivityStats | null>(null)
  const [currentWord, setCurrentWord] = useState<WordWithGroup | null>(null)
  const [answer, setAnswer] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchWords()
    fetchStats()
  }, [])

  const fetchWords = async () => {
    try {
      const response = await fetch('/api/words')
      const data = await response.json()
      setWords(data.data)
    } catch (error) {
      console.error('Error fetching words:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/activities')
      const data = await response.json()
      setStats(data.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const startPractice = () => {
    if (words.length === 0) {
      setMessage('No words available for practice')
      return
    }
    const randomWord = words[Math.floor(Math.random() * words.length)]
    setCurrentWord(randomWord)
    setAnswer('')
    setMessage('')
  }

  const checkAnswer = async () => {
    if (!currentWord) return

    const isCorrect = answer.toLowerCase().trim() === currentWord.translation.toLowerCase().trim()
    
    try {
      await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'PRACTICE',
          wordId: currentWord.id,
          success: isCorrect,
        }),
      })

      setMessage(isCorrect ? 'Correct! 🎉' : `Wrong. The correct answer is: ${currentWord.translation}`)
      await fetchStats()
      
      if (isCorrect) {
        setTimeout(() => {
          startPractice() // Move to next word after correct answer
        }, 1500)
      }
    } catch (error) {
      console.error('Error recording activity:', error)
      setMessage('Error recording activity')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      checkAnswer()
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Activities</h1>

      {/* Stats Section */}
      {stats && (
        <div className="mb-8 p-4 bg-gray-50 rounded">
          <h2 className="text-xl font-semibold mb-2">Statistics</h2>
          <p>Total Activities: {stats.totalActivities}</p>
          <p>Success Rate: {stats.successRate.toFixed(1)}%</p>
        </div>
      )}

      {/* Practice Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Practice</h2>
        {!currentWord ? (
          <button
            onClick={startPractice}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Start Practice
          </button>
        ) : (
          <div className="space-y-4">
            <p className="text-lg font-medium">
              Translate: {currentWord.text}
              {currentWord.group && (
                <span className="text-sm text-gray-500 ml-2">
                  (Group: {currentWord.group.name})
                </span>
              )}
            </p>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyPress={handleKeyPress}
              className="border p-2 w-full"
              placeholder="Enter translation"
              autoFocus
            />
            <button
              onClick={checkAnswer}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Check Answer
            </button>
            {message && (
              <p className={`mt-2 ${message.includes('Correct') ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Recent Activities */}
      {stats?.recentActivities && stats.recentActivities.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Activities</h2>
          <div className="space-y-2">
            {stats.recentActivities.map((activity) => (
              <div
                key={activity.id}
                className={`p-2 rounded ${
                  activity.success ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <p>
                  Word: {activity.word.text} ({activity.word.translation})
                  {activity.word.group && (
                    <span className="text-sm text-gray-500 ml-2">
                      Group: {activity.word.group.name}
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(activity.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 