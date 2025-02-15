import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Button } from '../components/common'
import { useVocabularyWord, useUpdateWord, useDeleteWord } from '../hooks/useApi'
import { WordPractice } from '../components/WordPractice'

export default function VocabularyWordPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: word, isLoading } = useVocabularyWord(Number(id))
  const updateMutation = useUpdateWord()
  const deleteMutation = useDeleteWord()
  const [isEditing, setIsEditing] = useState(false)

  const handleUpdateWord = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    try {
      await updateMutation.mutateAsync({
        id: Number(id),
        word: formData.get('word') as string,
        translation: formData.get('translation') as string,
        pronunciation: formData.get('pronunciation') as string,
        notes: formData.get('notes') as string,
        examples: formData.get('examples') as string,
        tags: (formData.get('tags') as string)?.split(',').map(t => t.trim()).filter(Boolean) || []
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update word:', error)
    }
  }

  const handleDeleteWord = async () => {
    if (!confirm('Are you sure you want to delete this word?')) return
    
    try {
      await deleteMutation.mutateAsync(Number(id))
      navigate('/vocabulary')
    } catch (error) {
      console.error('Failed to delete word:', error)
    }
  }

  if (isLoading) return <div>Loading...</div>
  if (!word) return <div>Word not found</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Word Details</h1>
        <div className="space-x-2">
          <Button onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
          <Button variant="danger" onClick={handleDeleteWord}>
            Delete
          </Button>
        </div>
      </div>

      {isEditing ? (
        <Card className="p-6">
          <form onSubmit={handleUpdateWord} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Word</label>
              <input
                name="word"
                type="text"
                defaultValue={word.word}
                required
                className="mt-1 w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Translation</label>
              <input
                name="translation"
                type="text"
                defaultValue={word.translation}
                required
                className="mt-1 w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Pronunciation</label>
              <input
                name="pronunciation"
                type="text"
                defaultValue={word.pronunciation}
                className="mt-1 w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                name="notes"
                defaultValue={word.notes}
                className="mt-1 w-full p-2 border rounded"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Examples</label>
              <textarea
                name="examples"
                defaultValue={word.examples}
                className="mt-1 w-full p-2 border rounded"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tags</label>
              <input
                name="tags"
                type="text"
                defaultValue={word.tags?.join(', ')}
                className="mt-1 w-full p-2 border rounded"
                placeholder="Separate tags with commas"
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500">Word</div>
                <div className="text-lg font-medium">{word.word}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Translation</div>
                <div className="text-lg font-medium">{word.translation}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Pronunciation</div>
                <div className="text-lg font-medium">{word.pronunciation}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Notes</div>
                <div className="text-lg">{word.notes}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Examples</div>
                <div className="text-lg">{word.examples}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Tags</div>
                <div className="flex flex-wrap gap-2">
                  {word.tags?.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <WordPractice word={word} />
        </div>
      )}
    </div>
  )
} 