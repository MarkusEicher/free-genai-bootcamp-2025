import Button from '../Button'

interface VocabularyExportProps {
  vocabulary: Array<{ word: string; translation: string }>
  onClose: () => void
}

export default function VocabularyExport({ vocabulary, onClose }: VocabularyExportProps) {
  const handleExport = () => {
    const csvContent = vocabulary
      .map(({ word, translation }) => `${word},${translation}`)
      .join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'vocabulary.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    onClose()
  }

  return (
    <div className="p-6">
      <h2 className="text-lg font-medium mb-4">Export Vocabulary</h2>
      <p className="text-gray-600 mb-4">
        Download your vocabulary as a CSV file
      </p>
      
      <div className="flex justify-end space-x-4">
        <Button onClick={onClose} variant="secondary">
          Cancel
        </Button>
        <Button onClick={handleExport}>
          Export
        </Button>
      </div>
    </div>
  )
} 