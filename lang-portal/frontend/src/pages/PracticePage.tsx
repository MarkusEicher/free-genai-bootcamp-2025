import { useState } from 'react'
import { Card, Button } from '../components/common'
import { PracticeModes } from '../components/PracticeModes'
import { useVocabularyWords, usePracticeSession } from '../hooks/useApi'
import type { VocabularyWord } from '../types/vocabulary'
import type { PracticeMode } from '../components/PracticeModes'

export default function PracticePage() {
  const { data: words, isLoading } = useVocabularyWords()
  const practiceMutation = usePracticeSession()
  const [selectedMode, setSelectedMode] = useState<PracticeMode | null>(null)
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')

  const handleStartPractice = async () => {
    if (!selectedMode) return
    
    try {
      await practiceMutation.mutateAsync({
        mode: selectedMode,
        difficulty,
        wordIds: words?.map((w: VocabularyWord) => w.id) || []
      })
      setSelectedMode(null)
    } catch (error) {
      console.error('Failed to start practice session:', error)
    }
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Practice</h1>

      {!selectedMode ? (
        <Card className="p-6">
          <h2 className="text-lg font-medium mb-4">Select Practice Mode</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
                className="w-full p-2 border rounded"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => {
                  setSelectedMode('flashcard')
                  handleStartPractice()
                }}
                className="h-32"
              >
                <div className="text-xl mb-2">Flashcards</div>
                <div className="text-sm text-gray-600">
                  Review words with simple flashcards
                </div>
              </Button>

              <Button
                onClick={() => setSelectedMode('typing')}
                className="h-32"
              >
                <div className="text-xl mb-2">Typing Practice</div>
                <div className="text-sm text-gray-600">
                  Practice spelling and typing
                </div>
              </Button>

              <Button
                onClick={() => setSelectedMode('multipleChoice')}
                className="h-32"
              >
                <div className="text-xl mb-2">Multiple Choice</div>
                <div className="text-sm text-gray-600">
                  Test your knowledge with options
                </div>
              </Button>

              <Button
                onClick={() => setSelectedMode('listening')}
                className="h-32"
              >
                <div className="text-xl mb-2">Listening Practice</div>
                <div className="text-sm text-gray-600">
                  Improve your listening skills
                </div>
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <PracticeModes
          words={words || []}
          mode={selectedMode}
          difficulty={difficulty}
          onComplete={(results) => {
            console.log('Practice completed:', results)
            setSelectedMode(null)
          }}
        />
      )}
    </div>
  )
} 