import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, LoadingSpinner } from '../common'
import { useVocabulary, useVocabularyGroups } from '../../hooks/useApi'
import type { VocabularyItem, VocabularyGroup } from '../../types/vocabulary'

interface VocabularyListProps {
  groupId?: number
  onItemClick?: (id: number) => void
  showGroups?: boolean
}

export default function VocabularyList({ 
  groupId, 
  onItemClick,
  showGroups = true 
}: VocabularyListProps) {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<number | null>(groupId || null)
  
  const { 
    data: vocabulary, 
    isLoading: isLoadingVocab,
    isError: isVocabError 
  } = useVocabulary(selectedGroup)
  
  const {
    data: groups,
    isLoading: isLoadingGroups
  } = useVocabularyGroups()

  const filteredVocabulary = vocabulary?.filter((item: VocabularyItem) => 
    item.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.translation.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoadingVocab || isLoadingGroups) return <LoadingSpinner />
  if (isVocabError) return <div>Error loading vocabulary</div>

  return (
    <div className="space-y-6">
      {/* Search and Filter Section */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search vocabulary..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border rounded-lg"
          />
        </div>
        
        {showGroups && groups && (
          <select
            value={selectedGroup || ''}
            onChange={(e) => setSelectedGroup(e.target.value ? Number(e.target.value) : null)}
            className="p-2 border rounded-lg"
          >
            <option value="">All Groups</option>
            {groups.map((group: VocabularyGroup) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        )}
        
        <Button
          onClick={() => navigate('/vocabulary/new')}
          className="whitespace-nowrap"
        >
          Add New
        </Button>
      </div>

      {/* Vocabulary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVocabulary?.map((item: VocabularyItem) => (
          <Card
            key={item.id}
            onClick={() => onItemClick?.(item.id)}
            className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-medium">{item.word}</h3>
              <span className="text-sm text-gray-500">
                {item.group?.name || 'No Group'}
              </span>
            </div>
            
            <p className="text-gray-700">{item.translation}</p>
            
            {item.examples && (
              <p className="text-sm text-gray-500 mt-2 italic">
                {item.examples[0]}
              </p>
            )}
            
            <div className="flex gap-2 mt-4">
              {item.tags?.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex justify-between items-center mt-4 pt-2 border-t">
              <div className="text-sm text-gray-500">
                Progress: {Math.round(item.progress * 100)}%
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/vocabulary/${item.id}/edit`)
                }}
              >
                Edit
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredVocabulary?.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">
            {searchTerm 
              ? 'No vocabulary items found matching your search'
              : 'No vocabulary items yet'}
          </p>
          <Button onClick={() => navigate('/vocabulary/new')}>
            Add Your First Word
          </Button>
        </div>
      )}
    </div>
  )
} 