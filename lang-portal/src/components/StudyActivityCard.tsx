interface StudyActivityCardProps {
  name: string
  description: string
  thumbnail: string
  onLaunch: () => void
  onViewStats: () => void
}

export function StudyActivityCard({
  name,
  description,
  thumbnail,
  onLaunch,
  onViewStats
}: StudyActivityCardProps) {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="p-6 text-center">
        <div className="text-4xl mb-4">{thumbnail}</div>
        <h2 className="text-xl font-semibold mb-2">{name}</h2>
        <p className="text-gray-400 mb-4">{description}</p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={onLaunch}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Launch
          </button>
          <button
            onClick={onViewStats}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
          >
            View Stats
          </button>
        </div>
      </div>
    </div>
  )
} 