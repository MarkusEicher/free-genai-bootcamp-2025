import { useState, useEffect } from 'react'

interface VocabularySearchProps {
  onSearch: (query: string) => void
  onFilterGroup: (groupId: number | null) => void
  groups: Array<{ id: number; name: string }>
}

export default function VocabularySearch({ onSearch, onFilterGroup, groups }: VocabularySearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null)

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      onSearch(searchQuery)
    }, 300)

    return () => clearTimeout(debounceTimeout)
  }, [searchQuery, onSearch])

  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const groupId = e.target.value ? Number(e.target.value) : null
    setSelectedGroup(groupId)
    onFilterGroup(groupId)
  }

  return (
    <div className="flex gap-4 mb-6">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search vocabulary..."
        className="flex-1 p-2 border rounded-lg"
      />
      
      <select
        value={selectedGroup?.toString() || ''}
        onChange={handleGroupChange}
        className="p-2 border rounded-lg bg-white"
      >
        <option value="">All Groups</option>
        {groups.map(group => (
          <option key={group.id} value={group.id}>
            {group.name}
          </option>
        ))}
      </select>
    </div>
  )
} 