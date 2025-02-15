interface PracticeResultProps {
  correct: boolean
  userAnswer: string
  correctAnswer: string
  explanation?: string
  onNext: () => void
}

export default function PracticeResult({ 
  correct, 
  userAnswer, 
  correctAnswer, 
  explanation, 
  onNext 
}: PracticeResultProps) {
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className={`text-lg font-bold mb-4 ${correct ? 'text-green-600' : 'text-red-600'}`}>
        {correct ? 'Correct!' : 'Incorrect'}
      </div>
      
      <div className="space-y-2 mb-4">
        <p>
          <span className="font-semibold">Your answer:</span>{' '}
          <span className={correct ? 'text-green-600' : 'text-red-600'}>
            {userAnswer}
          </span>
        </p>
        {!correct && (
          <p>
            <span className="font-semibold">Correct answer:</span>{' '}
            <span className="text-green-600">{correctAnswer}</span>
          </p>
        )}
        {explanation && (
          <p className="text-gray-600">
            <span className="font-semibold">Explanation:</span> {explanation}
          </p>
        )}
      </div>

      <button
        onClick={onNext}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Next Question
      </button>
    </div>
  )
} 