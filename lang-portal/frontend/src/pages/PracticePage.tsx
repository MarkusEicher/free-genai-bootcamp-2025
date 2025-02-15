import { useState } from 'react'
import { useStartPractice } from '../hooks/useApi'
import { useStatsContext } from '../contexts/StatsContext'
import LoadingState from '../components/LoadingState'
import Button from '../components/Button'
import Card from '../components/Card'
import PracticeSession from '../components/PracticeSession'

type PracticeMode = 'flashcard' | 'typing' | 'multipleChoice'

interface PracticeConfig {
  mode: PracticeMode
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  wordCount: number
}

export default function PracticePage() {
  const [config, setConfig] = useState<PracticeConfig | null>(null)
  const [session, setSession] = useState<{
    questions: Array<{
      id: number
      word: string
      translation: string
      options?: string[]
    }>
  } | null>(null)

  const startPractice = useStartPractice()
  const { updateStats } = useStatsContext()

  const handleStart = async (mode: PracticeMode) => {
    setConfig({
      mode,
      difficulty: 'beginner',
      wordCount: 10
    })
    await startPractice.mutateAsync({
      type: mode,
      difficulty: 'beginner',
      wordCount: 10
    })
  }

  const handleComplete = ({ correct, total }: { correct: number; total: number }) => {
    updateStats({
      correct,
      total,
      type: config?.mode || 'practice'
    })
    setSession(null)
    setConfig(null)
  }

  if (startPractice.isPending) {
    return <LoadingState />
  }

  if (session) {
    return (
      <PracticeSession
        mode={config!.mode}
        questions={session.questions}
        onComplete={handleComplete}
        onExit={() => setSession(null)}
      />
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="p-6">
        <h2 className="text-lg font-medium mb-4">Select Practice Mode</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button onClick={() => handleStart('flashcard')} className="h-32">
            <div className="text-xl mb-2">Flashcards</div>
            <div className="text-sm text-gray-600">
              Review words with simple flashcards
            </div>
          </Button>

          <Button onClick={() => handleStart('typing')} className="h-32">
            <div className="text-xl mb-2">Typing Practice</div>
            <div className="text-sm text-gray-600">
              Practice spelling and typing
            </div>
          </Button>

          <Button onClick={() => handleStart('multipleChoice')} className="h-32">
            <div className="text-xl mb-2">Multiple Choice</div>
            <div className="text-sm text-gray-600">
              Test your knowledge with options
            </div>
          </Button>
        </div>
      </Card>
    </div>
  )
} 