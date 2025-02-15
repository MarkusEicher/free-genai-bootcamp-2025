interface Activity {
  id: number;
  name: string;
  score: number;
}

interface LastSessionProps {
  date: string;
  activities: Activity[];
  overallScore: number;
}

export default function LastSession({ date, activities, overallScore }: LastSessionProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Last Session</h2>
        <span className="text-sm text-gray-500">{date}</span>
      </div>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex justify-between items-center">
            <span className="text-gray-600">{activity.name}</span>
            <span className="text-sm font-medium text-gray-900">
              {Math.round(activity.score * 100)}%
            </span>
          </div>
        ))}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-900">Overall Score</span>
            <span className="font-medium text-gray-900">
              {Math.round(overallScore * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
} 