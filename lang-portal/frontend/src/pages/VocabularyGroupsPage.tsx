import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, LoadingSpinner } from '../components/common'
import { useVocabularyGroups, useCreateGroup, useDeleteGroup, useUpdateGroup, useGroupStats, useMergeGroups } from '../hooks/useApi'
import type { VocabularyGroup } from '../types/vocabulary'

export default function VocabularyGroupsPage() {
  const navigate = useNavigate()
  const [editingGroup, setEditingGroup] = useState<VocabularyGroup | null>(null)
  const [selectedWords, setSelectedWords] = useState<number[]>([])
  const [mergingGroup, setMergingGroup] = useState<VocabularyGroup | null>(null)
  
  const { data: groups, isLoading, isError } = useVocabularyGroups()
  const { data: groupStats } = useGroupStats()
  const createMutation = useCreateGroup()
  const deleteMutation = useDeleteGroup()
  const updateMutation = useUpdateGroup()
  const mergeMutation = useMergeGroups()

  const handleCreateGroup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    try {
      await createMutation.mutateAsync({
        name: formData.get('name') as string,
        description: formData.get('description') as string
      })
      e.currentTarget.reset()
    } catch (error) {
      console.error('Failed to create group:', error)
    }
  }

  const handleDeleteGroup = async (groupId: number) => {
    if (window.confirm('Are you sure you want to delete this group?')) {
      try {
        await deleteMutation.mutateAsync(groupId)
      } catch (error) {
        console.error('Failed to delete group:', error)
      }
    }
  }

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingGroup || !editingGroup.name.trim()) return

    try {
      await updateMutation.mutateAsync({
        id: editingGroup.id,
        name: editingGroup.name
      })
      setEditingGroup(null)
    } catch (error) {
      console.error('Failed to update group:', error)
    }
  }

  const handleBulkMove = async (targetGroupId: number) => {
    if (!selectedWords.length) return
    try {
      await fetch('/api/vocabulary/bulk-move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordIds: selectedWords,
          targetGroupId
        })
      })
      setSelectedWords([])
    } catch (error) {
      console.error('Failed to move words:', error)
    }
  }

  const handleMergeGroup = async (targetGroupId: number) => {
    if (!mergingGroup || targetGroupId === mergingGroup.id) return
    
    if (window.confirm(`Are you sure you want to merge "${mergingGroup.name}" into this group? This cannot be undone.`)) {
      try {
        await mergeMutation.mutateAsync({
          sourceGroupId: mergingGroup.id,
          targetGroupId
        })
        setMergingGroup(null)
      } catch (error) {
        console.error('Failed to merge groups:', error)
      }
    }
  }

  if (isLoading) return <LoadingSpinner />
  if (isError) return <div>Error loading groups</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Vocabulary Groups</h1>
        <Button
          variant="secondary"
          onClick={() => navigate('/vocabulary')}
        >
          Back to Vocabulary
        </Button>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Groups</h3>
          <p className="text-2xl font-bold">{groups?.length || 0}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Words</h3>
          <p className="text-2xl font-bold">{groupStats?.totalWords || 0}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Avg. Words per Group</h3>
          <p className="text-2xl font-bold">
            {groups?.length 
              ? Math.round((groupStats?.totalWords || 0) / groups.length) 
              : 0}
          </p>
        </Card>
      </div>

      {/* Create New Group Form */}
      <Card className="p-6">
        <form onSubmit={handleCreateGroup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              name="name"
              type="text"
              required
              className="mt-1 w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              className="mt-1 w-full p-2 border rounded"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditingGroup(null)}
            >
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Card>

      {/* Groups List */}
      <div className="grid gap-4">
        {groups?.map((group: VocabularyGroup) => (
          <Card key={group.id} className="p-4">
            {editingGroup?.id === group.id ? (
              <form onSubmit={handleUpdateGroup} className="flex gap-4">
                <input
                  type="text"
                  value={editingGroup.name}
                  onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                  className="flex-1 p-2 border rounded-lg"
                />
                <Button type="submit" disabled={updateMutation.isPending}>
                  Save
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setEditingGroup(null)}
                >
                  Cancel
                </Button>
              </form>
            ) : (
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">{group.name}</h3>
                  <div className="text-sm text-gray-500 space-y-1">
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      <div>{group.words.length} words</div>
                      <div>{group.mastered} mastered</div>
                    </div>
                    {groupStats?.groups?.[group.id] && (
                      <p>
                        Avg. Progress: {Math.round(groupStats.groups[group.id].avgProgress * 100)}%
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {mergingGroup ? (
                    mergingGroup.id !== group.id ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleMergeGroup(group.id)}
                      >
                        Merge Into This Group
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setMergingGroup(null)}
                      >
                        Cancel Merge
                      </Button>
                    )
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setMergingGroup(group)}
                    >
                      Merge
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditingGroup(group)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/vocabulary?group=${group.id}`)}
                  >
                    View Words
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteGroup(group.id)}
                    disabled={deleteMutation.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}

        {groups?.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No groups created yet</p>
            <p className="text-sm text-gray-400">
              Create a group to organize your vocabulary
            </p>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedWords.length > 0 && (
        <Card className="p-4 mt-4 bg-blue-50">
          <div className="flex justify-between items-center">
            <p className="text-sm">
              {selectedWords.length} words selected
            </p>
            <div className="flex gap-2">
              <select
                onChange={(e) => handleBulkMove(Number(e.target.value))}
                className="p-2 border rounded-lg"
              >
                <option value="">Move to group...</option>
                {groups?.map((group: VocabularyGroup) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedWords([])}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
} 