'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import FlashCard from '../../../../components/FlashCard'

interface Word {
  id: string
  text: string
  translation: string
}

export default function FlashCardsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const groupId = searchParams.get('groupId')
  
  const [words, setWords] = useState<Word[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    const fetchWords = async () => {
      if (!groupId) {
        setError('No group selected')
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/groups/${groupId}/words`)
        if (!response.ok) throw new Error('Failed to fetch words')
        const data = await response.json()
        setWords(data.data)
      } catch (err) {
        console.error('Error:', err)
        setError('Failed to load words')
      } finally {
        setIsLoading(false)
      }
    }

    fetchWords()
  }, [groupId])

  const handleSuccess = async (wordId: string) => {
    try {
      await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wordId,
          type: 'flashcards',
          success: true
        }),
      })

      if (currentIndex < words.length - 1) {
        setCurrentIndex(prev => prev + 1)
      } else {
        setIsComplete(true)
      }
    } catch (error) {
      console.error('Failed to save activity:', error)
    }
  }

  const handleFailure = async (wordId: string) => {
    try {
      await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wordId,
          type: 'flashcards',
          success: false
        }),
      })

      if (currentIndex < words.length - 1) {
        setCurrentIndex(prev => prev + 1)
      } else {
        setIsComplete(true)
      }
    } catch (error) {
      console.error('Failed to save activity:', error)
    }
  }

  const handleRepeat = () => {
    setCurrentIndex(0)
    setIsComplete(false)
  }

  if (isLoading) return <div className="p-4">Loading...</div>
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>
  if (!words.length) return <div className="p-4">No words found in this group.</div>

  if (isComplete) {
    return (
      <div className="p-6 flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-6">Session Complete!</h2>
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/study')}
            className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Back
          </button>
          <button
            onClick={handleRepeat}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Repeat
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        Word {currentIndex + 1} of {words.length}
      </div>
      <FlashCard
        word={words[currentIndex]}
        onSuccess={() => handleSuccess(words[currentIndex].id)}
        onFailure={() => handleFailure(words[currentIndex].id)}
      />
    </div>
  )
}