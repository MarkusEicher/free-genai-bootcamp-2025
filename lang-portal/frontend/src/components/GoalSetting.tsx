import { useState } from 'react'
import { Card, Button } from './common'
import { useUpdateGoals } from '../hooks/useApi'

interface Goal {
  type: 'daily' | 'weekly'
  target: number
  metric: 'sessions' | 'duration' | 'score'
}

interface GoalSettingProps {
  currentGoals: Goal[]
  onUpdate: () => void
}

export function GoalSetting({ currentGoals, onUpdate }: GoalSettingProps) {
  const [goals, setGoals] = useState<Goal[]>(currentGoals)
  const updateMutation = useUpdateGoals()

  const handleSave = async () => {
    await updateMutation.mutateAsync(goals)
    onUpdate()
  }

  const addGoal = () => {
    setGoals([...goals, { type: 'daily', target: 1, metric: 'sessions' }])
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Learning Goals</h2>
        <Button onClick={addGoal}>Add Goal</Button>
      </div>

      <div className="space-y-4">
        {goals.map((goal, index) => (
          <div key={index} className="flex gap-4 items-center">
            <select
              value={goal.type}
              onChange={e => {
                const newGoals = [...goals]
                newGoals[index] = { ...goal, type: e.target.value as 'daily' | 'weekly' }
                setGoals(newGoals)
              }}
              className="p-2 border rounded"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>

            <input
              type="number"
              min="1"
              value={goal.target}
              onChange={e => {
                const newGoals = [...goals]
                newGoals[index] = { ...goal, target: Number(e.target.value) }
                setGoals(newGoals)
              }}
              className="p-2 border rounded w-24"
            />

            <select
              value={goal.metric}
              onChange={e => {
                const newGoals = [...goals]
                newGoals[index] = { ...goal, metric: e.target.value as 'sessions' | 'duration' | 'score' }
                setGoals(newGoals)
              }}
              className="p-2 border rounded"
            >
              <option value="sessions">Sessions</option>
              <option value="duration">Minutes</option>
              <option value="score">Average Score</option>
            </select>

            <Button
              variant="danger"
              onClick={() => setGoals(goals.filter((_, i) => i !== index))}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Goals'}
        </Button>
      </div>
    </Card>
  )
} 