interface VocabularyCardProps {
  word: string;
  translation: string;
  successRate: number;
  mastered: boolean;
  onPractice: () => void;
}

export default function VocabularyCard({ 
  word, 
  translation, 
  successRate, 
  mastered,
  onPractice 
}: VocabularyCardProps) {
  return (
    <div className="border rounded-lg shadow p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">{word}</h3>
          <p className="text-gray-600">{translation}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">
            Success rate: {successRate}%
          </div>
          {mastered && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Mastered
            </span>
          )}
        </div>
      </div>
      <button
        onClick={onPractice}
        className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Practice
      </button>
    </div>
  );
} 