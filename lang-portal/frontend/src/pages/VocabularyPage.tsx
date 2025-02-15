import { useState } from 'react'
import { useVocabulary } from '../hooks/useApi'
import LoadingState from '../components/LoadingState'
import Button from '../components/Button'
import Card from '../components/Card'

interface VocabularyGroup {
  id: number
  name: string
  description?: string
  wordCount: number
}

interface VocabularyItem {
  id: number
  word: string
  translation: string
  groupId?: number
}

export default function VocabularyPage() {
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null)
  const [newWord, setNewWord] = useState('')
  const [newTranslation, setNewTranslation] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const { data: vocabulary, isLoading } = useVocabulary()
  
  // Temporary mock data for groups until API is ready
  const groups: VocabularyGroup[] = [
    { id: 1, name: 'Basics', wordCount: 50 },
    { id: 2, name: 'Advanced', wordCount: 30 },
  ]

  if (isLoading) {
    return <LoadingState />
  }

  const filteredVocabulary = vocabulary?.filter((item: VocabularyItem) => 
    (!selectedGroup || item.groupId === selectedGroup) &&
    (item.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
     item.translation.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Sidebar with groups */}
        <div className="md:col-span-1">
          <Card className="p-4">
            <h2 className="text-lg font-medium mb-4">Groups</h2>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedGroup(null)}
                className={`w-full text-left px-3 py-2 rounded ${
                  selectedGroup === null ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                }`}
              >
                All Words
              </button>
              {groups.map((group: VocabularyGroup) => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroup(group.id)}
                  className={`w-full text-left px-3 py-2 rounded ${
                    selectedGroup === group.id ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                  }`}
                >
                  {group.name}
                  <span className="text-sm text-gray-500 ml-2">
                    ({group.wordCount})
                  </span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Main content */}
        <div className="md:col-span-3">
          <Card className="p-4 mb-4">
            <form className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder="New word"
                className="p-2 border rounded"
              />
              <input
                type="text"
                value={newTranslation}
                onChange={(e) => setNewTranslation(e.target.value)}
                placeholder="Translation"
                className="p-2 border rounded"
              />
              <Button type="submit">Add Word</Button>
            </form>
          </Card>

          <Card className="p-4">
            <div className="mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search vocabulary..."
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Word
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Translation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Group
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVocabulary?.map((item: VocabularyItem) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{item.word}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.translation}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {groups.find((g: VocabularyGroup) => g.id === item.groupId)?.name || 'Ungrouped'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button
                          variant="secondary"
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}