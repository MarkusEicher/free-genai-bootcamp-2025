import { Card } from './common'

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt?: string
}

interface AchievementBadgeProps {
  badge: Badge
  isUnlocked: boolean
}

export function AchievementBadge({ badge, isUnlocked }: AchievementBadgeProps) {
  return (
    <Card className={`p-4 ${isUnlocked ? 'bg-white' : 'bg-gray-100'}`}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 flex items-center justify-center rounded-full 
          ${isUnlocked ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400'}`}>
          {badge.icon}
        </div>
        <div>
          <h3 className="font-medium">{badge.name}</h3>
          <p className="text-sm text-gray-500">{badge.description}</p>
          {isUnlocked && badge.unlockedAt && (
            <p className="text-xs text-blue-600 mt-1">
              Unlocked on {new Date(badge.unlockedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </Card>
  )
} 