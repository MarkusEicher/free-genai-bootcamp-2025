import { Card } from './common'
import { useUserAchievements } from '../hooks/useApi'
import type { Achievement } from '../types/achievements'

interface AchievementsListProps {
  userId: number
}

export function AchievementsList({ userId }: AchievementsListProps) {
  const { data: achievements, isLoading } = useUserAchievements(userId)

  if (isLoading) return <div>Loading...</div>

  return (
    <Card className="p-6">
      <h2 className="text-lg font-medium mb-4">Achievements</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {achievements?.map((achievement: Achievement) => (
          <div key={achievement.id} className="flex items-center space-x-3">
            <div className="text-2xl">{achievement.icon}</div>
            <div>
              <div className="font-medium">{achievement.name}</div>
              <div className="text-sm text-gray-600">{achievement.description}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
} 