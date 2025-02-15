interface DifficultyOption {
  id: 'beginner' | 'intermediate' | 'advanced'
  label: string
  description: string
  wordCount: number
  timeLimit?: number
}

const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  {
    id: 'beginner',
    label: 'Beginner',
    description: '10 words, no time limit',
    wordCount: 10
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    description: '20 words, 30 seconds per word',
    wordCount: 20,
    timeLimit: 30
  },
  {
    id: 'advanced',
    label: 'Advanced',
    description: '30 words, 15 seconds per word',
    wordCount: 30,
    timeLimit: 15
  }
]

interface DifficultySelectProps {
  selected: DifficultyOption['id']
  onSelect: (difficulty: DifficultyOption) => void
}

export default function DifficultySelect({ selected, onSelect }: DifficultySelectProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {DIFFICULTY_OPTIONS.map((option) => (
        <button
          key={option.id}
          onClick={() => onSelect(option)}
          className={`
            p-4 rounded-lg border-2 text-left
            ${selected === option.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-200'
            }
          `}
        >
          <h3 className="font-medium text-lg mb-1">{option.label}</h3>
          <p className="text-gray-600 text-sm">{option.description}</p>
        </button>
      ))}
    </div>
  )
} 