import { useState, useMemo, useEffect } from 'react'
import { useVocabulary } from '../hooks/useApi'
import LoadingState from '../components/LoadingState'
import Button from '../components/Button'
import Card from '../components/Card'
import Modal from '../components/Modal'
import VocabularyImport from '../components/vocabulary/VocabularyImport'
import VocabularyExport from '../components/vocabulary/VocabularyExport'
import VocabularySearch from '../components/vocabulary/VocabularySearch'
import { useNotification } from '../contexts/NotificationContext'
import Pagination from '../components/Pagination'

interface VocabularyItem {
  id: number
  word: string
  translation: string
  groupId?: number
}

export default function VocabularyPage() {
  const [showImport, setShowImport] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  
  const { data: vocabulary, isLoading, mutate } = useVocabulary()
  const { showNotification } = useNotification()

  const filteredVocabulary = useMemo(() => {
    if (!vocabulary) return []

    return vocabulary.filter((item: VocabularyItem) => {
      const matchesSearch = searchQuery === '' || 
        item.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.translation.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesGroup = selectedGroup === null || item.groupId === selectedGroup

      return matchesSearch && matchesGroup
    })
  }, [vocabulary, searchQuery, selectedGroup])

  const paginatedVocabulary = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredVocabulary.slice(startIndex, endIndex)
  }, [filteredVocabulary, currentPage])

  const totalPages = Math.ceil(filteredVocabulary.length / itemsPerPage)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedGroup])

  const handleImport = async (data: Array<{ word: string; translation: string }>) => {
    try {
      // API call to import vocabulary
      await mutate([...vocabulary, ...data])
      showNotification('Vocabulary imported successfully', 'success')
    } catch (error) {
      showNotification('Failed to import vocabulary', 'error')
    }
  }

  if (isLoading) return <LoadingState />

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Vocabulary</h1>
        <div className="space-x-4">
          <Button onClick={() => setShowImport(true)} variant="secondary">
            Import
          </Button>
          <Button onClick={() => setShowExport(true)} variant="secondary">
            Export
          </Button>
        </div>
      </div>

      <VocabularySearch
        onSearch={setSearchQuery}
        onFilterGroup={setSelectedGroup}
        groups={[
          { id: 1, name: 'Basics' },
          { id: 2, name: 'Advanced' }
          // TODO: Replace with actual groups from API
        ]}
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
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
              {paginatedVocabulary.map((item: VocabularyItem) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{item.word}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.translation}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.groupId ? 'Group ' + item.groupId : 'Ungrouped'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Button variant="secondary" size="sm">
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </Card>

      <Modal isOpen={showImport} onClose={() => setShowImport(false)}>
        <VocabularyImport
          onImport={handleImport}
          onClose={() => setShowImport(false)}
        />
      </Modal>

      <Modal isOpen={showExport} onClose={() => setShowExport(false)}>
        <VocabularyExport
          vocabulary={vocabulary || []}
          onClose={() => setShowExport(false)}
        />
      </Modal>
    </div>
  )
}