import { useState, FormEvent } from 'react'
import { Card, Button, LoadingSpinner } from '../components/common'
import { useVocabulary, useCreateVocabulary, useUpdateVocabulary, useDeleteVocabulary } from '../hooks/useApi'
import { VocabularyItem } from '../types/vocabulary'
import Notification from '../components/common/Notification'

type SortField = 'word' | 'translation' | 'group'
type SortOrder = 'asc' | 'desc'

export default function Vocabulary() {
  const { data: vocabulary, isLoading, isError, refetch } = useVocabulary()
  const [search, setSearch] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>('word')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingWord, setEditingWord] = useState<VocabularyItem | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)
  const [formError, setFormError] = useState('')
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null)

  const groups = vocabulary 
    ? [...new Set(vocabulary.map(v => v.group).filter((g): g is string => Boolean(g)))]
    : []

  const filteredAndSortedVocabulary = vocabulary
    ?.filter(word => 
      (!selectedGroup || word.group === selectedGroup) &&
      (search === '' || 
        word.word.toLowerCase().includes(search.toLowerCase()) ||
        word.translation.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      const aValue = a[sortField]?.toLowerCase() ?? ''
      const bValue = b[sortField]?.toLowerCase() ?? ''
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const createMutation = useCreateVocabulary()
  const updateMutation = useUpdateVocabulary()
  const deleteMutation = useDeleteVocabulary()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError('')

    const formData = new FormData(e.currentTarget)
    const wordData = {
      word: formData.get('word') as string,
      translation: formData.get('translation') as string,
      group: formData.get('group') as string,
    }

    if (!wordData.word || !wordData.translation) {
      setFormError('Word and translation are required')
      return
    }

    try {
      if (editingWord) {
        await updateMutation.mutateAsync({ ...wordData, id: editingWord.id })
        setNotification({ message: 'Word updated successfully', type: 'success' })
      } else {
        await createMutation.mutateAsync(wordData)
        setNotification({ message: 'Word added successfully', type: 'success' })
      }
      setShowAddModal(false)
      setEditingWord(null)
    } catch (error) {
      setFormError('Failed to save word')
      setNotification({ message: 'Failed to save word', type: 'error' })
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id)
      setShowDeleteConfirm(null)
      setNotification({ message: 'Word deleted successfully', type: 'success' })
    } catch (error) {
      setNotification({ message: 'Failed to delete word', type: 'error' })
    }
  }

  if (isLoading) return <LoadingSpinner />

  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Error loading vocabulary</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Vocabulary</h1>
        <Button onClick={() => setShowAddModal(true)}>Add Word</Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search words..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border rounded flex-grow"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedGroup(null)}
            className={`px-4 py-2 rounded ${!selectedGroup ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            All
          </button>
          {groups.map(group => (
            <button
              key={group}
              onClick={() => setSelectedGroup(group)}
              className={`px-4 py-2 rounded ${selectedGroup === group ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              {group}
            </button>
          ))}
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex gap-4">
        <button
          onClick={() => handleSort('word')}
          className={`px-4 py-2 rounded ${sortField === 'word' ? 'bg-gray-200' : ''}`}
        >
          Word {sortField === 'word' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button
          onClick={() => handleSort('translation')}
          className={`px-4 py-2 rounded ${sortField === 'translation' ? 'bg-gray-200' : ''}`}
        >
          Translation {sortField === 'translation' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button
          onClick={() => handleSort('group')}
          className={`px-4 py-2 rounded ${sortField === 'group' ? 'bg-gray-200' : ''}`}
        >
          Group {sortField === 'group' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
      </div>

      {/* Vocabulary List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAndSortedVocabulary?.map(word => (
          <Card key={word.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xl font-semibold">{word.word}</div>
                <div className="text-gray-600">{word.translation}</div>
                {word.group && (
                  <div className="mt-2 text-sm text-blue-600">{word.group}</div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingWord(word)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(word.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingWord) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <Card className="p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingWord ? 'Edit Word' : 'Add New Word'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="text-red-600 text-sm">{formError}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Word</label>
                <input
                  name="word"
                  type="text"
                  className="mt-1 px-4 py-2 w-full border rounded"
                  defaultValue={editingWord?.word}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Translation</label>
                <input
                  name="translation"
                  type="text"
                  className="mt-1 px-4 py-2 w-full border rounded"
                  defaultValue={editingWord?.translation}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Group</label>
                <input
                  name="group"
                  type="text"
                  className="mt-1 px-4 py-2 w-full border rounded"
                  defaultValue={editingWord?.group}
                />
              </div>
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingWord(null)
                    setFormError('')
                  }}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingWord ? 'Save Changes' : 'Add Word'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <Card className="p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Delete Word</h2>
            <p className="mb-4">Are you sure you want to delete this word?</p>
            <div className="flex justify-end gap-4">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={deleteMutation.isPending}
              >
                Delete
              </Button>
            </div>
          </Card>
        </div>
      )}

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  )
} 