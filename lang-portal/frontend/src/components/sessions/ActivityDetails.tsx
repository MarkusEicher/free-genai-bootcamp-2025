import { Activity, ActivityDetails } from '../../types/session'

interface ActivityDetailsProps {
  activity: Activity
}

export default function ActivityDetails({ activity }: ActivityDetailsProps) {
  const renderSpecificDetails = () => {
    switch (activity.type) {
      case 'quiz':
        const quizDetails = activity.details as ActivityDetails['quiz']
        return (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="p-3 bg-blue-50 rounded">
              <div className="text-sm text-gray-600">Questions</div>
              <div className="font-semibold">{quizDetails.totalQuestions}</div>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <div className="text-sm text-gray-600">Correct Answers</div>
              <div className="font-semibold">{quizDetails.correctAnswers}</div>
            </div>
          </div>
        )
      
      case 'flashcard':
        const flashcardDetails = activity.details as ActivityDetails['flashcard']
        return (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="p-3 bg-blue-50 rounded">
              <div className="text-sm text-gray-600">Cards Reviewed</div>
              <div className="font-semibold">{flashcardDetails.cardsReviewed}</div>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <div className="text-sm text-gray-600">Recall Rate</div>
              <div className="font-semibold">{flashcardDetails.recallRate}%</div>
            </div>
          </div>
        )
      
      case 'writing':
        const writingDetails = activity.details as ActivityDetails['writing']
        return (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="p-3 bg-blue-50 rounded">
              <div className="text-sm text-gray-600">Words Written</div>
              <div className="font-semibold">{writingDetails.wordsWritten}</div>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <div className="text-sm text-gray-600">Accuracy</div>
              <div className="font-semibold">{writingDetails.accuracy}%</div>
            </div>
          </div>
        )
      
      case 'reading':
        const readingDetails = activity.details as ActivityDetails['reading']
        return (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="p-3 bg-blue-50 rounded">
              <div className="text-sm text-gray-600">Passages Read</div>
              <div className="font-semibold">{readingDetails.passagesRead}</div>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <div className="text-sm text-gray-600">Comprehension</div>
              <div className="font-semibold">{readingDetails.comprehension}%</div>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return renderSpecificDetails()
} 