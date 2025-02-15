import { Card, Button } from './common'
import { useAddWord } from '../hooks/useApi'

interface AddWordFormProps {
  groupId: number
  onComplete: () => void
}

export function AddWordForm({ groupId, onComplete }: AddWordFormProps) {
  const addMutation = useAddWord()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    try {
      await addMutation.mutateAsync({
        groupId,
        word: formData.get('word') as string,
        translation: formData.get('translation') as string,
        pronunciation: formData.get('pronunciation') as string,
        notes: formData.get('notes') as string,
        examples: formData.get('examples') as string,
        tags: (formData.get('tags') as string)?.split(',').map(t => t.trim()).filter(Boolean) || []
      })
      onComplete()
    } catch (error) {
      console.error('Failed to add word:', error)
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-medium mb-4">Add New Word</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Word</label>
          <input
            name="word"
            type="text"
            required
            className="mt-1 w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Translation</label>
          <input
            name="translation"
            type="text"
            required
            className="mt-1 w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Pronunciation</label>
          <input
            name="pronunciation"
            type="text"
            className="mt-1 w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            name="notes"
            className="mt-1 w-full p-2 border rounded"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Examples</label>
          <textarea
            name="examples"
            className="mt-1 w-full p-2 border rounded"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Tags</label>
          <input
            name="tags"
            type="text"
            className="mt-1 w-full p-2 border rounded"
            placeholder="Separate tags with commas"
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit">Add Word</Button>
        </div>
      </form>
    </Card>
  )
} 