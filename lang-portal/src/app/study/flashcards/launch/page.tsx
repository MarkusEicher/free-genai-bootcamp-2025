'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Group {
  id: string
  name: string
  _count: {
    words: number
  }
}

interface Word {
  id: string
  text: string
  translation: string
}

export default function FlashcardsLaunchPage() {
  const router = useRouter()
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [currentWord, setCurrentWord] = useState<Word | null>(null)
  const [userInput, setUserInput] = useState('')
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isStudyStarted, setIsStudyStarted] = useState(false)
  const [words, setWords] = useState<Word[]>([])

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups')
      if (!response.ok) throw new Error('Failed to fetch groups')
      const data = await response.json()
      setGroups(data.data)
      setIsLoading(false)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const startStudy = async () => {
    if (!selectedGroup) return

    try {
      const response = await fetch(`/api/groups/${selectedGroup}/words`)
      if (!response.ok) throw new Error('Failed to fetch words')
      const data = await response.json()
      setWords(data.data)
      setIsStudyStarted(true)
      nextWord()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const nextWord = () => {
    if (words.length === 0) {
      setCurrentWord(null)
      return
    }
    const randomIndex = Math.floor(Math.random() * words.length)
    setCurrentWord(words[randomIndex])
    setUserInput('')
    setFeedback(null)
  }

  const checkAnswer = async () => {
    if (!currentWord) return

    const isCorrect = userInput.toLowerCase().trim() === currentWord.text.toLowerCase().trim()
    setFeedback(isCorrect ? 'correct' : 'incorrect')

    // Record the activity
    try {
      await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wordId: currentWord.id,
          success: isCorrect,
          type: 'flashcards'
        }),
      })
    } catch (error) {
      console.error('Error recording activity:', error)
    }

    // Wait a moment before showing next word
    setTimeout(nextWord, 1500)
  }

  if (isLoading) return <div className="p-6">Loading...</div>

  if (!isStudyStarted) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Flashcards Study</h1>
        <div className="max-w-md">
          <div className="mb-4">
            <label className="block text-gray-400 mb-2">Select Word Group</label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full p-2 bg-gray-800 rounded border border-gray-700 text-white"
            >
              <option value="">Select a group...</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} ({group._count.words} words)
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={startStudy}
            disabled={!selectedGroup}
            className={`w-full p-3 rounded font-semibold ${
              selectedGroup
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-700 cursor-not-allowed'
            }`}
          >
            Start Study Session
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Flashcards Study</h1>
      {currentWord ? (
        <div className="max-w-md mx-auto">
          <div className="bg-gray-800 p-6 rounded-lg mb-6">
            <div className="text-center mb-4">
              <div className="text-gray-400 mb-2">Translate to German:</div>
              <div className="text-2xl font-bold">{currentWord.translation}</div>
            </div>
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
              placeholder="Type the German translation..."
              className="w-full p-3 bg-gray-700 rounded border border-gray-600 text-white mb-4"
              autoFocus
            />
            <button
              onClick={checkAnswer}
              className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded font-semibold"
            >
              Check Answer
            </button>
          </div>
          {feedback && (
            <div
              className={`text-center p-3 rounded ${
                feedback === 'correct' ? 'bg-green-600' : 'bg-red-600'
              }`}
            >
              {feedback === 'correct' ? 'Correct!' : `Incorrect. The answer was: ${currentWord.text}`}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center">
          <p className="text-xl mb-4">No more words to study!</p>
          <button
            onClick={() => router.push('/study')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            Back to Study Options
          </button>
        </div>
      )}
    </div>
  )
} 