import { Card } from '../components/common'
import { useActivities } from '../hooks/useApi'

export default function Activities() {
  const { data: activities } = useActivities()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Learning Activities</h1>

      {/* Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activities?.map(activity => (
          <Card key={activity.id} className="p-4">
            <div className="flex flex-col h-full">
              <div className="text-lg font-semibold">{activity.title}</div>
              <p className="text-gray-600 mt-2 flex-grow">
                {activity.description}
              </p>
              <div className="mt-4 flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  {activity.duration}
                </span>
                <span className={`px-2 py-1 rounded text-sm ${
                  activity.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                  activity.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {activity.difficulty}
                </span>
              </div>
              <button 
                className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                onClick={() => console.log('Start activity:', activity.id)}
              >
                Start Activity
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
} 