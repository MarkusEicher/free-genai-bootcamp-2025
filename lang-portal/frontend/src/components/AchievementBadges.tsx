import { Card } from './common'
import { useAchievements } from '../hooks/useApi'
import type { Achievement } from '../types/achievements'

export function AchievementBadges() {
  const { data: achievements } = useAchievements()

  return (
    <Card className="p-6">
      <h2 className="text-lg font-medium mb-4">Achievements</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {achievements?.map((achievement: Achievement) => (
          <div
            key={achievement.id}
            className={`p-4 text-center rounded-lg ${
              achievement.unlocked ? 'bg-blue-50' : 'bg-gray-50'
            }`}
          >
            <div className="text-3xl mb-2">{achievement.icon}</div>
            <div className="font-medium">{achievement.name}</div>
            <div className="text-sm text-gray-600">{achievement.description}</div>
          </div>
        ))}
      </div>
    </Card>
  )
} 