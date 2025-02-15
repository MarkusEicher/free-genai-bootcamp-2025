import { Card } from './common'
import { AchievementBadge } from './AchievementBadge'
import { useAchievements, useBadges } from '../hooks/useApi'
import type { Achievement, Badge } from '../types/achievements'

export function AchievementsDisplay() {
  const { data: achievements } = useAchievements()
  const { data: badges } = useBadges()

  if (!achievements || !badges) return null

  const unlockedBadges = new Set(achievements.map((a: Achievement) => a.badgeId))

  return (
    <Card className="p-6">
      <h2 className="text-lg font-medium mb-4">Achievements</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {badges.map((badge: Badge) => (
          <AchievementBadge
            key={badge.id}
            badge={badge}
            isUnlocked={unlockedBadges.has(badge.id)}
          />
        ))}
      </div>
    </Card>
  )
} 