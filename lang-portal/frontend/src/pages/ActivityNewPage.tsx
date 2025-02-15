import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button } from '../components/common'
import { useCreateActivity } from '../hooks/useApi'
import type { ActivityType } from '../types/activities'
import { ActivityPreview } from '../components/ActivityPreview'

export default function ActivityNewPage() {
  const navigate = useNavigate()
  const createMutation = useCreateActivity()

  const [formData, setFormData] = useState<{
    name: string;
    type: ActivityType;
    description: string;
    goals: string[];
    steps: { prompt: string; hint?: string; }[];
  }>({
    name: '',
    type: 'vocabulary',
    description: '',
    goals: [],
    steps: []
  })

  const [isPreview, setIsPreview] = useState(false)
  const [previewStep, setPreviewStep] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.steps.length) return

    try {
      const newActivity = await createMutation.mutateAsync(formData)
      navigate(`/activities/${newActivity.id}`)
    } catch (error) {
      console.error('Failed to create activity:', error)
    }
  }

  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, { prompt: '', hint: '' }]
    }))
  }

  const removeStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index)
    }))
  }

  const handleStepChange = (index: number, field: 'prompt' | 'hint', value: string) => {
    setFormData(prev => {
      const newSteps = [...prev.steps]
      newSteps[index] = { ...newSteps[index], [field]: value }
      return { ...prev, steps: newSteps }
    })
  }

  const addGoal = () => {
    setFormData(prev => ({
      ...prev,
      goals: [...prev.goals, '']
    }))
  }

  const removeGoal = (index: number) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.filter((_, i) => i !== index)
    }))
  }

  if (isPreview) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Preview: {formData.name}</h1>
          <Button onClick={() => setIsPreview(false)}>
            Exit Preview
          </Button>
        </div>
        
        <ActivityPreview
          steps={formData.steps}
          currentStep={previewStep}
        />
        
        <div className="flex justify-center gap-4">
          <Button
            variant="secondary"
            onClick={() => setPreviewStep(prev => Math.max(0, prev - 1))}
            disabled={previewStep === 0}
          >
            Previous Step
          </Button>
          <Button
            onClick={() => setPreviewStep(prev => Math.min(formData.steps.length - 1, prev + 1))}
            disabled={previewStep === formData.steps.length - 1}
          >
            Next Step
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Create New Activity</h1>
        <Button variant="secondary" onClick={() => navigate('/activities')}>
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Activity Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 w-full p-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Type
              </label>
              <select
                value={formData.type}
                onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as ActivityType }))}
                className="mt-1 w-full p-2 border rounded-lg"
              >
                <option value="vocabulary">Vocabulary</option>
                <option value="grammar">Grammar</option>
                <option value="reading">Reading</option>
                <option value="listening">Listening</option>
                <option value="speaking">Speaking</option>
                <option value="writing">Writing</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 w-full p-2 border rounded-lg"
                rows={3}
              />
            </div>
          </div>
        </Card>

        {/* Goals Section */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">Learning Goals</h2>
              <Button type="button" onClick={addGoal}>
                Add Goal
              </Button>
            </div>

            {formData.goals.map((goal, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={goal}
                  onChange={e => {
                    const newGoals = [...formData.goals]
                    newGoals[index] = e.target.value
                    setFormData(prev => ({ ...prev, goals: newGoals }))
                  }}
                  className="flex-1 p-2 border rounded-lg"
                  placeholder="Enter learning goal..."
                />
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => removeGoal(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Steps Section */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">Steps</h2>
              <Button type="button" onClick={addStep}>
                Add Step
              </Button>
            </div>

            {formData.steps.map((step, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">Step {index + 1}</h3>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => removeStep(index)}
                  >
                    Remove
                  </Button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Prompt
                  </label>
                  <textarea
                    value={step.prompt}
                    onChange={e => handleStepChange(index, 'prompt', e.target.value)}
                    className="mt-1 w-full p-2 border rounded-lg"
                    rows={2}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Hint (optional)
                  </label>
                  <input
                    type="text"
                    value={step.hint || ''}
                    onChange={e => handleStepChange(index, 'hint', e.target.value)}
                    className="mt-1 w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsPreview(true)}
            disabled={!formData.steps.length}
          >
            Preview
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending || !formData.name || !formData.steps.length}
          >
            {createMutation.isPending ? 'Creating...' : 'Create Activity'}
          </Button>
        </div>
      </form>
    </div>
  )
} 