interface StudyProgressProps {
  wordsLearned: number;
  totalWords: number;
}

export default function StudyProgress({ wordsLearned, totalWords }: StudyProgressProps) {
  const percentage = Math.round((wordsLearned / totalWords) * 100)

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900">Study Progress</h2>
      <div className="mt-4">
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block text-blue-600">
                {percentage}% Complete
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold inline-block text-gray-600">
                {wordsLearned}/{totalWords} words
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-100">
            <div
              style={{ width: `${percentage}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600"
            />
          </div>
        </div>
      </div>
    </div>
  )
} 