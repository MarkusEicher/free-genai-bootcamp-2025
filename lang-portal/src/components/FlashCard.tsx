'use client'

import { useState } from 'react'

interface Word {
  id: string
  text: string
  translation: string
}

interface FlashCardProps {
  word: Word
  onSuccess: () => void
  onFailure: () => void
}

export default function FlashCard({ word, onSuccess, onFailure }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <div className="max-w-lg mx-auto">
      <div 
        className="bg-gray-800 rounded-lg shadow-lg p-8 cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className="text-2xl font-bold text-center mb-8">
          {isFlipped ? word.translation : word.text}
        </div>
        <div className="text-gray-400 text-center mb-4">
          Click to {isFlipped ? 'hide' : 'show'} translation
        </div>
      </div>

      <div className="flex justify-center gap-4 mt-6">
        <button
          onClick={onFailure}
          className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          disabled={!isFlipped}
        >
          Incorrect
        </button>
        <button
          onClick={onSuccess}
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          disabled={!isFlipped}
        >
          Correct
        </button>
      </div>
    </div>
  )
} 