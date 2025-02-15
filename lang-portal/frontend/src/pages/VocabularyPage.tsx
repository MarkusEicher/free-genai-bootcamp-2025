import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, LoadingSpinner } from '../components/common'
import VocabularyList from '../components/vocabulary/VocabularyList'
import { useVocabularyStats, useVocabularyGroups, useCreateVocabularyGroup } from '../hooks/useApi'
import type { VocabularyGroup } from '../types/vocabulary'

export default function VocabularyPage() {
  const navigate = useNavigate()
  const { data: stats } = useVocabularyStats()
  const [isCreating, setIsCreating] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const { data: groups, isLoading } = useVocabularyGroups()
  const createMutation = useCreateVocabularyGroup()

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupName.trim()) return

    try {
      await createMutation.mutateAsync({ name: newGroupName })
      setNewGroupName('')
      setIsCreating(false)
    } catch (error) {
      console.error('Failed to create group:', error)
    }
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Vocabulary</h1>
        <Button onClick={() => navigate('/vocabulary/new')}>
          Add New Word
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-500">Total Words</div>
          <div className="text-2xl font-bold">{stats?.totalWords || 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">Mastered</div>
          <div className="text-2xl font-bold text-green-600">
            {stats?.masteredWords || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">In Progress</div>
          <div className="text-2xl font-bold text-yellow-600">
            {stats?.inProgressWords || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">To Review</div>
          <div className="text-2xl font-bold text-red-600">
            {stats?.toReviewWords || 0}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          variant="secondary"
          onClick={() => navigate('/vocabulary/practice')}
          className="w-full"
        >
          Practice Words
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate('/vocabulary/groups')}
          className="w-full"
        >
          Manage Groups
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate('/vocabulary/review')}
          className="w-full"
        >
          Review Due Words
        </Button>
      </div>

      {/* Main Vocabulary List */}
      <VocabularyList
        onItemClick={(id) => navigate(`/vocabulary/${id}`)}
        showGroups={true}
      />

      {isCreating && (
        <Card className="p-6">
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Group Name
              </label>
              <input
                type="text"
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                className="mt-1 w-full p-2 border rounded-lg"
                placeholder="Enter group name..."
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsCreating(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || !newGroupName.trim()}
              >
                Create Group
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups?.map((group: VocabularyGroup) => (
          <Card
            key={group.id}
            className="p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => window.location.href = `/vocabulary/${group.id}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{group.name}</h3>
                <p className="text-sm text-gray-500">
                  {group.wordCount} words
                </p>
              </div>
              <div className="text-sm text-gray-500">
                Last updated: {new Date(group.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
} 