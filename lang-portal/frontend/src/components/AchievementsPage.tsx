import { Card, Button } from './common'
import { useAchievements, useClaimReward } from '../hooks/useApi'
import type { Achievement } from '../types/achievements'

export default function AchievementsPage() {
  const { data: achievements, isLoading } = useAchievements()
  const claimMutation = useClaimReward()

  const handleClaimReward = async (achievementId: number) => {
    try {
      await claimMutation.mutateAsync(achievementId)
    } catch (error) {
      console.error('Failed to claim reward:', error)
    }
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Achievements</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {achievements?.map((achievement: Achievement) => (
          <Card 
            key={achievement.id}
            className={`p-6 ${achievement.unlocked ? 'bg-blue-50' : 'bg-gray-50'}`}
          >
            <div className="flex items-center space-x-4">
              <div className="text-4xl">{achievement.icon}</div>
              <div className="flex-1">
                <h3 className="font-medium">{achievement.name}</h3>
                <p className="text-sm text-gray-600">{achievement.description}</p>
                {achievement.reward && (
                  <div className="mt-2 text-sm text-emerald-600">
                    Reward: {achievement.reward.description}
                  </div>
                )}
                {achievement.progress && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-500">Progress</div>
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(achievement.progress.current / achievement.progress.required) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {achievement.progress.current} / {achievement.progress.required}
                    </div>
                  </div>
                )}
                {achievement.unlocked && !achievement.rewardClaimed && (
                  <Button
                    onClick={() => handleClaimReward(achievement.id)}
                    className="mt-2"
                    size="sm"
                  >
                    Claim Reward
                  </Button>
                )}
                {achievement.rewardClaimed && (
                  <div className="mt-2 text-sm text-gray-600">
                    Reward claimed
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
} 