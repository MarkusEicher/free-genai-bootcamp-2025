import { Card } from './common'
import type { ActivityStep } from '../types/activities'

interface PreviewProps {
  steps: ActivityStep[]
  currentStep: number
}

export function ActivityPreview({ steps, currentStep }: PreviewProps) {
  const step = steps[currentStep]
  
  return (
    <Card className="p-6 bg-gray-50">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">Preview: Step {currentStep + 1}</h3>
          <span className="text-sm text-gray-500">
            {currentStep + 1} of {steps.length}
          </span>
        </div>

        <div className="p-4 bg-white rounded-lg shadow-sm">
          <div className="font-medium mb-2">Prompt:</div>
          <p>{step.prompt}</p>
          
          {step.hint && (
            <>
              <div className="font-medium mt-4 mb-2">Hint:</div>
              <p className="text-gray-600">{step.hint}</p>
            </>
          )}
        </div>

        <div className="flex justify-between">
          <button
            className="text-blue-600"
            onClick={() => window.history.back()}
          >
            ← Back to Edit
          </button>
        </div>
      </div>
    </Card>
  )
} 