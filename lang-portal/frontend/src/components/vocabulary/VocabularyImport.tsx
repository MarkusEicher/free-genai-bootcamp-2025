import { useState } from 'react'
import { useNotification } from '../../contexts/NotificationContext'
import Button from '../Button'

interface VocabularyImportProps {
  onImport: (data: Array<{ word: string; translation: string }>) => Promise<void>
  onClose: () => void
}

export default function VocabularyImport({ onImport, onClose }: VocabularyImportProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { showNotification } = useNotification()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile)
    } else {
      showNotification('Please select a valid CSV file', 'error')
    }
  }

  const handleImport = async () => {
    if (!file) return

    setIsLoading(true)
    try {
      const text = await file.text()
      const rows = text.split('\n')
      const data = rows
        .map(row => {
          const [word, translation] = row.split(',').map(s => s.trim())
          return word && translation ? { word, translation } : null
        })
        .filter((row): row is { word: string; translation: string } => row !== null)

      if (data.length === 0) {
        throw new Error('No valid data found in file')
      }

      await onImport(data)
      showNotification(`Successfully imported ${data.length} words`, 'success')
      onClose()
    } catch (error) {
      showNotification('Failed to import vocabulary', 'error')
    }
    setIsLoading(false)
  }

  return (
    <div className="p-6">
      <h2 className="text-lg font-medium mb-4">Import Vocabulary</h2>
      <p className="text-gray-600 mb-4">
        Upload a CSV file with words and translations (format: word,translation)
      </p>
      
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="mb-4"
      />
      
      <div className="flex justify-end space-x-4">
        <Button onClick={onClose} variant="secondary">
          Cancel
        </Button>
        <Button
          onClick={handleImport}
          disabled={!file || isLoading}
        >
          {isLoading ? 'Importing...' : 'Import'}
        </Button>
      </div>
    </div>
  )
} 