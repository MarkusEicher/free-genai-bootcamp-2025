import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Button } from '../components/common'
import { useVocabularyGroup, useUpdateGroup, useDeleteGroup } from '../hooks/useApi'
import { WordList } from '../components/WordList'
import { AddWordForm } from '../components/AddWordForm'

export default function VocabularyGroupPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: group, isLoading } = useVocabularyGroup(Number(id))
  const updateMutation = useUpdateGroup()
  const deleteMutation = useDeleteGroup()
  const [isEditing, setIsEditing] = useState(false)
  const [showAddWord, setShowAddWord] = useState(false)

  const handleUpdateGroup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    try {
      await updateMutation.mutateAsync({
        id: Number(id),
        name: formData.get('name') as string,
        description: formData.get('description') as string
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update group:', error)
    }
  }

  const handleDeleteGroup = async () => {
    if (!confirm('Are you sure you want to delete this group?')) return
    
    try {
      await deleteMutation.mutateAsync(Number(id))
      navigate('/vocabulary')
    } catch (error) {
      console.error('Failed to delete group:', error)
    }
  }

  if (isLoading) return <div>Loading...</div>
  if (!group) return <div>Group not found</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Vocabulary Group</h1>
        <div className="space-x-2">
          <Button onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? 'Cancel' : 'Edit Group'}
          </Button>
          <Button onClick={() => setShowAddWord(!showAddWord)}>
            {showAddWord ? 'Cancel' : 'Add Word'}
          </Button>
          <Button variant="danger" onClick={handleDeleteGroup}>
            Delete Group
          </Button>
        </div>
      </div>

      {isEditing ? (
        <Card className="p-6">
          <form onSubmit={handleUpdateGroup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                name="name"
                type="text"
                defaultValue={group.name}
                required
                className="mt-1 w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                defaultValue={group.description}
                className="mt-1 w-full p-2 border rounded"
                rows={3}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500">Name</div>
              <div className="text-lg font-medium">{group.name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Description</div>
              <div className="text-lg">{group.description}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Progress</div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(group.mastered / group.words.length) * 100}%` }}
                />
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {group.mastered} of {group.words.length} words mastered
              </div>
            </div>
          </div>
        </Card>
      )}

      {showAddWord && (
        <AddWordForm groupId={Number(id)} onComplete={() => setShowAddWord(false)} />
      )}

      <WordList words={group.words} />
    </div>
  )
} 