import { useStats } from '../hooks/useApi'
import LoadingState from '../components/LoadingState'

interface Achievement {
  id: string
  title: string
  description: string
  progress: number
  target: number
  achieved: boolean
}

function calculateAchievements(stats: any): Achievement[] {
  return [
    {
      id: 'words-learned',
      title: 'Word Master',
      description: 'Learn new words',
      progress: stats?.wordsLearned || 0,
      target: 100,
      achieved: (stats?.wordsLearned || 0) >= 100
    },
    {
      id: 'practice-sessions',
      title: 'Practice Champion',
      description: 'Complete practice sessions',
      progress: stats?.practiceCount || 0,
      target: 50,
      achieved: (stats?.practiceCount || 0) >= 50
    },
    {
      id: 'daily-streak',
      title: 'Consistency King',
      description: 'Maintain daily practice streak',
      progress: stats?.currentStreak || 0,
      target: 7,
      achieved: (stats?.currentStreak || 0) >= 7
    },
    {
      id: 'perfect-score',
      title: 'Perfect Score',
      description: 'Get 100% in practice sessions',
      progress: stats?.perfectScores || 0,
      target: 10,
      achieved: (stats?.perfectScores || 0) >= 10
    }
  ]
}

export default function LeaderboardPage() {
  const { data: stats, isLoading } = useStats()

  if (isLoading) {
    return <LoadingState />
  }

  const achievements = calculateAchievements(stats)

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Your Achievements</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`p-4 rounded-lg border ${
              achievement.achieved ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold">{achievement.title}</h3>
              {achievement.achieved && (
                <span className="px-2 py-1 text-sm bg-green-500 text-white rounded">
                  Achieved!
                </span>
              )}
            </div>
            
            <p className="text-gray-600 mb-3">{achievement.description}</p>
            
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block text-blue-600">
                    {Math.round((achievement.progress / achievement.target) * 100)}%
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-blue-600">
                    {achievement.progress}/{achievement.target}
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-100">
                <div
                  style={{ width: `${Math.min((achievement.progress / achievement.target) * 100, 100)}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 