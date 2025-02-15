import { Achievement, Badge } from '../../types/achievement'

interface AchievementsListProps {
  achievements: Achievement[]
  badges: Badge[]
}

export default function AchievementsList({ achievements, badges }: AchievementsListProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Achievements</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {achievements.map(achievement => (
            <div
              key={achievement.id}
              className={`p-4 rounded-lg border ${
                achievement.unlockedAt ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{achievement.icon}</span>
                <div>
                  <div className="font-medium">{achievement.name}</div>
                  <div className="text-sm text-gray-600">{achievement.description}</div>
                </div>
              </div>
              <div className="mt-2">
                <div className="h-2 bg-gray-200 rounded overflow-hidden">
                  <div
                    className="h-full bg-blue-600"
                    style={{ width: `${(achievement.progress / achievement.requirement) * 100}%` }}
                  />
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {achievement.progress} / {achievement.requirement}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Badges</h3>
        <div className="flex flex-wrap gap-4">
          {badges.map(badge => (
            <div
              key={badge.id}
              className={`p-3 rounded-lg border ${
                badge.unlockedAt ? 
                  badge.level === 'gold' ? 'bg-yellow-50 border-yellow-200' :
                  badge.level === 'silver' ? 'bg-gray-50 border-gray-200' :
                  'bg-orange-50 border-orange-200'
                : 'bg-gray-100 border-gray-200 opacity-50'
              }`}
            >
              <div className="text-center">
                <span className="text-3xl">{badge.icon}</span>
                <div className="font-medium mt-1">{badge.name}</div>
                <div className="text-sm text-gray-600 capitalize">{badge.level}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 