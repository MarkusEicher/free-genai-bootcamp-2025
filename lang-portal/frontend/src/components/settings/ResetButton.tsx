import { useState } from 'react'

interface ResetButtonProps {
  onReset: () => Promise<void>;
}

export default function ResetButton({ onReset }: ResetButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false)

  const handleReset = async () => {
    if (!isConfirming) {
      setIsConfirming(true)
      return
    }

    try {
      await onReset()
      setIsConfirming(false)
    } catch (error) {
      console.error('Reset failed:', error)
      setIsConfirming(false)
    }
  }

  return (
    <button
      onClick={handleReset}
      className={`px-4 py-2 rounded-md text-white ${
        isConfirming 
          ? 'bg-red-600 hover:bg-red-700' 
          : 'bg-gray-600 hover:bg-gray-700'
      }`}
    >
      {isConfirming ? 'Confirm Reset' : 'Reset Progress'}
    </button>
  )
} 