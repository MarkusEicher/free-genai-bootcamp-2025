interface PracticeResultProps {
  correct: number
  total: number
  onContinue: () => void
  onRetry: () => void
}

export default function PracticeResult({ correct, total, onContinue, onRetry }: PracticeResultProps) {
  const percentage = Math.round((correct / total) * 100)
  const isGoodScore = percentage >= 70

  return (
    <div className="text-center p-8">
      <div className={`text-6xl font-bold mb-4 ${isGoodScore ? 'text-green-500' : 'text-orange-500'}`}>
        {percentage}%
      </div>
      
      <h2 className="text-2xl font-semibold mb-4">
        Practice Complete!
      </h2>
      
      <p className="text-gray-600 mb-6">
        You got {correct} out of {total} questions correct
      </p>
      
      <div className="space-y-4">
        {isGoodScore ? (
          <p className="text-green-600">Great job! Keep up the good work!</p>
        ) : (
          <p className="text-orange-600">Good effort! Practice more to improve your score.</p>
        )}
        
        <div className="flex justify-center space-x-4">
          <button
            onClick={onRetry}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Try Again
          </button>
          <button
            onClick={onContinue}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
} 