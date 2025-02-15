
interface VocabularyItem {
  id: number;
  word: string;
  translation: string;
  group?: string;
}

interface VocabularyListProps {
  items: VocabularyItem[];
  onItemClick: (id: number) => void;
}

export default function VocabularyList({ items, onItemClick }: VocabularyListProps) {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {items.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => onItemClick(item.id)}
              className="w-full px-6 py-4 hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.word}</p>
                  <p className="text-sm text-gray-500">{item.translation}</p>
                </div>
                {item.group && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {item.group}
                  </span>
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
} 