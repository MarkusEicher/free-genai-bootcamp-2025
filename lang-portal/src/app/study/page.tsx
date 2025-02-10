'use client'

import Link from 'next/link'

interface StudyActivity {
  id: string
  name: string
  description: string
  thumbnail: string
  type: 'flashcards' | 'quiz'
  comingSoon?: boolean
}

const STUDY_ACTIVITIES: StudyActivity[] = [
  {
    id: 'flashcards',
    name: 'Flashcards',
    description: 'Practice words with flashcards',
    thumbnail: '🎴',
    type: 'flashcards'
  },
  {
    id: 'quiz',
    name: 'Word Quiz',
    description: 'Test your knowledge with multiple choice questions',
    thumbnail: '❓',
    type: 'quiz',
    comingSoon: true
  }
]

export default function StudyPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Study Options</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {STUDY_ACTIVITIES.map((activity) => (
          <div key={activity.id} className="bg-gray-800 rounded-lg overflow-hidden relative">
            {activity.comingSoon && (
              <div className="absolute top-2 right-2 bg-yellow-500 text-black text-sm font-bold px-2 py-1 rounded">
                Coming Soon!
              </div>
            )}
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">{activity.thumbnail}</div>
              <h2 className="text-xl font-semibold mb-2">{activity.name}</h2>
              <p className="text-gray-400 mb-4">{activity.description}</p>
              <div className="flex gap-2 justify-center">
                <Link
                  href={`/study/${activity.id}/launch`}
                  className={`px-4 py-2 rounded ${
                    activity.comingSoon 
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white`}
                  onClick={e => activity.comingSoon && e.preventDefault()}
                >
                  Launch
                </Link>
                <Link
                  href={`/study/${activity.id}/stats`}
                  className={`px-4 py-2 rounded ${
                    activity.comingSoon
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-gray-700 hover:bg-gray-600'
                  } text-white`}
                  onClick={e => activity.comingSoon && e.preventDefault()}
                >
                  View Stats
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 