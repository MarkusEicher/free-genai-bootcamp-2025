interface LearningStreakProps {
  currentStreak: number
  longestStreak: number
  lastActivity?: string
}

export function LearningStreak({ currentStreak, longestStreak, lastActivity }: LearningStreakProps) {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm text-gray-500">Current Streak</div>
        <div className="text-2xl font-bold">{currentStreak} days</div>
      </div>
      <div>
        <div className="text-sm text-gray-500">Longest Streak</div>
        <div className="text-2xl font-bold">{longestStreak} days</div>
      </div>
      {lastActivity && (
        <div>
          <div className="text-sm text-gray-500">Last Activity</div>
          <div className="text-lg">
            {new Date(lastActivity).toLocaleDateString()}
          </div>
        </div>
      )}
    </div>
  )
} 