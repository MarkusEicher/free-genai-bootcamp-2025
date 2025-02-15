import type { Activity, ActivityDetailsType } from '../../types/session'

interface ActivityDetailsProps {
  activity: Activity
}

export default function ActivityDetailsView({ activity }: ActivityDetailsProps) {
  switch (activity.type) {
    case 'quiz':
      const quizDetails = activity.details as ActivityDetailsType['quiz']
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
    // ... other cases ...
    default:
      return null
  }
} 