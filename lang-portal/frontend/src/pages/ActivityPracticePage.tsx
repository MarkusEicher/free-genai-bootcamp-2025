import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Button, LoadingSpinner } from '../components/common'
import { useActivity, useSubmitAnswer } from '../hooks/useApi'

interface Feedback {
  isCorrect: boolean
  message: string
  score?: number
}

export default function ActivityPracticePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [answer, setAnswer] = useState('')
  const [currentStep, setCurrentStep] = useState(0)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [timer, setTimer] = useState<number>(0)
  const [isTimerActive, setIsTimerActive] = useState(true)
  
  const { data: activity, isLoading, isError } = useActivity(Number(id))
  const submitMutation = useSubmitAnswer()

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerActive) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerActive])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSubmit = async () => {
    if (!answer.trim()) return
    setIsTimerActive(false)

    try {
      const result = await submitMutation.mutateAsync({
        activityId: Number(id),
        step: currentStep,
        answer
      })
      
      setFeedback({
        isCorrect: result.isCorrect,
        message: result.feedback,
        score: result.score
      })
      
      // Auto-advance after 3 seconds if correct
      if (result.isCorrect) {
        setTimeout(() => {
          if (currentStep + 1 < (activity?.totalSteps || 0)) {
            setCurrentStep(prev => prev + 1)
            setAnswer('')
            setFeedback(null)
            setTimer(0)
            setIsTimerActive(true)
          } else {
            navigate(`/activities/${id}/complete`)
          }
        }, 3000)
      }
    } catch (error) {
      console.error('Failed to submit answer:', error)
    }
  }

  const handleExit = () => {
    if (window.confirm('Are you sure you want to exit? Your progress will be saved.')) {
      navigate(`/activities/${id}`)
    }
  }

  if (isLoading) return <LoadingSpinner />
  if (isError || !activity) return <div>Error loading activity</div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{activity.name}</h1>
          <p className="text-gray-500">
            Step {currentStep + 1} of {activity.totalSteps}
          </p>
        </div>
        <Button variant="secondary" onClick={handleExit}>
          Exit Practice
        </Button>
      </div>

      {/* Timer Display */}
      <div className="text-right text-gray-500">
        Time: {formatTime(timer)}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / (activity.totalSteps || 1)) * 100}%` }}
        />
      </div>

      {/* Practice Area */}
      <Card className="p-6">
        <div className="space-y-4">
          {/* Question/Prompt */}
          <div className="text-lg font-medium">
            {activity.steps?.[currentStep]?.prompt || 'No prompt available'}
          </div>

          {/* Answer Input */}
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Enter your answer..."
            className="w-full p-3 border rounded-lg min-h-[100px]"
            disabled={!!feedback}
          />

          {/* Feedback Display */}
          {feedback && (
            <div className={`p-4 rounded-lg ${
              feedback.isCorrect 
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              <div className="font-medium">
                {feedback.isCorrect ? 'Correct!' : 'Not quite right'}
              </div>
              <p>{feedback.message}</p>
              {feedback.score !== undefined && (
                <div className="mt-2">
                  Score: {Math.round(feedback.score * 100)}%
                </div>
              )}
            </div>
          )}

          {/* Hints or Additional Info */}
          {activity.steps?.[currentStep]?.hint && (
            <div className="text-sm text-gray-500">
              Hint: {activity.steps[currentStep].hint}
            </div>
          )}
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button
          variant="secondary"
          onClick={() => {
            setCurrentStep(prev => Math.max(0, prev - 1))
            setFeedback(null)
            setTimer(0)
            setIsTimerActive(true)
          }}
          disabled={currentStep === 0 || !!feedback}
        >
          Previous
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!answer.trim() || submitMutation.isPending || !!feedback}
        >
          {submitMutation.isPending ? 'Submitting...' : 'Submit Answer'}
        </Button>
      </div>
    </div>
  )
} 