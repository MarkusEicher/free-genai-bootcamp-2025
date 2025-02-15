import { useNavigate, useParams } from 'react-router-dom'
import { Card, Button, LoadingSpinner } from '../components/common'
import { useVocabularyItem, useDeleteVocabulary, useActivityStats } from '../hooks/useApi'
import { formatDate } from '../utils/dataValidation'

export default function VocabularyDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: item, isLoading, isError } = useVocabularyItem(Number(id))
  const deleteMutation = useDeleteVocabulary()
  const { data: activityStats } = useActivityStats(Number(id))

  if (isLoading) return <LoadingSpinner />
  if (isError || !item) return <div>Error loading vocabulary item</div>

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this word?')) {
      try {
        await deleteMutation.mutateAsync(item.id)
        navigate('/vocabulary')
      } catch (error) {
        console.error('Failed to delete:', error)
      }
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{item.word}</h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => navigate(`/vocabulary/${id}/edit`)}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">Translation</h2>
            <p className="text-xl">{item.translation}</p>
          </div>

          {item.examples && item.examples.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Examples</h2>
              <ul className="space-y-2">
                {item.examples.map((example: string, index: number) => (
                  <li key={index} className="text-gray-700">
                    {example}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {item.tags && item.tags.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-lg font-semibold mb-2">Progress</h2>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${Math.round(item.progress * 100)}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {Math.round(item.progress * 100)}% Mastered
            </p>
          </div>

          {item.group && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Group</h2>
              <p className="text-gray-700">{item.group.name}</p>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Practice History</h2>
          {activityStats?.history?.length ? (
            <div className="space-y-3">
              {activityStats.history.map((activity: any, index: number) => (
                <div key={index} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <div className="font-medium">{activity.type}</div>
                    <div className="text-sm text-gray-500">{formatDate(activity.date)}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${
                      activity.score > 0.8 ? 'text-green-600' : 
                      activity.score > 0.5 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {Math.round(activity.score * 100)}%
                    </div>
                    <div className="text-sm text-gray-500">Score</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No practice history yet</p>
          )}
        </Card>

        {item.related && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Related Words</h2>
            <div className="space-y-3">
              {item.related.map((relatedWord: any) => (
                <div 
                  key={relatedWord.id}
                  className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                  onClick={() => navigate(`/vocabulary/${relatedWord.id}`)}
                >
                  <div>
                    <div className="font-medium">{relatedWord.word}</div>
                    <div className="text-sm text-gray-500">{relatedWord.translation}</div>
                  </div>
                  <div className="text-sm text-gray-500">{relatedWord.relationship}</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Additional Details</h2>
          <div className="space-y-4">
            {item.notes && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                <p className="mt-1">{item.notes}</p>
              </div>
            )}
            
            {item.pronunciation && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Pronunciation</h3>
                <p className="mt-1">{item.pronunciation}</p>
              </div>
            )}
            
            {item.difficulty && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Difficulty Level</h3>
                <div className="mt-1 flex items-center">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <span
                      key={level}
                      className={`w-2 h-2 rounded-full mx-0.5 ${
                        level <= item.difficulty ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-gray-500">Last Modified</h3>
              <p className="mt-1 text-sm text-gray-600">
                {formatDate(item.updatedAt)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-between">
        <Button
          variant="secondary"
          onClick={() => navigate('/vocabulary')}
        >
          Back to List
        </Button>
        <Button
          onClick={() => navigate(`/vocabulary/practice?word=${item.id}`)}
        >
          Practice This Word
        </Button>
      </div>
    </div>
  )
} 