import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Button, LoadingSpinner } from '../components/common'
import { useActivity, useUpdateActivity } from '../hooks/useApi'
import type { Activity, ActivityStep } from '../types/activities'

export default function ActivityEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: activity, isLoading, isError } = useActivity(Number(id))
  const updateMutation = useUpdateActivity()

  const [formData, setFormData] = useState<Partial<Activity>>({
    name: '',
    type: 'vocabulary',
    description: '',
    goals: [],
    steps: []
  })

  useEffect(() => {
    if (activity) {
      setFormData(activity)
    }
  }, [activity])

  const handleStepChange = (index: number, field: keyof ActivityStep, value: string) => {
    setFormData(prev => {
      const newSteps = [...(prev.steps || [])]
      newSteps[index] = { ...newSteps[index], [field]: value }
      return { ...prev, steps: newSteps }
    })
  }

  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [...(prev.steps || []), { prompt: '', hint: '' }]
    }))
  }

  const removeStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps?.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.steps?.length) return

    try {
      await updateMutation.mutateAsync({
        ...(formData as Activity),
        id: Number(id)
      })
      navigate(`/activities/${id}`)
    } catch (error) {
      console.error('Failed to update activity:', error)
    }
  }

  if (isLoading) return <LoadingSpinner />
  if (isError) return <div>Error loading activity</div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Edit Activity</h1>
        <Button variant="secondary" onClick={() => navigate(`/activities/${id}`)}>
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
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
                onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as Activity['type'] }))}
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

        {/* Steps */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">Steps</h2>
              <Button type="button" onClick={addStep}>
                Add Step
              </Button>
            </div>

            {formData.steps?.map((step, index) => (
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

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={updateMutation.isPending || !formData.name || !formData.steps?.length}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
} 